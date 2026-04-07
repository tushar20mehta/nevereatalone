import { useEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'

export default function DinnerMap({ dinners = [], onDinnerClick }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(null)

  // Load Leaflet CSS + JS dynamically
  useEffect(() => {
    if (window.L) { setLoaded(true); return }

    const css = document.createElement('link')
    css.rel = 'stylesheet'
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(css)

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => setLoaded(true)
    script.onerror = () => setError('Leaflet konnte nicht geladen werden.')
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(css)
      document.head.removeChild(script)
    }
  }, [])

  // Initialize map + geocode dinners
  useEffect(() => {
    if (!loaded || !mapRef.current) return
    const L = window.L

    // Create map if not exists
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([51.1657, 10.4515], 6)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19
      }).addTo(mapInstanceRef.current)
    }

    const map = mapInstanceRef.current

    // Clear old markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) map.removeLayer(layer)
    })

    // Geocode each dinner location and add markers
    const bounds = []

    dinners.forEach(async (dinner) => {
      const location = dinner.location || dinner.address
      if (!location) return

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`,
          { headers: { 'Accept-Language': 'de' } }
        )
        const data = await res.json()
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat)
          const lon = parseFloat(data[0].lon)

          const marker = L.marker([lat, lon]).addTo(map)
          marker.bindPopup(
            `<div style="min-width:180px">` +
            `<strong style="font-size:14px">${dinner.title || 'Dinner'}</strong><br/>` +
            `<span style="color:#6b7280;font-size:12px">${dinner.cuisine || ''}</span><br/>` +
            `<span style="font-size:12px">${dinner.date || ''}${dinner.time ? ', ' + dinner.time : ''}</span><br/>` +
            `<span style="font-size:12px">${location}</span><br/>` +
            `<span style="font-size:12px">${(dinner.guests || []).length}/${dinner.maxGuests || '?'} Gäste</span>` +
            `</div>`
          )

          if (onDinnerClick) {
            marker.on('click', () => onDinnerClick(dinner))
          }

          bounds.push([lat, lon])
          if (bounds.length > 1) {
            map.fitBounds(bounds, { padding: [40, 40] })
          } else if (bounds.length === 1) {
            map.setView([lat, lon], 13)
          }
        }
      } catch (err) {
        // Geocoding failed for this dinner, skip
      }
    })
  }, [loaded, dinners, onDinnerClick])

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  if (error) {
    return (
      <div className="map-placeholder">
        <MapPin size={40} />
        <p>{error}</p>
      </div>
    )
  }

  if (!loaded) {
    return (
      <div className="map-placeholder">
        <div className="spinner" />
        <p>Karte wird geladen...</p>
      </div>
    )
  }

  return <div ref={mapRef} className="dinner-map" />
}
