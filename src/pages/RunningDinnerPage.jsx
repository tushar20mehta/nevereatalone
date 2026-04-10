import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Users, Plus, X, Clock, ChefHat } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import LoginModal from '../components/LoginModal'

export default function RunningDinnerPage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [teamCounts, setTeamCounts] = useState({})

  const [form, setForm] = useState({
    title: '',
    city: '',
    date: '',
    registrationDeadline: '',
    eventTime: '18:00',
    courseDuration: 90,
    description: ''
  })

  // Load all running dinner events
  useEffect(() => {
    const q = query(collection(db, 'runningDinners'), orderBy('date', 'asc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      setEvents(data)
      setLoading(false)

      // Load team counts for each event
      data.forEach(event => {
        const teamsRef = collection(db, 'runningDinners', event.id, 'teams')
        onSnapshot(teamsRef, (teamSnap) => {
          setTeamCounts(prev => ({ ...prev, [event.id]: teamSnap.size }))
        })
      })
    })
    return unsubscribe
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!user) { setShowLogin(true); return }
    if (!form.title || !form.city || !form.date || !form.registrationDeadline) {
      showToast(t('runningDinner.fillRequired'), 'error')
      return
    }

    setSubmitting(true)
    try {
      await addDoc(collection(db, 'runningDinners'), {
        title: form.title.trim(),
        city: form.city.trim(),
        date: form.date,
        registrationDeadline: form.registrationDeadline,
        eventTime: form.eventTime || '18:00',
        courseDuration: Number(form.courseDuration) || 90,
        description: form.description.trim(),
        organizerId: user.uid,
        organizerName: user.displayName || t('common.anonymous'),
        status: 'registration',
        createdAt: serverTimestamp()
      })
      showToast(t('runningDinner.createdSuccess'), 'success')
      setShowCreate(false)
      setForm({ title: '', city: '', date: '', registrationDeadline: '', eventTime: '18:00', courseDuration: 90, description: '' })
    } catch (err) {
      console.error('Create error:', err)
      showToast(t('runningDinner.createError'), 'error')
    }
    setSubmitting(false)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const locale = i18n.language === 'en' ? 'en-US' : 'de-DE'
    return new Date(dateStr).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const isOpen = (event) => {
    if (event.status !== 'registration') return false
    if (!event.registrationDeadline) return true
    return new Date(event.registrationDeadline) >= new Date()
  }

  return (
    <div className="rd-page">
      <div className="rd-hero">
        <h1>{t('runningDinner.title')}</h1>
        <p>{t('runningDinner.subtitle')}</p>
        <button
          className="btn btn-primary"
          onClick={() => user ? setShowCreate(true) : setShowLogin(true)}
        >
          <Plus size={18} /> {t('runningDinner.createEvent')}
        </button>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : events.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><ChefHat size={32} /></div>
          <h3>{t('runningDinner.empty')}</h3>
          <p>{t('runningDinner.emptySubtitle')}</p>
        </div>
      ) : (
        <div className="rd-grid">
          {events.map(event => (
            <div
              key={event.id}
              className="rd-card"
              onClick={() => navigate(`/running-dinner/${event.id}`)}
            >
              <div className="rd-card-status">
                {isOpen(event) ? (
                  <span className="rd-badge rd-badge-open">{t('runningDinner.registrationOpen')}</span>
                ) : event.status === 'assigned' ? (
                  <span className="rd-badge rd-badge-assigned">{t('runningDinner.teamsAssigned')}</span>
                ) : (
                  <span className="rd-badge rd-badge-closed">{t('runningDinner.closed')}</span>
                )}
              </div>
              <h3 className="rd-card-title">{event.title}</h3>
              <div className="rd-card-meta">
                <span><MapPin size={14} /> {event.city}</span>
                <span><Calendar size={14} /> {formatDate(event.date)}</span>
                <span><Clock size={14} /> {event.eventTime}</span>
                <span><Users size={14} /> {teamCounts[event.id] || 0} {t('runningDinner.teams')}</span>
              </div>
              {event.description && (
                <p className="rd-card-desc">
                  {event.description.length > 120 ? event.description.slice(0, 120) + '...' : event.description}
                </p>
              )}
              {isOpen(event) && event.registrationDeadline && (
                <p className="rd-card-deadline">{t('runningDinner.deadline')}: {formatDate(event.registrationDeadline)}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Event Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal rd-create-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('runningDinner.createTitle')}</h2>
              <button className="modal-close" onClick={() => setShowCreate(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">{t('runningDinner.eventTitle')} *</label>
                <input className="form-input" name="title" value={form.title} onChange={handleChange} placeholder={t('runningDinner.eventTitlePlaceholder')} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t('runningDinner.city')} *</label>
                  <input className="form-input" name="city" value={form.city} onChange={handleChange} placeholder={t('runningDinner.cityPlaceholder')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('runningDinner.date')} *</label>
                  <input className="form-input" type="date" name="date" value={form.date} onChange={handleChange} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t('runningDinner.registrationDeadline')} *</label>
                  <input className="form-input" type="date" name="registrationDeadline" value={form.registrationDeadline} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('runningDinner.startTime')}</label>
                  <input className="form-input" type="time" name="eventTime" value={form.eventTime} onChange={handleChange} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t('runningDinner.courseDuration')}</label>
                <input className="form-input" type="number" name="courseDuration" value={form.courseDuration} onChange={handleChange} min="30" max="180" />
              </div>
              <div className="form-group">
                <label className="form-label">{t('runningDinner.description')}</label>
                <textarea className="form-textarea" name="description" value={form.description} onChange={handleChange} placeholder={t('runningDinner.descriptionPlaceholder')} rows={3} />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? t('runningDinner.creating') : t('runningDinner.create')}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>{t('common.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  )
}
