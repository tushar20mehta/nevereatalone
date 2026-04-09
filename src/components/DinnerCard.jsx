import { useState, useEffect } from 'react'
import { Calendar, MapPin, Users, Instagram } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

export default function DinnerCard({ dinner }) {
  const navigate = useNavigate()
  const [hostInstagram, setHostInstagram] = useState('')

  useEffect(() => {
    if (!dinner.hostId) return
    const fetchHost = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', dinner.hostId))
        if (snap.exists() && snap.data().instagram) {
          setHostInstagram(snap.data().instagram)
        }
      } catch (e) { /* ignore */ }
    }
    fetchHost()
  }, [dinner.hostId])

  return (
    <div
      className="dinner-card"
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/dinner/${dinner.id}`)}
      onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/dinner/${dinner.id}`) }}
      style={{ cursor: 'pointer' }}
    >
      {dinner.imageUrl && (
        <img src={dinner.imageUrl} alt={dinner.title} className="dinner-card-image" />
      )}
      <div className="dinner-card-body">
        <span className="dinner-card-cuisine">{dinner.cuisine}</span>
        <h3>{dinner.title}</h3>
        {dinner.date && (
          <p className="dinner-card-info"><Calendar size={14} /> {dinner.date}</p>
        )}
        {dinner.location && (
          <p className="dinner-card-info"><MapPin size={14} /> {dinner.location}</p>
        )}
        {dinner.maxGuests && (
          <p className="dinner-card-info"><Users size={14} /> Max. {dinner.maxGuests} Gäste</p>
        )}
        {dinner.hostName && (
          <p className="dinner-card-host">
            von {dinner.hostName}
            {hostInstagram && (
              <a
                href={`https://instagram.com/${hostInstagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="host-instagram-link"
                onClick={(e) => e.stopPropagation()}
              >
                <Instagram size={13} />
              </a>
            )}
          </p>
        )}
      </div>
    </div>
  )
}
