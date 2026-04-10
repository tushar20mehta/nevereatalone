import { useState, useEffect, useRef, useCallback } from 'react'
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, MapPin, ChefHat, X, Heart, Star, ChevronDown, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import LoginModal from '../components/LoginModal'

function isFutureDinner(dinner) {
  if (!dinner.date) return false
  const now = new Date()
  let dinnerDate = new Date(dinner.date)
  if (dinner.time) {
    const [hours, minutes] = dinner.time.split(':')
    dinnerDate.setHours(parseInt(hours) || 23, parseInt(minutes) || 59)
  } else {
    dinnerDate.setHours(23, 59, 59)
  }
  return dinnerDate >= now
}

export default function StoebernPage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [allDinners, setAllDinners] = useState([])
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [showLogin, setShowLogin] = useState(false)
  const [expandedCard, setExpandedCard] = useState(null)
  const [guestProfiles, setGuestProfiles] = useState({})
  const [skippedIds, setSkippedIds] = useState([])
  const [likedIds, setLikedIds] = useState([])
  const [hostPhotos, setHostPhotos] = useState({})

  // Drag state
  const [dragState, setDragState] = useState({ active: false, startX: 0, startY: 0, dx: 0, dy: 0 })
  const cardRef = useRef(null)
  const animatingRef = useRef(false)

  // Load user's skipped/liked arrays from Firestore
  useEffect(() => {
    if (!user) return
    const loadUserPrefs = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const data = userDoc.data()
          setSkippedIds(data.skippedDinners || [])
          setLikedIds(data.likedDinners || [])
        }
      } catch (err) {
        // User doc may not exist yet
      }
    }
    loadUserPrefs()
  }, [user])

  // Load all dinners
  useEffect(() => {
    const q = query(collection(db, 'dinners'), orderBy('date', 'asc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dinners = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      setAllDinners(dinners)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  // Load current profile photos for hosts from Firestore
  useEffect(() => {
    const hostIds = [...new Set(allDinners.map(d => d.hostId).filter(Boolean))]
    const missing = hostIds.filter(id => !(id in hostPhotos))
    if (missing.length === 0) return

    const fetchPhotos = async () => {
      const updates = {}
      for (const uid of missing) {
        try {
          const snap = await getDoc(doc(db, 'users', uid))
          updates[uid] = snap.exists() ? (snap.data().photoURL || '') : ''
        } catch {
          updates[uid] = ''
        }
      }
      setHostPhotos(prev => ({ ...prev, ...updates }))
    }
    fetchPhotos()
  }, [allDinners])

  // Filter dinners into swipeable cards
  useEffect(() => {
    if (!user) {
      setCards(allDinners.filter(d => isFutureDinner(d)))
      return
    }
    const filtered = allDinners.filter(d => {
      if (!isFutureDinner(d)) return false
      if (d.hostId === user.uid) return false
      if ((d.guests || []).includes(user.uid)) return false
      if ((d.pendingGuests || []).includes(user.uid)) return false
      if (skippedIds.includes(d.id)) return false
      if (likedIds.includes(d.id)) return false
      return true
    })
    setCards(filtered)
  }, [allDinners, user, skippedIds, likedIds])

  // Load guest profiles for expanded card
  useEffect(() => {
    if (!expandedCard) return
    const dinner = cards.find(c => c.id === expandedCard)
    if (!dinner || !dinner.guests?.length) return

    const loadProfiles = async () => {
      const newProfiles = { ...guestProfiles }
      for (const uid of dinner.guests) {
        if (newProfiles[uid]) continue
        try {
          const userDoc = await getDoc(doc(db, 'users', uid))
          if (userDoc.exists()) {
            newProfiles[uid] = userDoc.data()
          }
        } catch (err) { /* skip */ }
      }
      setGuestProfiles(newProfiles)
    }
    loadProfiles()
  }, [expandedCard])

  const currentDinner = cards[0] || null

  const saveSkipped = useCallback(async (dinnerId) => {
    if (!user) return
    try {
      await updateDoc(doc(db, 'users', user.uid), { skippedDinners: arrayUnion(dinnerId) })
    } catch (err) {
      // If user doc doesn't exist, create via setDoc
      const { setDoc } = await import('firebase/firestore')
      await setDoc(doc(db, 'users', user.uid), { skippedDinners: [dinnerId] }, { merge: true })
    }
  }, [user])

  const saveLiked = useCallback(async (dinnerId) => {
    if (!user) return
    try {
      await updateDoc(doc(db, 'users', user.uid), { likedDinners: arrayUnion(dinnerId) })
    } catch (err) {
      const { setDoc } = await import('firebase/firestore')
      await setDoc(doc(db, 'users', user.uid), { likedDinners: [dinnerId] }, { merge: true })
    }
  }, [user])

  const handleSwipeComplete = useCallback(async (direction) => {
    if (!currentDinner || animatingRef.current) return
    animatingRef.current = true

    const dinnerId = currentDinner.id

    if (direction === 'left') {
      // Skip
      setSkippedIds(prev => [...prev, dinnerId])
      saveSkipped(dinnerId)
    } else if (direction === 'right') {
      // Join / Request
      if (!user) {
        setShowLogin(true)
        animatingRef.current = false
        setDragState({ active: false, startX: 0, startY: 0, dx: 0, dy: 0 })
        return
      }
      try {
        if (currentDinner.approvalRequired) {
          await updateDoc(doc(db, 'dinners', dinnerId), { pendingGuests: arrayUnion(user.uid) })
          showToast(t('dinner.requestSent'), 'success')
        } else {
          await updateDoc(doc(db, 'dinners', dinnerId), { guests: arrayUnion(user.uid) })
          showToast(t('dinner.joinSuccess'), 'success')
        }
      } catch (err) {
        showToast(t('dinner.joinError'), 'error')
      }
      setLikedIds(prev => [...prev, dinnerId])
    } else if (direction === 'up') {
      // Favorite
      if (!user) {
        setShowLogin(true)
        animatingRef.current = false
        setDragState({ active: false, startX: 0, startY: 0, dx: 0, dy: 0 })
        return
      }
      saveLiked(dinnerId)
      setLikedIds(prev => [...prev, dinnerId])
      showToast(t('stoebern.saved'), 'success')
    }

    setTimeout(() => {
      setDragState({ active: false, startX: 0, startY: 0, dx: 0, dy: 0 })
      animatingRef.current = false
    }, 300)
  }, [currentDinner, user, saveSkipped, saveLiked, showToast])

  // Swipe animation handler
  const animateSwipe = useCallback((direction) => {
    if (animatingRef.current) return
    const offX = direction === 'left' ? -600 : direction === 'right' ? 600 : 0
    const offY = direction === 'up' ? -800 : 0
    setDragState(prev => ({ ...prev, dx: offX, dy: offY, active: false }))
    setTimeout(() => handleSwipeComplete(direction), 250)
  }, [handleSwipeComplete])

  // Touch / Mouse drag handlers
  const handleDragStart = (e) => {
    if (animatingRef.current || expandedCard) return
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    setDragState({ active: true, startX: clientX, startY: clientY, dx: 0, dy: 0 })
  }

  const handleDragMove = (e) => {
    if (!dragState.active || animatingRef.current) return
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    setDragState(prev => ({
      ...prev,
      dx: clientX - prev.startX,
      dy: clientY - prev.startY
    }))
  }

  const handleDragEnd = () => {
    if (!dragState.active || animatingRef.current) return
    const { dx, dy } = dragState
    const threshold = 100

    if (dx > threshold) {
      animateSwipe('right')
    } else if (dx < -threshold) {
      animateSwipe('left')
    } else if (dy < -threshold) {
      animateSwipe('up')
    } else {
      setDragState({ active: false, startX: 0, startY: 0, dx: 0, dy: 0 })
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const locale = i18n.language === 'en' ? 'en-US' : 'de-DE'
    return d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })
  }

  const getCardTransform = () => {
    const { dx, dy } = dragState
    const rotation = dx * 0.08
    return `translate(${dx}px, ${dy}px) rotate(${rotation}deg)`
  }

  const getSwipeIndicator = () => {
    const { dx, dy } = dragState
    if (dx > 60) return 'right'
    if (dx < -60) return 'left'
    if (dy < -60) return 'up'
    return null
  }

  if (loading) {
    return (
      <div className="stoebern-page">
        <div className="stoebern-loading">
          <div className="spinner" />
          <p>{t('stoebern.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="stoebern-page">
      <div className="stoebern-header">
        <h1>{t('stoebern.title')}</h1>
        <p>{t('stoebern.subtitle')}</p>
      </div>

      <div className="stoebern-stack">
        {!currentDinner ? (
          <div className="stoebern-empty">
            <div className="stoebern-empty-icon">🍽️</div>
            <h2>{t('stoebern.empty')}</h2>
            <p>{t('stoebern.emptySubtitle')}</p>
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              {t('stoebern.backToDiscover')}
            </button>
          </div>
        ) : (
          <>
            {/* Background card (next card preview) */}
            {cards[1] && (
              <div className="stoebern-card stoebern-card-behind">
                <div className="stoebern-card-image">
                  {(hostPhotos[cards[1].hostId] || cards[1].hostPhoto) ? (
                    <img src={hostPhotos[cards[1].hostId] || cards[1].hostPhoto} alt="" />
                  ) : (
                    <div className="stoebern-card-image-placeholder">
                      {cards[1].hostName?.[0] || '?'}
                    </div>
                  )}
                </div>
                <div className="stoebern-card-body">
                  <h3>{cards[1].title}</h3>
                </div>
              </div>
            )}

            {/* Active card */}
            <div
              ref={cardRef}
              className={`stoebern-card stoebern-card-active ${expandedCard === currentDinner.id ? 'stoebern-card-expanded' : ''}`}
              style={{
                transform: expandedCard ? 'none' : getCardTransform(),
                transition: dragState.active ? 'none' : 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseDown={!expandedCard ? handleDragStart : undefined}
              onMouseMove={!expandedCard ? handleDragMove : undefined}
              onMouseUp={!expandedCard ? handleDragEnd : undefined}
              onMouseLeave={!expandedCard && dragState.active ? handleDragEnd : undefined}
              onTouchStart={!expandedCard ? handleDragStart : undefined}
              onTouchMove={!expandedCard ? handleDragMove : undefined}
              onTouchEnd={!expandedCard ? handleDragEnd : undefined}
            >
              {/* Swipe indicators */}
              {getSwipeIndicator() === 'right' && (
                <div className="stoebern-swipe-badge stoebern-badge-right">{t('stoebern.join')}</div>
              )}
              {getSwipeIndicator() === 'left' && (
                <div className="stoebern-swipe-badge stoebern-badge-left">{t('stoebern.skip')}</div>
              )}
              {getSwipeIndicator() === 'up' && (
                <div className="stoebern-swipe-badge stoebern-badge-up">{t('stoebern.favorite')}</div>
              )}

              <div className="stoebern-card-image" onClick={() => setExpandedCard(expandedCard ? null : currentDinner.id)}>
                {(hostPhotos[currentDinner.hostId] || currentDinner.hostPhoto) ? (
                  <img src={hostPhotos[currentDinner.hostId] || currentDinner.hostPhoto} alt={currentDinner.hostName} draggable={false} />
                ) : (
                  <div className="stoebern-card-image-placeholder">
                    {currentDinner.hostName?.[0] || '?'}
                  </div>
                )}
                <div className="stoebern-card-host-name">{currentDinner.hostName || t('common.anonymous')}</div>
                {currentDinner.cuisine && (
                  <span className="stoebern-cuisine-tag">{currentDinner.cuisine}</span>
                )}
              </div>

              <div className="stoebern-card-body" onClick={() => setExpandedCard(expandedCard ? null : currentDinner.id)}>
                <h3 className="stoebern-card-title">{currentDinner.title}</h3>
                <div className="stoebern-card-meta">
                  <span><Calendar size={14} /> {formatDate(currentDinner.date)}</span>
                  {currentDinner.time && <span><Clock size={14} /> {currentDinner.time}</span>}
                  {currentDinner.location && <span><MapPin size={14} /> {currentDinner.location}</span>}
                </div>
                {currentDinner.description && (
                  <p className="stoebern-card-desc">
                    {expandedCard ? currentDinner.description : (currentDinner.description.length > 100 ? currentDinner.description.slice(0, 100) + '...' : currentDinner.description)}
                  </p>
                )}

                {/* Expanded view: guests */}
                {expandedCard === currentDinner.id && (
                  <div className="stoebern-expanded-section">
                    <div className="stoebern-guest-info">
                      <Users size={14} />
                      <span>{(currentDinner.guests || []).length}{currentDinner.maxGuests ? ` / ${currentDinner.maxGuests}` : ''} {t('stoebern.guests')}</span>
                    </div>
                    {currentDinner.guests?.length > 0 && (
                      <div className="stoebern-guest-avatars">
                        {currentDinner.guests.map((uid) => {
                          const profile = guestProfiles[uid]
                          return (
                            <div key={uid} className="stoebern-guest-avatar" title={profile?.displayName || ''}>
                              {profile?.photoURL ? (
                                <img src={profile.photoURL} alt="" />
                              ) : (
                                <span>{profile?.displayName?.[0] || '?'}</span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {currentDinner.approvalRequired && (
                      <div className="stoebern-approval-note">{t('stoebern.approvalNote')}</div>
                    )}
                    <button className="stoebern-detail-link" onClick={(e) => { e.stopPropagation(); navigate(`/dinner/${currentDinner.id}`) }}>
                      {t('stoebern.details')}
                    </button>
                  </div>
                )}

                {expandedCard && (
                  <button className="stoebern-collapse-btn" onClick={(e) => { e.stopPropagation(); setExpandedCard(null) }}>
                    <ChevronDown size={16} /> {t('stoebern.collapse')}
                  </button>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="stoebern-actions">
              <button
                className="stoebern-btn stoebern-btn-skip"
                onClick={() => animateSwipe('left')}
                title={t('stoebern.skipLabel')}
              >
                <X size={28} />
              </button>
              <button
                className="stoebern-btn stoebern-btn-fav"
                onClick={() => animateSwipe('up')}
                title={t('stoebern.favoriteLabel')}
              >
                <Star size={24} />
              </button>
              <button
                className="stoebern-btn stoebern-btn-join"
                onClick={() => animateSwipe('right')}
                title={t('stoebern.joinLabel')}
              >
                <Heart size={28} />
              </button>
            </div>
          </>
        )}
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  )
}
