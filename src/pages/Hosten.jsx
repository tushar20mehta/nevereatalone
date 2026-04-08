import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { ChefHat } from 'lucide-react'
import LoginModal from '../components/LoginModal'

const CUISINES = ['Italienisch','Asiatisch','Deutsch','Mexikanisch','Indisch','Mediterran','Vegetarisch']

export default function Hosten() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [showLogin, setShowLogin] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    title:'', description:'', date:'', time:'19:00',
    location:'', address:'', cuisine:'', maxGuests:4,
    approvalRequired: false
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) { setShowLogin(true); return }
    setSubmitting(true)
    try {
      await addDoc(collection(db, 'dinners'), {
        ...form,
        maxGuests: Number(form.maxGuests),
        hostId: user.uid,
        hostName: user.displayName || 'Anonym',
        hostPhoto: user.photoURL || '',
        guests: [],
        pendingGuests: [],
        createdAt: serverTimestamp()
      })
      navigate('/my-dinners')
    } catch (error) {
      console.error('Fehler:', error)
      alert('Fehler beim Erstellen.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="create-page">
      <div className="create-header-icon"><ChefHat size={28}/></div>
      <h1>Dinner hosten</h1>
      <p>Lade andere Menschen zum gemeinsamen Essen ein.</p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Titel <span className="required">*</span></label>
          <input className="form-input" type="text" name="title" placeholder="z.B. Pasta-Abend bei mir" value={form.title} onChange={handleChange} required/>
        </div>

        <div className="form-group">
          <label className="form-label">Beschreibung</label>
          <textarea className="form-textarea" name="description" placeholder="Was erwartet die Gäste? Was gibt es zu essen?" value={form.description} onChange={handleChange}/>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Datum <span className="required">*</span></label>
            <input className="form-input" type="date" name="date" value={form.date} onChange={handleChange} required/>
          </div>
          <div className="form-group">
            <label className="form-label">Uhrzeit <span className="required">*</span></label>
            <input className="form-input" type="time" name="time" value={form.time} onChange={handleChange} required/>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Ort/Stadt <span className="required">*</span></label>
            <input className="form-input" type="text" name="location" placeholder="z.B. Berlin Kreuzberg" value={form.location} onChange={handleChange} required/>
          </div>
          <div className="form-group">
            <label className="form-label">Adresse</label>
            <input className="form-input" type="text" name="address" placeholder="Straße, Hausnummer" value={form.address} onChange={handleChange}/>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Küche <span className="required">*</span></label>
            <select className="form-select" name="cuisine" value={form.cuisine} onChange={handleChange} required>
              <option value="">Küche wählen</option>
              {CUISINES.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Max. Gäste <span className="required">*</span></label>
            <input className="form-input" type="number" name="maxGuests" min="1" max="20" value={form.maxGuests} onChange={handleChange} required/>
          </div>
        </div>

        <div className="form-group">
          <label className="form-toggle-label">
            <input
              type="checkbox"
              name="approvalRequired"
              checked={form.approvalRequired}
              onChange={handleChange}
              className="form-toggle"
            />
            <span className="toggle-switch"></span>
            <span className="toggle-text">Gäste müssen genehmigt werden</span>
          </label>
          <small className="form-hint">Wenn aktiviert, müssen Gäste eine Anfrage senden und du kannst sie annehmen oder ablehnen.</small>
        </div>

        <button type="submit" className="btn btn-primary form-submit" disabled={submitting}>
          {submitting ? 'Wird erstellt...' : 'Dinner veröffentlichen'}
        </button>
      </form>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)}/>}
    </div>
  )
}
