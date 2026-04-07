import { useState, useEffect } from 'react'
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useParams, useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Users, ChefHat, ArrowLeft } from 'lucide-react'
import LoginModal from '../components/LoginModal'

export default function DinnerDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [dinner, setDinner] = useState(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [showLogin, setShowLogin] = useState(false)

  useEffect(() => {
    const fetchDinner = async () => {
      const snap = await getDoc(doc(db, 'dinners', id))
      if (snap.exists()) {
        setDinner({ id: snap.id, ...snap.data() })
      }
      setLoading(false)
    }
    fetchDinner()
  }, [id])

  const handleJoin = async () => {
    if (!user) { setShowLogin(true); return }
    setJoining(true)
    try {
      await updateDoc(doc(db, 'dinners', id), {
        guests: arrayUnion(user.uid)
      })
      setDinner(prev => ({ ...prev, guests: [...(prev.guests || []), user.uid] }))
    } catch (err) {
      alert('Fehler beim Beitreten.')
    }
    setJoining(false)
  }

  const handleLeave = async () => {
    setJoining(true)
    try {
      await updateDoc(doc(db, 'dinners', id), {
        guests: arrayRemove(user.uid)
      })
      setDinner(prev => ({ ...prev, guests: (prev.guests || []).filter(g => g !== user.uid) }))
    } catch (err) {
      alert('Fehler beim Verlassen.')
    }
    setJoining(false)
  }

  if (loading) return <div className="loading"><div className="spinner"/></div>
  if (!dinner) return (
    <div className="empty-state" style={{paddingTop:120}}>
      <h3>Dinner nicht gefunden</h3>
      <button className="btn btn-primary" onClick={() => navigate('/')}>Zurück</button>
    </div>
  )

  const isHost = user && user.uid === dinner.hostId
  const isGuest = user && (dinner.guests || []).includes(user.uid)
  const guestCount = (dinner.guests || []).length
  const isFull = guestCount >= dinner.maxGuests

  return (
    <div className="detail-page">
      <button className="detail-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={18}/> Zurück
      </button>

      <div className="detail-card">
        <div className="detail-header">
          <span className="dinner-card-cuisine">{dinner.cuisine}</span>
          <h1>{dinner.title}</h1>
          {dinner.description && <p className="detail-desc">{dinner.description}</p>}
        </div>

        <div className="detail-info">
          {dinner.date && <div className="detail-info-item"><Calendar size={18}/> {dinner.date} {dinner.time && `um ${dinner.time} Uhr`}</div>}
          {dinner.location && <div className="detail-info-item"><MapPin size={18}/> {dinner.location}{dinner.address && `, ${dinner.address}`}</div>}
          <div className="detail-info-item"><Users size={18}/> {guestCount} / {dinner.maxGuests} Gäste</div>
        </div>

        <div className="detail-host">
          <div className="dinner-card-host-avatar">
            {dinner.hostPhoto ? <img src={dinner.hostPhoto} alt="" style={{width:'100%',height:'100%',borderRadius:'50%'}}/> : <ChefHat size={16}/>}
          </div>
          <span>Gehostet von <strong>{dinner.hostName}</strong></span>
        </div>

        {!isHost && (
          <div className="detail-actions">
            {isGuest ? (
              <button className="btn btn-outline" onClick={handleLeave} disabled={joining}>
                {joining ? 'Wird bearbeitet...' : 'Teilnahme absagen'}
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleJoin} disabled={joining || isFull}>
                {isFull ? 'Dinner ist voll' : joining ? 'Wird bearbeitet...' : 'Teilnehmen'}
              </button>
            )}
          </div>
        )}

        {isHost && (
          <div className="detail-guests-section">
            <h3>Gästeliste ({guestCount})</h3>
            {guestCount === 0 ? (
              <p className="detail-no-guests">Noch keine Gäste angemeldet.</p>
            ) : (
              <p className="detail-no-guests">Gäste sind angemeldet. Verwalte sie unter "Meine Dinner".</p>
            )}
          </div>
        )}
      </div>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)}/>}
    </div>
  )
}
