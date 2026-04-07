import { useState, useEffect } from 'react'
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useParams, useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Users, ChefHat, ArrowLeft, Star } from 'lucide-react'
import LoginModal from '../components/LoginModal'
import DinnerChat from '../components/DinnerChat'
import StarRating from '../components/StarRating'

function isPastDinner(dinner) {
  if (!dinner.date) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let dinnerDate = new Date(dinner.date)
  if (dinner.time && !isNaN(dinnerDate.getTime())) {
    const [hours, minutes] = dinner.time.split(':')
    dinnerDate.setHours(parseInt(hours) || 0, parseInt(minutes) || 0)
    return dinnerDate < new Date()
  }
  if (isNaN(dinnerDate.getTime())) return false
  dinnerDate.setHours(0, 0, 0, 0)
  return dinnerDate < today
}

export default function DinnerDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [dinner, setDinner] = useState(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [showLogin, setShowLogin] = useState(false)

  // Rating state
  const [myRating, setMyRating] = useState(0)
  const [myComment, setMyComment] = useState('')
  const [ratings, setRatings] = useState([])
  const [submittingRating, setSubmittingRating] = useState(false)
  const [hasRated, setHasRated] = useState(false)

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

  // Fetch ratings
  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const ratingsSnap = await getDocs(collection(db, 'dinners', id, 'ratings'))
        const ratingsData = ratingsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        setRatings(ratingsData)
        if (user) {
          const userRating = ratingsData.find(r => r.userId === user.uid)
          if (userRating) {
            setHasRated(true)
            setMyRating(userRating.stars)
            setMyComment(userRating.comment || '')
          }
        }
      } catch (err) {
        // ratings collection might not exist yet
      }
    }
    if (id) fetchRatings()
  }, [id, user])

  const handleJoin = async () => {
    if (!user) { setShowLogin(true); return }
    setJoining(true)
    try {
      await updateDoc(doc(db, 'dinners', id), { guests: arrayUnion(user.uid) })
      setDinner(prev => ({ ...prev, guests: [...(prev.guests || []), user.uid] }))
      showToast('Du nimmst jetzt am Dinner teil!', 'success')
    } catch (err) {
      showToast('Fehler beim Beitreten.', 'error')
    }
    setJoining(false)
  }

  const handleLeave = async () => {
    setJoining(true)
    try {
      await updateDoc(doc(db, 'dinners', id), { guests: arrayRemove(user.uid) })
      setDinner(prev => ({ ...prev, guests: (prev.guests || []).filter(g => g !== user.uid) }))
      showToast('Teilnahme wurde abgesagt.', 'info')
    } catch (err) {
      showToast('Fehler beim Verlassen.', 'error')
    }
    setJoining(false)
  }

  const handleSubmitRating = async () => {
    if (!user || myRating === 0) return
    setSubmittingRating(true)
    try {
      await addDoc(collection(db, 'dinners', id, 'ratings'), {
        userId: user.uid,
        userName: user.displayName || 'Anonym',
        stars: myRating,
        comment: myComment.trim(),
        createdAt: serverTimestamp()
      })
      setHasRated(true)
      setRatings(prev => [...prev, { userId: user.uid, userName: user.displayName || 'Anonym', stars: myRating, comment: myComment.trim() }])
      showToast('Bewertung abgegeben! Danke!', 'success')
    } catch (err) {
      showToast('Fehler beim Bewerten.', 'error')
    }
    setSubmittingRating(false)
  }

  if (loading) return <div className="loading"><div className="spinner"/></div>
  if (!dinner) return (
    <div className="empty-state" style={{paddingTop:120}}>
      <h3>Dinner nicht gefunden</h3>
      <button className="btn btn-primary" onClick={() => navigate('/')}>Zurueck</button>
    </div>
  )

  const isHost = user && user.uid === dinner.hostId
  const isGuest = user && (dinner.guests || []).includes(user.uid)
  const guestCount = (dinner.guests || []).length
  const isFull = guestCount >= dinner.maxGuests
  const past = isPastDinner(dinner)
  const avgRating = ratings.length > 0 ? (ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length).toFixed(1) : null

  return (
    <div className="detail-page">
      <button className="detail-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={18}/> Zurueck
      </button>

      <div className="detail-card">
        <div className="detail-header">
          <span className="dinner-card-cuisine">{dinner.cuisine}</span>
          {past && <span className="past-badge"><Star size={12} /> Vergangen</span>}
          <h1>{dinner.title}</h1>
          {avgRating && (
            <div className="detail-avg-rating">
              <Star size={16} fill="#e85d04" stroke="#e85d04" />
              <span>{avgRating}</span>
              <span className="rating-count">({ratings.length} Bewertung{ratings.length !== 1 ? 'en' : ''})</span>
            </div>
          )}
        </div>

        {dinner.imageUrl && (
          <img src={dinner.imageUrl} alt={dinner.title} className="detail-card-image" />
        )}

        <div className="detail-card-body">
          {dinner.description && <p className="detail-desc">{dinner.description}</p>}
          <div className="detail-info">
            {dinner.date && <div className="detail-info-item"><Calendar size={16}/> {dinner.date}{dinner.time ? `, ${dinner.time}` : ''}</div>}
            {dinner.location && <div className="detail-info-item"><MapPin size={16}/> {dinner.location}</div>}
            {dinner.address && <div className="detail-info-item"><MapPin size={16}/> {dinner.address}</div>}
            <div className="detail-info-item"><Users size={16}/> {guestCount}/{dinner.maxGuests} Gaeste</div>
          </div>
        </div>

        <span>Gehostet von <strong>{dinner.hostName}</strong></span>
      </div>

      {!isHost && !past && (
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

      {isHost && !past && (
        <div className="detail-guests-section">
          <h3>Gaesteliste ({guestCount})</h3>
          {guestCount === 0 ? (
            <p className="detail-no-guests">Noch keine Gaeste angemeldet.</p>
          ) : (
            <p className="detail-no-guests">Gaeste sind angemeldet. Verwalte sie unter "Meine Dinner".</p>
          )}
        </div>
      )}

      {past && user && (isGuest || isHost) && (
        <div className="rating-section">
          <h3>Bewertung</h3>
          {!hasRated ? (
            <div className="rating-form">
              <p>Wie war das Dinner?</p>
              <StarRating rating={myRating} onRate={setMyRating} size={28} />
              <textarea
                className="rating-comment"
                placeholder="Optionaler Kommentar..."
                value={myComment}
                onChange={(e) => setMyComment(e.target.value)}
                rows={3}
              />
              <button
                className="btn btn-primary"
                onClick={handleSubmitRating}
                disabled={myRating === 0 || submittingRating}
              >
                {submittingRating ? 'Wird gesendet...' : 'Bewertung abgeben'}
              </button>
            </div>
          ) : (
            <div className="rating-submitted">
              <p>Deine Bewertung:</p>
              <StarRating rating={myRating} readOnly size={24} />
              {myComment && <p className="rating-my-comment">{myComment}</p>}
            </div>
          )}

          {ratings.length > 0 && (
            <div className="ratings-list">
              <h4>Alle Bewertungen ({ratings.length})</h4>
              {ratings.map((r, i) => (
                <div key={r.id || i} className="rating-item">
                  <div className="rating-item-header">
                    <strong>{r.userName}</strong>
                    <StarRating rating={r.stars} readOnly size={16} />
                  </div>
                  {r.comment && <p>{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!past && <DinnerChat dinnerId={id} dinner={dinner} />}

      {showLogin && <LoginModal onClose={() => setShowLogin(false)}/>}
    </div>
  )
}
