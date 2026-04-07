import { Calendar, MapPin, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function DinnerCard({ dinner }) {
  const navigate = useNavigate()

  return (
    <div className="dinner-card" onClick={() => navigate(`/dinner/${dinner.id}`)}>
      {dinner.imageUrl && <img src={dinner.imageUrl} alt={dinner.title} className="dinner-card-image" />}
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
        {dinner.hostName && <p className="dinner-card-host">von {dinner.hostName}</p>}
      </div>
    </div>
  )
}
