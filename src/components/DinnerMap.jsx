import { useEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

let mapsLoadPromise = null

function loadGoogleMaps() {
  if (window.google && window.google.maps) return Promise.resolve()
  if (mapsLoadPromise) return mapsLoadPromise

  mapsLoadPromise = new Promise((resolve, reject) => {
    if (!GOOGLE_MAPS_API_KEY) {
      reject(new Error('No API key'))
      return
    }
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
  return mapsLoadPromise
}

export default function DinnerMap({ dinners, onDinnerClick }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const [error, setError] = useState(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setError('Google Maps API Key fehlt. Bitte VITE_GOOGLE_MAPS_API_KEY in .env setzen.')
      return
    }

    loadGoogleMaps()
      .then(() => {
        if (!mapRef.current) return
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: 51.1657, lng: 10.4515 },
          zoom: 6,
          styles: [
            { featureType: 'poi', stylers: [{ visibility: 'simplified' }] },
            { featureType: 'transit', stylers: [{ visibility: 'off' }] }
          ],
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false
        })
        mapInstanceRef.current = map
        setMapLoaded(true)
      })
      .catch(() => {
        setError('Google Maps konnte nicht geladen werden.')
      })
  }, [])

  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return

    // Clear existing markers
    markersRef.current.forEach(m => m.setMap(null))
    markersRef.current = []

    const geocoder = new window.google.maps.Geocoder()
    const bounds = new window.google.maps.LatLngBounds()
    let hasValidLocation = false

    dinners.forEach((dinner) => {
      const locationStr = dinner.address || dinner.location
      if (!locationStr) return

      geocoder.geocode({ address: locationStr + ', Deutschland' }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const position = results[0].geometry.location
          const marker = new window.google.maps.Marker({
            position,
            map: mapInstanceRef.current,
            title: dinner.title,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#e85d04',
              fillOpacity: 0.9,
              strokeColor: '#fff',
              strokeWeight: 2
            }
          })

          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding:8px;max-width:200px;font-family:Inter,sans-serif">
                <strong style="font-size:14px">${dinner.title}</strong>
                <p style="margin:4px 0;font-size:12px;color:#666">${dinner.cuisine}</p>
                <p style="margin:4px 0;font-size:12px">${dinner.date || ''} ${dinner.time ? '• ' + dinner.time : ''}</p>
                <p style="margin:4px 0;font-size:12px;color:#666">${locationStr}</p>
              </div>
            `
          })

          marker.addListener('click', () => {
            infoWindow.open(mapInstanceRef.current, marker)
            if (onDinnerClick) onDinnerClick(dinner)
          })

          markersRef.current.push(marker)
          bounds.extend(position)
          hasValidLocation = true

          if (hasValidLocation && markersRef.current.length === dinners.filter(d => d.address || d.location).length) {
            mapInstanceRef.current.fitBounds(bounds)
            if (markersRef.current.length === 1) {
              mapInstanceRef.current.setZoom(13)
            }
          }
        }
      })
    })
  }, [dinners, mapLoaded, onDinnerClick])

  if (error) {
    return (
      <div className="map-placeholder">
        <MapPin size={32} />
        <p>{error}</p>
        <p className="map-hint">Füge <code>VITE_GOOGLE_MAPS_API_KEY</code> in deiner <code>.env</code> Datei hinzu.</p>
      </div>
    )
  }

  return <div ref={mapRef} className="dinner-map" />
}
