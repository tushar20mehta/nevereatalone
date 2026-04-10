import { useState, useEffect } from 'react'
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Calendar, MapPin, Users, ChefHat, ArrowLeft, Star, Check, X, Clock, UserPlus, Instagram } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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

  // Host & guest info state
  const [hostProfile, setHostProfile] = useState(null)
  const [guestProfiles, setGuestProfiles] = useState({})
  const [pendingProfiles, setPendingProfiles] = useState({})

  // Private street address — only loaded if the viewer is host or confirmed guest.
  const [privateStreet, setPrivateStreet] = useState('')

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
      } catch (err) { /* ratings collection might not exist yet */ }
    }
    if (id) fetchRatings()
  }, [id, user])

  // Fetch the private street address if the current user is host or an
  // approved guest. Firestore rules enforce this; we don't even attempt the
  // read otherwise, to avoid console errors.
  useEffect(() => {
    if (!dinner || !user) { setPrivateStreet(''); return }
    const authorized = dinner.hostId === user.uid || (dinner.guests || []).includes(user.uid)
    if (!authorized) { setPrivateStreet(''); return }
    let cancelled = false
    const fetchPrivate = async () => {
      try {
        const snap = await getDoc(doc(db, 'dinners', id, 'private', 'location'))
        if (!cancelled && snap.exists()) setPrivateStreet(snap.data().street || '')
      } catch (e) { /* not authorized or not set */ }
    }
    fetchPrivate()
    return () => { cancelled = true }
  }, [dinner?.id, dinner?.hostId, dinner?.guests, user?.uid])

  // Fetch host profile for Instagram
  useEffect(() => {
    if (!dinner?.hostId) return
    const fetchHost = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', dinner.hostId))
        if (snap.exists()) setHostProfile(snap.data())
      } catch (e) { /* ignore */ }
    }
    fetchHost()
  }, [dinner?.hostId])

  // Fetch guest and pending profiles
  useEffect(() => {
    if (!dinner) return
    const fetchProfiles = async (uids, setter) => {
      const profiles = {}
      for (const uid of uids) {
        try {
          const snap = await getDoc(doc(db, 'users', uid))
          if (snap.exists()) {
            profiles[uid] = snap.data()
          } else {
            profiles[uid] = { displayName: t('common.user'), photoURL: '' }
          }
        } catch (e) {
          profiles[uid] = { displayName: t('common.user'), photoURL: '' }
        }
      }
      setter(profiles)
    }
    if (dinner.guests?.length) fetchProfiles(dinner.guests, setGuestProfiles)
    if (dinner.pendingGuests?.length) fetchProfiles(dinner.pendingGuests, setPendingProfiles)
  }, [dinner?.guests, dinner?.pendingGuests])

  // Direct join (no approval needed)
  const handleJoin = async () => {
    if (!user) { setShowLogin(true); return }
    setJoining(true)
    try {
      await updateDoc(doc(db, 'dinners', id), { guests: arrayUnion(user.uid) })
      setDinner(prev => ({ ...prev, guests: [...(prev.guests || []), user.uid] }))
      showToast(t('dinner.joinSuccess'), 'success')
    } catch (err) {
      showToast(t('dinner.joinError'), 'error')
    }
    setJoining(false)
  }

  // Request to join (approval needed)
  const handleRequestJoin = async () => {
    if (!user) { setShowLogin(true); return }
    setJoining(true)
    try {
      await updateDoc(doc(db, 'dinners', id), { pendingGuests: arrayUnion(user.uid) })
      setDinner(prev => ({ ...prev, pendingGuests: [...(prev.pendingGuests || []), user.uid] }))
      showToast(t('dinner.requestSent'), 'success')
    } catch (err) {
      showToast(t('dinner.requestError'), 'error')
    }
    setJoining(false)
  }

  const handleLeave = async () => {
    setJoining(true)
    try {
      await updateDoc(doc(db, 'dinners', id), { guests: arrayRemove(user.uid) })
      setDinner(prev => ({ ...prev, guests: (prev.guests || []).filter(g => g !== user.uid) }))
      showToast(t('dinner.leaveSuccess'), 'info')
    } catch (err) {
      showToast(t('dinner.leaveError'), 'error')
    }
    setJoining(false)
  }

  const handleCancelRequest = async () => {
    setJoining(true)
    try {
      await updateDoc(doc(db, 'dinners', id), { pendingGuests: arrayRemove(user.uid) })
      setDinner(prev => ({ ...prev, pendingGuests: (prev.pendingGuests || []).filter(g => g !== user.uid) }))
      showToast(t('dinner.requestWithdrawn'), 'info')
    } catch (err) {
      showToast(t('dinner.withdrawError'), 'error')
    }
    setJoining(false)
  }

  // Host approves a guest
  const handleApprove = async (guestUid) => {
    try {
      await updateDoc(doc(db, 'dinners', id), {
        pendingGuests: arrayRemove(guestUid),
        guests: arrayUnion(guestUid)
      })
      setDinner(prev => ({
        ...prev,
        pendingGuests: (prev.pendingGuests || []).filter(g => g !== guestUid),
        guests: [...(prev.guests || []), guestUid]
      }))
      showToast(t('dinner.guestApproved'), 'success')
    } catch (err) {
      showToast(t('dinner.approveError'), 'error')
    }
  }

  // Host rejects a guest
  const handleReject = async (guestUid) => {
    try {
      await updateDoc(doc(db, 'dinners', id), { pendingGuests: arrayRemove(guestUid) })
      setDinner(prev => ({
        ...prev,
        pendingGuests: (prev.pendingGuests || []).filter(g => g !== guestUid)
      }))
      showToast(t('dinner.requestRejected'), 'info')
    } catch (err) {
      showToast(t('dinner.rejectError'), 'error')
    }
  }

  const handleSubmitRating = async () => {
    if (!user || myRating === 0) return
    setSubmittingRating(true)
    try {
      await addDoc(collection(db, 'dinners', id, 'ratings'), {
        userId: user.uid,
        userName: user.displayName || t('common.anonymous'),
        stars: myRating,
        comment: myComment.trim(),
        createdAt: serverTimestamp()
      })
      setHasRated(true)
      setRatings(prev => [...prev, { userId: user.uid, userName: user.displayName || t('common.anonymous'), stars: myRating, comment: myComment.trim() }])
      showToast(t('dinner.ratingSuccess'), 'success')
    } catch (err) {
      showToast(t('dinner.ratingError'), 'error')
    }
    setSubmittingRating(false)
  }

  if (loading) return <div className="loading"><div className="spinner"/></div>
  if (!dinner) return (
    <div className="empty-state" style={{paddingTop:120}}>
      <h3>{t('dinner.notFound')}</h3>
      <button className="btn btn-primary" onClick={() => navigate('/')}>{t('common.back')}</button>
    </div>
  )

  const isHost = user && user.uid === dinner.hostId
  const isGuest = user && (dinner.guests || []).includes(user.uid)
  const isPending = user && (dinner.pendingGuests || []).includes(user.uid)
  const guestCount = (dinner.guests || []).length
  const pendingCount = (dinner.pendingGuests || []).length
  const isFull = guestCount >= dinner.maxGuests
  const past = isPastDinner(dinner)
  const needsApproval = dinner.approvalRequired === true
  const avgRating = ratings.length > 0
    ? (ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length).toFixed(1) : null

  return (
    <div className="detail-page">
      <button className="detail-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={18}/> {t('common.back')}
      </button>

      <div className="detail-card">
        <div className="detail-header">
          <span className="dinner-card-cuisine">{dinner.cuisine}</span>
          {past && <span className="past-badge"><Star size={12} /> {t('dinner.past')}</span>}
          {needsApproval && !past && <span className="approval-badge"><Clock size={12} /> {t('dinner.approvalRequired')}</span>}
          <h1>{dinner.title}</h1>
          {avgRating && (
            <div className="detail-avg-rating">
              <Star size={16} fill="#e85d04" stroke="#e85d04" />
              <span>{avgRating}</span>
              <span className="rating-count">({t('dinner.ratingCount', { count: ratings.length })})</span>
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
            {/* Street address is only visible to the host or confirmed guests.
                `privateStreet` comes from the /private/location subcollection.
                `dinner.address` is the legacy field on older dinners and is
                shown with the same host/guest gate for backward compatibility. */}
            {(isHost || isGuest) && (privateStreet || dinner.address) && (
              <div className="detail-info-item"><MapPin size={16}/> {privateStreet || dinner.address}</div>
            )}
            <div className="detail-info-item"><Users size={16}/> {guestCount}/{dinner.maxGuests} {t('myDinners.guests')}</div>
          </div>
        </div>

        <span className="detail-host-line">
          {t('dinner.hostedBy')} <Link to={`/profile/${dinner.hostId}`} className="host-link"><strong>{dinner.hostName}</strong></Link>
          {hostProfile?.instagram && (
            <a
              href={`https://instagram.com/${hostProfile.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="host-instagram-link"
              onClick={(e) => e.stopPropagation()}
            >
              <Instagram size={14} />
            </a>
          )}
        </span>
      </div>

      {/* Action buttons for non-host */}
      {!isHost && !past && (
        <div className="detail-actions">
          {isGuest ? (
            <button className="btn btn-outline" onClick={handleLeave} disabled={joining}>
              {joining ? t('dinner.processing') : t('dinner.leave')}
            </button>
          ) : isPending ? (
            <button className="btn btn-outline" onClick={handleCancelRequest} disabled={joining}>
              <Clock size={16} /> {joining ? t('dinner.processing') : t('dinner.cancelRequest')}
            </button>
          ) : needsApproval ? (
            <button className="btn btn-primary" onClick={handleRequestJoin} disabled={joining || isFull}>
              <UserPlus size={16} /> {isFull ? t('dinner.full') : joining ? t('dinner.processing') : t('dinner.requestJoin')}
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleJoin} disabled={joining || isFull}>
              {isFull ? t('dinner.full') : joining ? t('dinner.processing') : t('dinner.join')}
            </button>
          )}
        </div>
      )}

      {/* Host: Pending requests section */}
      {isHost && !past && pendingCount > 0 && (
        <div className="detail-guests-section pending-section">
          <h3><Clock size={18} /> {t('dinner.pendingRequests')} ({pendingCount})</h3>
          <div className="guest-requests-list">
            {(dinner.pendingGuests || []).map(uid => {
              const p = pendingProfiles[uid] || {}
              return (
                <div key={uid} className="guest-request-item">
                  <div className="guest-request-info">
                    {p.photoURL ? (
                      <img src={p.photoURL} alt="" className="guest-avatar" />
                    ) : (
                      <div className="guest-avatar guest-avatar-placeholder">{(p.displayName || '?')[0]}</div>
                    )}
                    <Link to={`/profile/${uid}`} className="guest-name-link">{p.displayName || t('common.user')}</Link>
                  </div>
                  <div className="guest-request-actions">
                    <button className="btn-icon btn-approve" onClick={() => handleApprove(uid)} title={t('dinner.approve')}>
                      <Check size={18} />
                    </button>
                    <button className="btn-icon btn-reject" onClick={() => handleReject(uid)} title={t('dinner.reject')}>
                      <X size={18} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Host: Confirmed guests */}
      {isHost && !past && (
        <div className="detail-guests-section">
          <h3><Users size={18} /> {t('dinner.guestList')} ({guestCount})</h3>
          {guestCount === 0 ? (
            <p className="detail-no-guests">{t('dinner.noGuestsYet')}</p>
          ) : (
            <div className="guest-list">
              {(dinner.guests || []).map(uid => {
                const g = guestProfiles[uid] || {}
                return (
                  <div key={uid} className="guest-list-item">
                    {g.photoURL ? (
                      <img src={g.photoURL} alt="" className="guest-avatar" />
                    ) : (
                      <div className="guest-avatar guest-avatar-placeholder">{(g.displayName || '?')[0]}</div>
                    )}
                    <Link to={`/profile/${uid}`} className="guest-name-link">{g.displayName || t('common.user')}</Link>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Rating Section for past dinners */}
      {past && user && (isGuest || isHost) && (
        <div className="rating-section">
          <h3>{t('dinner.rating')}</h3>
          {!hasRated ? (
            <div className="rating-form">
              <p>{t('dinner.howWasIt')}</p>
              <StarRating rating={myRating} onRate={setMyRating} size={28} />
              <textarea
                className="rating-comment"
                placeholder={t('dinner.optionalComment')}
                value={myComment}
                onChange={(e) => setMyComment(e.target.value)}
                rows={3}
              />
              <button className="btn btn-primary" onClick={handleSubmitRating} disabled={myRating === 0 || submittingRating}>
                {submittingRating ? t('dinner.sendingRating') : t('dinner.submitRating')}
              </button>
            </div>
          ) : (
            <div className="rating-submitted">
              <p>{t('dinner.yourRating')}</p>
              <StarRating rating={myRating} readOnly size={24} />
              {myComment && <p className="rating-my-comment">{myComment}</p>}
            </div>
          )}
          {ratings.length > 0 && (
            <div className="ratings-list">
              <h4>{t('dinner.allRatings')} ({ratings.length})</h4>
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
