import { useState, useEffect } from 'react'
import { doc, getDoc, collection, addDoc, onSnapshot, serverTimestamp, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useParams, useNavigate } from 'react-router-dom'
import { Calendar, Clock, MapPin, Users, ArrowLeft, ChefHat, UserPlus, Check } from 'lucide-react'
import LoginModal from '../components/LoginModal'

const COURSE_LABELS = {
  appetizer: 'Vorspeise',
  main: 'Hauptgang',
  dessert: 'Dessert',
  any: 'Egal'
}

export default function RunningDinnerDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [event, setEvent] = useState(null)
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [userTeam, setUserTeam] = useState(null)

  const [form, setForm] = useState({
    partnerName: '',
    partnerEmail: '',
    address: '',
    city: '',
    plz: '',
    preferredCourse: 'any'
  })

  // Load event
  useEffect(() => {
    if (!id) return
    const loadEvent = async () => {
      try {
        const snap = await getDoc(doc(db, 'runningDinners', id))
        if (snap.exists()) {
          setEvent({ id: snap.id, ...snap.data() })
        }
      } catch (err) {
        console.error('Event load error:', err)
      }
      setLoading(false)
    }
    loadEvent()
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
    return new Date(dateStr).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
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

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!user) { setShowLogin(true); return }

    if (!form.address || !form.plz || !form.city) {
      showToast('Bitte gib deine Adresse ein.', 'error')
      return
    }

    setSubmitting(true)
    try {
      await addDoc(collection(db, 'runningDinners', id, 'teams'), {
        member1Id: user.uid,
        member1Name: user.displayName || 'Anonym',
        member2Id: '',
        member2Name: form.partnerName.trim() || '',
        partnerEmail: form.partnerEmail.trim() || '',
        address: form.address.trim(),
        city: form.city.trim(),
        plz: form.plz.trim(),
        preferredCourse: form.preferredCourse,
        assignedCourse: '',
        route: [],
        createdAt: serverTimestamp()
      })
      showToast('Team erfolgreich angemeldet!', 'success')
      setShowRegister(false)
      setForm({ partnerName: '', partnerEmail: '', address: '', city: '', plz: '', preferredCourse: 'any' })
    } catch (err) {
      console.error('Register error:', err)
      showToast('Fehler bei der Anmeldung.', 'error')
    }
    setSubmitting(false)
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>

  if (!event) {
    return (
      <div className="empty-state" style={{ paddingTop: 120 }}>
        <h3>Event nicht gefunden</h3>
        <button className="btn btn-primary" onClick={() => navigate('/running-dinner')}>Zurück</button>
      </div>
    )
  }

  return (
    <div className="rd-detail-page">
      <button className="detail-back" onClick={() => navigate('/running-dinner')}>
        <ArrowLeft size={18} /> Zurück
      </button>

      <div className="rd-detail-card">
        <div className="rd-detail-header">
          <div>
            <h1>{event.title}</h1>
            <div className="rd-detail-meta">
              <span><MapPin size={16} /> {event.city}</span>
              <span><Calendar size={16} /> {formatDate(event.date)}</span>
              <span><Clock size={16} /> {event.eventTime} Uhr</span>
              <span><Users size={16} /> {teams.length} Teams angemeldet</span>
            </div>
          </div>
          {isOpen() ? (
            <span className="rd-badge rd-badge-open">Anmeldung offen</span>
          ) : event.status === 'assigned' ? (
            <span className="rd-badge rd-badge-assigned">Teams zugeteilt</span>
          ) : (
            <span className="rd-badge rd-badge-closed">Abgeschlossen</span>
          )}
        </div>

        {event.description && (
          <div className="rd-detail-desc">
            <h3>Über das Event</h3>
            <p>{event.description}</p>
          </div>
        )}

        <div className="rd-detail-info">
          <div className="rd-info-item">
            <strong>Ablauf</strong>
            <p>3 Gänge (Vorspeise, Hauptgang, Dessert) an 3 verschiedenen Orten. Jedes Team kocht einen Gang zu Hause und ist bei den anderen Gängen zu Gast.</p>
          </div>
          <div className="rd-info-item">
            <strong>Dauer pro Gang</strong>
            <p>{event.courseDuration || 90} Minuten</p>
          </div>
          {event.registrationDeadline && (
            <div className="rd-info-item">
              <strong>Anmeldeschluss</strong>
              <p>{formatDate(event.registrationDeadline)}</p>
            </div>
          )}
          <div className="rd-info-item">
            <strong>Organisiert von</strong>
            <p>{event.organizerName}</p>
          </div>
        </div>

        {/* Registration Section */}
        {isOpen() && !userTeam && (
          <div className="rd-register-section">
            {!showRegister ? (
              <button
                className="btn btn-primary rd-register-btn"
                onClick={() => user ? setShowRegister(true) : setShowLogin(true)}
              >
                <UserPlus size={18} /> Als Team anmelden
              </button>
            ) : (
              <form className="rd-register-form" onSubmit={handleRegister}>
                <h3><UserPlus size={18} /> Team-Anmeldung</h3>

                <div className="form-group">
                  <label className="form-label">Dein/e Partner/in (Name)</label>
                  <input className="form-input" name="partnerName" value={form.partnerName} onChange={handleChange} placeholder="Name deines Teampartners" />
                </div>
                <div className="form-group">
                  <label className="form-label">Partner E-Mail (optional)</label>
                  <input className="form-input" type="email" name="partnerEmail" value={form.partnerEmail} onChange={handleChange} placeholder="Email zur Einladung" />
                </div>

                <div className="rd-form-divider">Eure Adresse (hier kocht ihr)</div>

                <div className="form-group">
                  <label className="form-label">Straße und Hausnummer *</label>
                  <input className="form-input" name="address" value={form.address} onChange={handleChange} placeholder="z.B. Musterstraße 12" required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">PLZ *</label>
                    <input className="form-input" name="plz" value={form.plz} onChange={handleChange} placeholder="z.B. 80331" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Stadt *</label>
                    <input className="form-input" name="city" value={form.city} onChange={handleChange} placeholder="z.B. München" required />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Bevorzugter Gang</label>
                  <select className="form-input" name="preferredCourse" value={form.preferredCourse} onChange={handleChange}>
                    <option value="any">Egal</option>
                    <option value="appetizer">Vorspeise</option>
                    <option value="main">Hauptgang</option>
                    <option value="dessert">Dessert</option>
                  </select>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Wird angemeldet...' : 'Team anmelden'}
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => setShowRegister(false)}>Abbrechen</button>
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
              <strong>Ihr seid angemeldet!</strong>
              <p>Team: {userTeam.member1Name}{userTeam.member2Name ? ` & ${userTeam.member2Name}` : ''}</p>
              {userTeam.assignedCourse && (
                <p>Euer Gang: <strong>{COURSE_LABELS[userTeam.assignedCourse] || userTeam.assignedCourse}</strong></p>
              )}
              {userTeam.route?.length > 0 && (
                <div className="rd-route">
                  <strong>Eure Route:</strong>
                  {userTeam.route.map((stop, i) => (
                    <div key={i} className="rd-route-stop">
                      <span className="rd-route-number">{i + 1}</span>
                      <span>{COURSE_LABELS[stop.courseNumber] || `Gang ${stop.courseNumber}`} — {stop.address} ({stop.time})</span>
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
            <h3><Users size={18} /> Angemeldete Teams ({teams.length})</h3>
            <div className="rd-teams-list">
              {teams.map(team => (
                <div key={team.id} className="rd-team-item">
                  <div className="rd-team-names">
                    <strong>{team.member1Name}</strong>
                    {team.member2Name && <span> & {team.member2Name}</span>}
                  </div>
                  <div className="rd-team-info">
                    <span><MapPin size={12} /> {team.plz} {team.city}</span>
                    {team.assignedCourse && (
                      <span className="rd-team-course">{COURSE_LABELS[team.assignedCourse]}</span>
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
