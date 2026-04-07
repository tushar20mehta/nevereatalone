import { useState, useEffect } from 'react'
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc, updateDoc, arrayRemove } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { Plus, UtensilsCrossed, Trash2, Users, X, ChevronDown, ChevronUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DinnerCard from '../components/DinnerCard'
import LoginModal from '../components/LoginModal'

export default function MeineDinner() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('hosted')
  const [hostedDinners, setHostedDinners] = useState([])
  const [joinedDinners, setJoinedDinners] = useState([])
  const [loading, setLoading] = useState(true)
  const [showLogin, setShowLogin] = useState(false)
  const [expandedDinner, setExpandedDinner] = useState(null)
  const [deleting, setDeleting] = useState(null)

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
    if (!window.confirm('Dinner wirklich löschen? Das kann nicht rückgängig gemacht werden.')) return
    setDeleting(dinnerId)
    try {
      await deleteDoc(doc(db, 'dinners', dinnerId))
    } catch (err) {
      alert('Fehler beim Löschen.')
    }
    setDeleting(null)
  }

  const handleRemoveGuest = async (dinnerId, guestId) => {
    if (!window.confirm('Gast wirklich entfernen?')) return
    try {
      await updateDoc(doc(db, 'dinners', dinnerId), {
        guests: arrayRemove(guestId)
      })
    } catch (err) {
      alert('Fehler beim Entfernen.')
    }
  }

  if (!user) {
    return (
      <div className="empty-state" style={{ paddingTop: 120 }}>
        <div className="empty-state-icon"><UtensilsCrossed size={32} /></div>
        <h3>Anmeldung erforderlich</h3>
        <p>Melde dich an, um deine Dinner zu sehen.</p>
        <button className="btn btn-primary" onClick={() => setShowLogin(true)}>Anmelden</button>
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      </div>
    )
  }

  const currentDinners = tab === 'hosted' ? hostedDinners : joinedDinners

  return (
    <div className="my-dinners-page">
      <h1>Meine Dinner</h1>
      <p>Verwalte deine gehosteten und gebuchten Dinner.</p>
      <div className="my-dinners-tabs">
        <button className={`my-dinners-tab ${tab === 'hosted' ? 'active' : ''}`} onClick={() => setTab('hosted')}>Gehostet ({hostedDinners.length})</button>
        <button className={`my-dinners-tab ${tab === 'joined' ? 'active' : ''}`} onClick={() => setTab('joined')}>Teilgenommen ({joinedDinners.length})</button>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : currentDinners.length > 0 ? (
        <div className="managed-dinners-list">
          {currentDinners.map((dinner) => (
            <div key={dinner.id} className="managed-dinner-card">
              <div className="managed-dinner-header" onClick={() => navigate(`/dinner/${dinner.id}`)}>
                <div className="managed-dinner-info">
                  <span className="dinner-card-cuisine">{dinner.cuisine}</span>
                  <h3>{dinner.title}</h3>
                  <p>{dinner.date} {dinner.time && `um ${dinner.time} Uhr`} • {dinner.location}</p>
                </div>
              </div>

              {tab === 'hosted' && (
                <div className="managed-dinner-actions">
                  <button
                    className="managed-guests-toggle"
                    onClick={() => setExpandedDinner(expandedDinner === dinner.id ? null : dinner.id)}
                  >
                    <Users size={16} />
                    Gäste ({(dinner.guests || []).length}/{dinner.maxGuests})
                    {expandedDinner === dinner.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(dinner.id)}
                    disabled={deleting === dinner.id}
                  >
                    <Trash2 size={16} />
                    {deleting === dinner.id ? 'Löscht...' : 'Löschen'}
                  </button>
                </div>
              )}

              {tab === 'hosted' && expandedDinner === dinner.id && (
                <div className="managed-guests-list">
                  {(dinner.guests || []).length === 0 ? (
                    <p className="managed-guests-empty">Noch keine Gäste angemeldet.</p>
                  ) : (
                    (dinner.guests || []).map((guestId, i) => (
                      <div key={guestId} className="managed-guest-item">
                        <span>Gast {i + 1}</span>
                        <button className="btn-remove-guest" onClick={() => handleRemoveGuest(dinner.id, guestId)}>
                          <X size={14} /> Entfernen
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon"><UtensilsCrossed size={32} /></div>
          <h3>{tab === 'hosted' ? 'Noch keine Dinner gehostet' : 'Noch an keinem Dinner teilgenommen'}</h3>
          <p>{tab === 'hosted' ? 'Erstelle dein erstes Dinner!' : 'Entdecke Dinner in deiner Nähe!'}</p>
          <button className="btn btn-primary" onClick={() => navigate(tab === 'hosted' ? '/create' : '/')}><Plus size={18} />{tab === 'hosted' ? 'Dinner erstellen' : 'Dinner entdecken'}</button>
        </div>
      )}
    </div>
  )
}
