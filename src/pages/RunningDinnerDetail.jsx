import { useState, useEffect } from 'react'
import { doc, getDoc, collection, addDoc, updateDoc, writeBatch, onSnapshot, serverTimestamp, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useParams, useNavigate } from 'react-router-dom'
import { Calendar, Clock, MapPin, Users, ArrowLeft, ChefHat, UserPlus, Check, Shuffle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import LoginModal from '../components/LoginModal'
import { COUNTRY_CODES, ADDRESS_PLACEHOLDERS } from '../utils/countries'

export default function RunningDinnerDetail() {
  const { t, i18n } = useTranslation()
  const { id } = useParams()
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const courseLabel = (key) => {
    const map = { appetizer: 'runningDinner.appetizer', main: 'runningDinner.main', dessert: 'runningDinner.dessert', any: 'runningDinner.any' }
    return t(map[key] || 'runningDinner.any')
  }

  const [event, setEvent] = useState(null)
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [userTeam, setUserTeam] = useState(null)
  const [assigning, setAssigning] = useState(false)

  const [form, setForm] = useState({
    partnerName: '',
    partnerEmail: '',
    country: 'DE',
    address: '',
    preferredCourse: 'any'
  })

  // Load event in real-time
  useEffect(() => {
    if (!id) return
    const unsubscribe = onSnapshot(doc(db, 'runningDinners', id), (snap) => {
      if (snap.exists()) {
        setEvent({ id: snap.id, ...snap.data() })
      }
      setLoading(false)
    }, () => setLoading(false))
    return unsubscribe
  }, [id])

  // Load teams in real-time
  useEffect(() => {
    if (!id) return
    const q = query(collection(db, 'runningDinners', id, 'teams'), orderBy('createdAt', 'asc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      setTeams(data)

      // Check if current user is already in a team
      if (user) {
        const found = data.find(t => t.member1Id === user.uid || t.member2Id === user.uid)
        setUserTeam(found || null)
      }
    })
    return unsubscribe
  }, [id, user])

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const locale = i18n.language === 'en' ? 'en-US' : 'de-DE'
    return new Date(dateStr).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  const isOpen = () => {
    if (!event) return false
    if (event.status !== 'registration') return false
    if (!event.registrationDeadline) return true
    return new Date(event.registrationDeadline) >= new Date()
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  // Combine legacy plz/city/address into single string
  const getTeamAddress = (team) => {
    if (team.address && !team.plz && !team.city) return team.address
    const parts = []
    if (team.address) parts.push(team.address)
    const line2 = [team.plz, team.city].filter(Boolean).join(' ')
    if (line2) parts.push(line2)
    return parts.join('\n')
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!user) { setShowLogin(true); return }

    if (!form.address.trim()) {
      showToast(t('runningDinner.addressRequired'), 'error')
      return
    }

    setSubmitting(true)
    try {
      await addDoc(collection(db, 'runningDinners', id, 'teams'), {
        member1Id: user.uid,
        member1Name: user.displayName || t('common.anonymous'),
        member2Id: '',
        member2Name: form.partnerName.trim() || '',
        partnerEmail: form.partnerEmail.trim() || '',
        country: form.country,
        address: form.address.trim(),
        preferredCourse: form.preferredCourse,
        assignedCourse: '',
        route: [],
        createdAt: serverTimestamp()
      })
      showToast(t('runningDinner.registeredSuccess'), 'success')
      setShowRegister(false)
      setForm({ partnerName: '', partnerEmail: '', country: 'DE', address: '', preferredCourse: 'any' })
    } catch (err) {
      console.error('Register error:', err)
      showToast(t('runningDinner.registerError'), 'error')
    }
    setSubmitting(false)
  }

  const isOrganizer = user && event && event.organizerId === user.uid
  const deadlinePassed = event && event.registrationDeadline && new Date(event.registrationDeadline) < new Date()
  const canAssign = isOrganizer && deadlinePassed && event.status === 'registration' && teams.length >= 3

  const addMinutes = (timeStr, minutes) => {
    const [h, m] = timeStr.split(':').map(Number)
    const total = h * 60 + m + minutes
    const rh = Math.floor(total / 60) % 24
    const rm = total % 60
    return `${String(rh).padStart(2, '0')}:${String(rm).padStart(2, '0')}`
  }

  const handleAssignTeams = async () => {
    if (!canAssign) return
    setAssigning(true)

    try {
      const courses = ['appetizer', 'main', 'dessert']
      const duration = event.courseDuration || 90
      const startTime = event.eventTime || '18:00'

      const teamsCopy = [...teams]
      const assigned = { appetizer: [], main: [], dessert: [] }
      const targetSize = Math.floor(teamsCopy.length / 3)

      for (const course of courses) {
        const preferred = teamsCopy.filter(t =>
          t.preferredCourse === course && !Object.values(assigned).flat().includes(t)
        )
        for (const team of preferred) {
          if (assigned[course].length < targetSize) {
            assigned[course].push(team)
          }
        }
      }

      const alreadyAssigned = new Set(Object.values(assigned).flat().map(t => t.id))
      const remaining = teamsCopy.filter(t => !alreadyAssigned.has(t.id))

      for (const course of courses) {
        while (assigned[course].length < targetSize && remaining.length > 0) {
          assigned[course].push(remaining.shift())
        }
      }
      while (remaining.length > 0) {
        const minCourse = courses.reduce((a, b) => assigned[a].length <= assigned[b].length ? a : b)
        assigned[minCourse].push(remaining.shift())
      }

      const courseMap = {}
      for (const course of courses) {
        for (const team of assigned[course]) {
          courseMap[team.id] = course
        }
      }

      const maxGroupCount = Math.max(...courses.map(c => assigned[c].length))
      const groups = []
      for (let i = 0; i < maxGroupCount; i++) {
        const group = {}
        for (const course of courses) {
          group[course] = assigned[course][i % assigned[course].length]
        }
        groups.push(group)
      }

      const batch = writeBatch(db)

      for (const team of teamsCopy) {
        const assignedCourse = courseMap[team.id]
        const myGroup = groups.find(g => Object.values(g).some(t => t.id === team.id))
        if (!myGroup) continue

        const route = courses.map((course, idx) => {
          const hostTeam = myGroup[course]
          const time = addMinutes(startTime, idx * duration)
          return {
            courseNumber: idx + 1,
            courseKey: course,
            hostTeamId: hostTeam.id,
            hostAddress: getTeamAddress(hostTeam),
            time
          }
        })

        const teamRef = doc(db, 'runningDinners', id, 'teams', team.id)
        batch.update(teamRef, { assignedCourse, route })
      }

      batch.update(doc(db, 'runningDinners', id), { status: 'assigned' })

      await batch.commit()
      showToast(t('runningDinner.assignedSuccess', { count: teamsCopy.length }), 'success')
    } catch (err) {
      console.error('Assignment error:', err)
      showToast(t('runningDinner.assignError'), 'error')
    }
    setAssigning(false)
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>

  if (!event) {
    return (
      <div className="empty-state" style={{ paddingTop: 120 }}>
        <h3>{t('runningDinner.eventNotFound')}</h3>
        <button className="btn btn-primary" onClick={() => navigate('/running-dinner')}>{t('common.back')}</button>
      </div>
    )
  }

  return (
    <div className="rd-detail-page">
      <button className="detail-back" onClick={() => navigate('/running-dinner')}>
        <ArrowLeft size={18} /> {t('common.back')}
      </button>

      <div className="rd-detail-card">
        <div className="rd-detail-header">
          <div>
            <h1>{event.title}</h1>
            <div className="rd-detail-meta">
              <span><MapPin size={16} /> {event.city}</span>
              <span><Calendar size={16} /> {formatDate(event.date)}</span>
              <span><Clock size={16} /> {event.eventTime}</span>
              <span><Users size={16} /> {teams.length} {t('runningDinner.teamsRegistered')}</span>
            </div>
          </div>
          {isOpen() ? (
            <span className="rd-badge rd-badge-open">{t('runningDinner.registrationOpen')}</span>
          ) : event.status === 'assigned' ? (
            <span className="rd-badge rd-badge-assigned">{t('runningDinner.teamsAssigned')}</span>
          ) : (
            <span className="rd-badge rd-badge-closed">{t('runningDinner.closed')}</span>
          )}
        </div>

        {event.description && (
          <div className="rd-detail-desc">
            <h3>{t('runningDinner.about')}</h3>
            <p>{event.description}</p>
          </div>
        )}

        <div className="rd-detail-info">
          <div className="rd-info-item">
            <strong>{t('runningDinner.flow')}</strong>
            <p>{t('runningDinner.flowText')}</p>
          </div>
          <div className="rd-info-item">
            <strong>{t('runningDinner.perCourse')}</strong>
            <p>{t('runningDinner.minutes', { count: event.courseDuration || 90 })}</p>
          </div>
          {event.registrationDeadline && (
            <div className="rd-info-item">
              <strong>{t('runningDinner.deadline')}</strong>
              <p>{formatDate(event.registrationDeadline)}</p>
            </div>
          )}
          <div className="rd-info-item">
            <strong>{t('runningDinner.organizedBy')}</strong>
            <p>{event.organizerName}</p>
          </div>
        </div>

        {/* Organizer: Assign Teams Button */}
        {canAssign && (
          <div className="rd-assign-section">
            <p className="rd-assign-info" dangerouslySetInnerHTML={{ __html: t('runningDinner.assignInfo', { count: teams.length }) }} />
            {teams.length < 3 && <p className="rd-assign-info">{t('runningDinner.needMinTeams')}</p>}
            <button
              className="btn btn-primary rd-assign-btn"
              onClick={handleAssignTeams}
              disabled={assigning || teams.length < 3}
            >
              <Shuffle size={18} /> {assigning ? t('runningDinner.assigning') : t('runningDinner.assign')}
            </button>
          </div>
        )}

        {/* Registration Section */}
        {isOpen() && !userTeam && (
          <div className="rd-register-section">
            {!showRegister ? (
              <button
                className="btn btn-primary rd-register-btn"
                onClick={() => user ? setShowRegister(true) : setShowLogin(true)}
              >
                <UserPlus size={18} /> {t('runningDinner.registerAsTeam')}
              </button>
            ) : (
              <form className="rd-register-form" onSubmit={handleRegister}>
                <h3><UserPlus size={18} /> {t('runningDinner.teamRegistration')}</h3>

                <div className="form-group">
                  <label className="form-label">{t('runningDinner.partnerName')}</label>
                  <input className="form-input" name="partnerName" value={form.partnerName} onChange={handleChange} placeholder={t('runningDinner.partnerNamePlaceholder')} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('runningDinner.partnerEmail')}</label>
                  <input className="form-input" type="email" name="partnerEmail" value={form.partnerEmail} onChange={handleChange} placeholder={t('runningDinner.partnerEmailPlaceholder')} />
                </div>

                <div className="rd-form-divider">{t('runningDinner.yourAddress')}</div>

                <div className="form-group">
                  <label className="form-label">{t('runningDinner.country')}</label>
                  <select className="form-select" name="country" value={form.country} onChange={handleChange}>
                    {COUNTRY_CODES.map(code => (
                      <option key={code} value={code}>{t(`countries.${code}`)}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('runningDinner.address')} *</label>
                  <textarea
                    className="form-textarea address-textarea"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder={ADDRESS_PLACEHOLDERS[form.country] || ADDRESS_PLACEHOLDERS.OTHER}
                    rows={3}
                    required
                  />
                  <small className="form-hint">{t('runningDinner.addressHint')}</small>
                </div>

                <div className="form-group">
                  <label className="form-label">{t('runningDinner.preferredCourse')}</label>
                  <select className="form-input" name="preferredCourse" value={form.preferredCourse} onChange={handleChange}>
                    <option value="any">{t('runningDinner.any')}</option>
                    <option value="appetizer">{t('runningDinner.appetizer')}</option>
                    <option value="main">{t('runningDinner.main')}</option>
                    <option value="dessert">{t('runningDinner.dessert')}</option>
                  </select>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? t('runningDinner.registering') : t('runningDinner.registerTeam')}
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => setShowRegister(false)}>{t('common.cancel')}</button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Already registered */}
        {userTeam && (
          <div className="rd-registered">
            <Check size={20} />
            <div>
              <strong>{t('runningDinner.youAreRegistered')}</strong>
              <p>{t('runningDinner.team')}: {userTeam.member1Name}{userTeam.member2Name ? ` & ${userTeam.member2Name}` : ''}</p>
              {userTeam.assignedCourse && (
                <p>{t('runningDinner.yourCourse')}: <strong>{courseLabel(userTeam.assignedCourse)}</strong></p>
              )}
              {userTeam.route?.length > 0 && (
                <div className="rd-route">
                  <strong>{t('runningDinner.yourRoute')}:</strong>
                  {userTeam.route.map((stop, i) => (
                    <div key={i} className="rd-route-stop">
                      <span className="rd-route-number">{stop.courseNumber}</span>
                      <div>
                        <strong>{courseLabel(stop.courseKey) || stop.courseName}</strong>
                        {stop.hostTeamId === userTeam.id && <span className="rd-route-host-badge">{t('runningDinner.youCook')}</span>}
                        <br />
                        <span className="rd-route-address display-address">{stop.hostAddress}</span>
                        <br />
                        <span className="rd-route-time"><Clock size={12} /> {stop.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Teams List */}
        {teams.length > 0 && (
          <div className="rd-teams-section">
            <h3><Users size={18} /> {t('runningDinner.teamsList')} ({teams.length})</h3>
            <div className="rd-teams-list">
              {teams.map(team => (
                <div key={team.id} className="rd-team-item">
                  <div className="rd-team-names">
                    <strong>{team.member1Name}</strong>
                    {team.member2Name && <span> & {team.member2Name}</span>}
                  </div>
                  <div className="rd-team-info">
                    <span><MapPin size={12} /> {team.city || (team.address || '').split('\n').slice(-1)[0]}</span>
                    {team.assignedCourse && (
                      <span className="rd-team-course">{courseLabel(team.assignedCourse)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  )
}
