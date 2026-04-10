import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { ChefHat } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import LoginModal from '../components/LoginModal'

const CUISINES = ['Italienisch','Asiatisch','Deutsch','Mexikanisch','Indisch','Mediterran','Vegetarisch']
const CUISINE_KEYS = { 'Italienisch': 'italian', 'Asiatisch': 'asian', 'Deutsch': 'german', 'Mexikanisch': 'mexican', 'Indisch': 'indian', 'Mediterran': 'mediterranean', 'Vegetarisch': 'vegetarian' }

export default function Hosten() {
  const { t } = useTranslation()
  const { user, profilePhoto } = useAuth()
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
        hostName: user.displayName || t('common.anonymous'),
        hostPhoto: profilePhoto || '',
        guests: [],
        pendingGuests: [],
        createdAt: serverTimestamp()
      })
      navigate('/my-dinners')
    } catch (error) {
      console.error('Error:', error)
      alert(t('host.error'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="create-page">
      <div className="create-header-icon"><ChefHat size={28}/></div>
      <h1>{t('host.title')}</h1>
      <p>{t('host.subtitle')}</p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">{t('host.dinnerTitle')} <span className="required">*</span></label>
          <input className="form-input" type="text" name="title" placeholder={t('host.dinnerTitlePlaceholder')} value={form.title} onChange={handleChange} required/>
        </div>

        <div className="form-group">
          <label className="form-label">{t('host.description')}</label>
          <textarea className="form-textarea" name="description" placeholder={t('host.descriptionPlaceholder')} value={form.description} onChange={handleChange}/>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t('host.date')} <span className="required">*</span></label>
            <input className="form-input" type="date" name="date" value={form.date} onChange={handleChange} required/>
          </div>
          <div className="form-group">
            <label className="form-label">{t('host.time')} <span className="required">*</span></label>
            <input className="form-input" type="time" name="time" value={form.time} onChange={handleChange} required/>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t('host.locationCity')} <span className="required">*</span></label>
            <input className="form-input" type="text" name="location" placeholder={t('host.locationPlaceholder')} value={form.location} onChange={handleChange} required/>
          </div>
          <div className="form-group">
            <label className="form-label">{t('host.address')}</label>
            <input className="form-input" type="text" name="address" placeholder={t('host.addressPlaceholder')} value={form.address} onChange={handleChange}/>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t('host.cuisine')} <span className="required">*</span></label>
            <select className="form-select" name="cuisine" value={form.cuisine} onChange={handleChange} required>
              <option value="">{t('host.chooseCuisine')}</option>
              {CUISINES.map((c) => (<option key={c} value={c}>{t(`discover.cuisines.${CUISINE_KEYS[c]}`)}</option>))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">{t('host.maxGuests')} <span className="required">*</span></label>
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
            <span className="toggle-text">{t('host.approvalRequired')}</span>
          </label>
          <small className="form-hint">{t('host.approvalHint')}</small>
        </div>

        <button type="submit" className="btn btn-primary form-submit" disabled={submitting}>
          {submitting ? t('host.submitting') : t('host.submit')}
        </button>
      </form>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)}/>}
    </div>
  )
}
