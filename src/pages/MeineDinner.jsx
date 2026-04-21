import { useState, useEffect } from 'react'
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc, updateDoc, arrayRemove } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { Plus, UtensilsCrossed, Trash2, Users, X, ChevronDown, ChevronUp, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LoginModal from '../components/LoginModal'
import { isPastDinner } from '../utils/dinner'

export default function MeineDinner() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('hosted')
  const [timeTab, setTimeTab] = useState('upcoming')
  const [hostedDinners, setHostedDinners] = useState([])
  const [joinedDinners, setJoinedDinners] = useState([])
  const [loading, setLoading] = useState(true)
  const [showLogin, setShowLogin] = useState(false)
  const [expandedDinner, setExpandedDinner] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deletingPast, setDeletingPast] = useState(false)

  useEffect(() => {
    if (!user) { setLoading(false); return }

    const unsubHosted = onSnapshot(
      query(collection(db, 'dinners'), where('hostId', '==', user.uid), orderBy('createdAt', 'desc')),
      (snap) => { setHostedDinners(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); setLoading(false) }
    )

    const unsubJoined = onSnapshot(
      query(collection(db, 'dinners'), where('guests', 'array-contains', user.uid), orderBy('createdAt', 'desc')),
      (snap) => { setJoinedDinners(snap.docs.map((d) => ({ id: d.id, ...d.data() }))) }
    )

    return () => { unsubHosted(); unsubJoined() }
  }, [user])

  const handleDelete = async (dinnerId) => {
    if (!window.confirm(t('myDinners.confirmDelete'))) return
    setDeleting(dinnerId)
    try {
      await deleteDoc(doc(db, 'dinners', dinnerId))
    } catch (err) {
      alert(t('myDinners.deleteError'))
    }
    setDeleting(null)
  }

  const handleDeleteAllPast = async () => {
    const past = currentDinnersRaw.filter(isPastDinner)
    if (past.length === 0) return
    if (!window.confirm(t('myDinners.confirmDeleteAll', { count: past.length }))) return
    setDeletingPast(true)
    try {
      await Promise.all(past.map((d) => deleteDoc(doc(db, 'dinners', d.id))))
    } catch (err) {
      alert(t('myDinners.deletePartialError'))
    }
    setDeletingPast(false)
  }

  const handleRemoveGuest = async (dinnerId, guestId) => {
    if (!window.confirm(t('myDinners.confirmRemoveGuest'))) return
    try {
      await updateDoc(doc(db, 'dinners', dinnerId), { guests: arrayRemove(guestId) })
    } catch (err) {
      alert(t('myDinners.removeError'))
    }
  }

  if (!user) {
    return (
      <div className="empty-state" style={{ paddingTop: 120 }}>
        <div className="empty-state-icon"><UtensilsCrossed size={32} /></div>
        <h3>{t('myDinners.loginRequired')}</h3>
        <p>{t('myDinners.loginToSee')}</p>
        <button className="btn btn-primary" onClick={() => setShowLogin(true)}>{t('common.login')}</button>
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      </div>
    )
  }

  const currentDinnersRaw = tab === 'hosted' ? hostedDinners : joinedDinners
  const upcomingDinners = currentDinnersRaw.filter((d) => !isPastDinner(d))
  const pastDinners = currentDinnersRaw.filter(isPastDinner)

  const renderDinnerCard = (dinner, isPast) => (
    <div key={dinner.id} className={`managed-dinner-card ${isPast ? 'past-dinner' : ''}`}>
      <div className="managed-dinner-header" onClick={() => navigate(`/dinner/${dinner.id}`)}>
        <div className="managed-dinner-info">
          <div className="managed-dinner-badges">
            <span className="dinner-card-cuisine">{dinner.cuisine}</span>
            {isPast && <span className="past-badge"><Clock size={12} /> {t('myDinners.past')}</span>}
          </div>
          <h3>{dinner.title}</h3>
          <p>{dinner.date} {dinner.time && t('myDinners.at', { time: dinner.time })} • {dinner.location}</p>
        </div>
      </div>

      {tab === 'hosted' && (
        <div className="managed-dinner-actions">
          <button
            className="managed-guests-toggle"
            onClick={() => setExpandedDinner(expandedDinner === dinner.id ? null : dinner.id)}
          >
            <Users size={16} /> {t('myDinners.guests')} ({(dinner.guests || []).length}/{dinner.maxGuests})
            {expandedDinner === dinner.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button
            className="btn-delete"
            onClick={() => handleDelete(dinner.id)}
            disabled={deleting === dinner.id}
          >
            <Trash2 size={16} /> {deleting === dinner.id ? t('common.deleting') : t('common.delete')}
          </button>
        </div>
      )}

      {tab === 'hosted' && expandedDinner === dinner.id && (
        <div className="managed-guests-list">
          {(dinner.guests || []).length === 0 ? (
            <p className="managed-guests-empty">{t('myDinners.noGuests')}</p>
          ) : (
            (dinner.guests || []).map((guestId, i) => (
              <div key={guestId} className="managed-guest-item">
                <span>{t('myDinners.guest')} {i + 1}</span>
                <button className="btn-remove-guest" onClick={() => handleRemoveGuest(dinner.id, guestId)}>
                  <X size={14} /> {t('myDinners.remove')}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )

  return (
    <div className="my-dinners-page">
      <h1>{t('myDinners.title')}</h1>
      <p>{t('myDinners.subtitle')}</p>

      <div className="my-dinners-tabs">
        <button className={`my-dinners-tab ${tab === 'hosted' ? 'active' : ''}`} onClick={() => setTab('hosted')}>{t('myDinners.hosted')} ({hostedDinners.length})</button>
        <button className={`my-dinners-tab ${tab === 'joined' ? 'active' : ''}`} onClick={() => setTab('joined')}>{t('myDinners.joined')} ({joinedDinners.length})</button>
      </div>

      <div className="my-dinners-tabs my-dinners-time-tabs">
        <button
          className={`my-dinners-tab ${timeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setTimeTab('upcoming')}
        >
          {t('myDinners.upcomingTab')} ({upcomingDinners.length})
        </button>
        <button
          className={`my-dinners-tab ${timeTab === 'past' ? 'active' : ''}`}
          onClick={() => setTimeTab('past')}
        >
          {t('myDinners.pastTab')} ({pastDinners.length})
        </button>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : (() => {
        const visibleDinners = timeTab === 'upcoming' ? upcomingDinners : pastDinners
        if (visibleDinners.length === 0) {
          if (timeTab === 'past') {
            return (
              <div className="empty-state">
                <div className="empty-state-icon"><Clock size={32} /></div>
                <h3>{t('myDinners.noPast')}</h3>
              </div>
            )
          }
          return (
            <div className="empty-state">
              <div className="empty-state-icon"><UtensilsCrossed size={32} /></div>
              <h3>{tab === 'hosted' ? t('myDinners.noHosted') : t('myDinners.noJoined')}</h3>
              <p>{tab === 'hosted' ? t('myDinners.createFirst') : t('myDinners.discoverNearby')}</p>
              <button className="btn btn-primary" onClick={() => navigate(tab === 'hosted' ? '/create' : '/')}>
                <Plus size={18} />{tab === 'hosted' ? t('myDinners.createDinner') : t('myDinners.discoverDinner')}
              </button>
            </div>
          )
        }
        return (
          <div className="managed-dinners-list">
            {timeTab === 'past' && tab === 'hosted' && pastDinners.length > 0 && (
              <div className="past-dinners-header">
                <button
                  className="btn-delete-all-past"
                  onClick={handleDeleteAllPast}
                  disabled={deletingPast}
                >
                  <Trash2 size={16} />
                  {deletingPast ? t('myDinners.deletingPast') : t('myDinners.deleteAllPast')}
                </button>
              </div>
            )}
            {visibleDinners.map((dinner) => renderDinnerCard(dinner, timeTab === 'past'))}
          </div>
        )
      })()}
    </div>
  )
}
