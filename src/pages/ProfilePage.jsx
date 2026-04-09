import { useState, useEffect, useRef } from 'react'
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { User, Mail, Edit3, Save, X, ChefHat, Star, Calendar, MapPin, ArrowLeft, Camera, Trash2 } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import StarRating from '../components/StarRating'

export default function ProfilePage() {
  const { uid } = useParams()
  const { user, updateProfilePhoto } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [hostedDinners, setHostedDinners] = useState([])
  const [avgRating, setAvgRating] = useState(null)
  const [totalRatings, setTotalRatings] = useState(0)
  const [form, setForm] = useState({
    bio: '',
    allergies: '',
    cuisinePreferences: '',
    location: ''
  })

  const profileUid = uid || user?.uid
  const isOwnProfile = user && profileUid === user.uid

  useEffect(() => {
    if (!profileUid) { setLoading(false); return }

    const fetchProfile = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', profileUid))
        if (snap.exists()) {
          const data = snap.data()
          setProfile(data)
          setForm({
            bio: data.bio || '',
            allergies: (data.allergies || []).join(', '),
            cuisinePreferences: (data.cuisinePreferences || []).join(', '),
            location: data.location || ''
          })
        } else if (isOwnProfile && user) {
          const initial = {
            displayName: user.displayName || '',
            email: user.email || '',
            photoURL: '',
            bio: '',
            allergies: [],
            cuisinePreferences: [],
            createdAt: new Date().toISOString()
          }
          await setDoc(doc(db, 'users', profileUid), initial)
          setProfile(initial)
        }

        // Fetch hosted dinners
        const hostedSnap = await getDocs(query(collection(db, 'dinners'), where('hostId', '==', profileUid)))
        const hosted = hostedSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        setHostedDinners(hosted)

        // Calculate average rating across all hosted dinners
        let allRatings = []
        for (const dinner of hosted) {
          try {
            const ratingsSnap = await getDocs(collection(db, 'dinners', dinner.id, 'ratings'))
            ratingsSnap.docs.forEach(r => allRatings.push(r.data().stars))
          } catch (e) { /* no ratings */ }
        }
        if (allRatings.length > 0) {
          setAvgRating((allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1))
          setTotalRatings(allRatings.length)
        }
      } catch (err) {
        console.error('Profile fetch error:', err)
      }
      setLoading(false)
    }
    fetchProfile()
  }, [profileUid, user])

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        const canvas = document.createElement('canvas')
        const maxSize = 200
        let width = img.width
        let height = img.height
        if (width > height) {
          if (width > maxSize) { height = Math.round(height * maxSize / width); width = maxSize }
        } else {
          if (height > maxSize) { width = Math.round(width * maxSize / height); height = maxSize }
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      }
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Bild konnte nicht geladen werden')) }
      img.src = url
    })
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    if (!file.type.startsWith('image/')) {
      showToast('Bitte wähle ein Bild aus.', 'error')
      return
    }

    setUploading(true)
    try {
      const base64 = await compressImage(file)
      await setDoc(doc(db, 'users', user.uid), { photoURL: base64 }, { merge: true })
      setProfile(prev => ({ ...prev, photoURL: base64 }))
      updateProfilePhoto(base64)
      showToast('Profilbild aktualisiert!', 'success')
    } catch (err) {
      console.error('Upload error:', err)
      showToast('Fehler beim Hochladen.', 'error')
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDeletePhoto = async () => {
    if (!user) return
    setUploading(true)
    try {
      await setDoc(doc(db, 'users', user.uid), { photoURL: '' }, { merge: true })
      setProfile(prev => ({ ...prev, photoURL: '' }))
      updateProfilePhoto(null)
      showToast('Profilbild entfernt.', 'success')
    } catch (err) {
      console.error('Delete error:', err)
      showToast('Fehler beim Entfernen.', 'error')
    }
    setUploading(false)
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      const updates = {
        bio: form.bio.trim(),
        allergies: form.allergies.split(',').map(s => s.trim()).filter(Boolean),
        cuisinePreferences: form.cuisinePreferences.split(',').map(s => s.trim()).filter(Boolean),
        location: form.location.trim(),
        displayName: user.displayName || '',
        email: user.email || '',
        photoURL: profile?.photoURL || ''
      }
      await setDoc(doc(db, 'users', user.uid), updates, { merge: true })
      setProfile(prev => ({ ...prev, ...updates }))
      setEditing(false)
      showToast('Profil gespeichert!', 'success')
    } catch (err) {
      showToast('Fehler beim Speichern.', 'error')
    }
    setSaving(false)
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>

  if (!profileUid) {
    return (
      <div className="empty-state" style={{ paddingTop: 120 }}>
        <h3>Bitte melde dich an</h3>
        <p>Du musst angemeldet sein, um dein Profil zu sehen.</p>
      </div>
    )
  }

  const displayName = profile?.displayName || 'Nutzer'
  const photoURL = profile?.photoURL || ''

  return (
    <div className="profile-page">
      <button className="detail-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} /> Zurück
      </button>

      <div className="profile-header">
        <div className="profile-avatar-large">
          {photoURL ? (
            <img src={photoURL} alt="" />
          ) : (
            <div className="profile-avatar-placeholder">
              <User size={40} />
            </div>
          )}
          {isOwnProfile && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              <button
                className="avatar-upload-overlay"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                title="Profilbild ändern"
              >
                {uploading ? (
                  <div className="spinner-small" />
                ) : (
                  <Camera size={18} />
                )}
              </button>
              {photoURL && (
                <button
                  className="avatar-delete-btn"
                  onClick={handleDeletePhoto}
                  disabled={uploading}
                  title="Profilbild entfernen"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </>
          )}
        </div>

        <div className="profile-header-info">
          <h1>{displayName}</h1>
          {profile?.email && isOwnProfile && (
            <p className="profile-email"><Mail size={14} /> {profile.email}</p>
          )}
          {avgRating && (
            <div className="profile-rating">
              <Star size={16} fill="#e85d04" stroke="#e85d04" />
              <span>{avgRating}</span>
              <span className="rating-count">({totalRatings} Bewertung{totalRatings !== 1 ? 'en' : ''})</span>
            </div>
          )}
          {profile?.location && (
            <div className="profile-location">
              <MapPin size={14} />
              <span>{profile.location}</span>
            </div>
          )}
          <div className="profile-stats">
            <div className="profile-stat">
              <ChefHat size={16} />
              <span>{hostedDinners.length} Dinner gehostet</span>
            </div>
          </div>
        </div>

        {isOwnProfile && !editing && (
          <button className="btn btn-outline profile-edit-btn" onClick={() => setEditing(true)}>
            <Edit3 size={16} /> Bearbeiten
          </button>
        )}
      </div>

      <div className="profile-body">
        {editing ? (
          <div className="profile-edit-form">
            <div className="form-group">
              <label className="form-label">Über mich</label>
              <textarea
                className="form-textarea"
                placeholder="Erzähle etwas über dich..."
                value={form.bio}
                onChange={(e) => setForm(prev => ({ ...prev, bio: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Standort</label>
              <input
                className="form-input"
                placeholder="z.B. 80331 München"
                value={form.location}
                onChange={(e) => setForm(prev => ({ ...prev, location: e.target.value }))}
              />
              <small className="form-hint">PLZ und/oder Stadt</small>
            </div>
            <div className="form-group">
              <label className="form-label">Allergien / Unverträglichkeiten</label>
              <input
                className="form-input"
                placeholder="z.B. Laktose, Nüsse, Gluten"
                value={form.allergies}
                onChange={(e) => setForm(prev => ({ ...prev, allergies: e.target.value }))}
              />
              <small className="form-hint">Kommagetrennt eingeben</small>
            </div>
            <div className="form-group">
              <label className="form-label">Lieblingsküchen</label>
              <input
                className="form-input"
                placeholder="z.B. Italienisch, Japanisch, Indisch"
                value={form.cuisinePreferences}
                onChange={(e) => setForm(prev => ({ ...prev, cuisinePreferences: e.target.value }))}
              />
              <small className="form-hint">Kommagetrennt eingeben</small>
            </div>
            <div className="profile-edit-actions">
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                <Save size={16} /> {saving ? 'Wird gespeichert...' : 'Speichern'}
              </button>
              <button className="btn btn-outline" onClick={() => setEditing(false)}>
                <X size={16} /> Abbrechen
              </button>
            </div>
          </div>
        ) : (
          <>
            {profile?.bio && (
              <div className="profile-section">
                <h3>Über mich</h3>
                <p>{profile.bio}</p>
              </div>
            )}

            {profile?.allergies?.length > 0 && (
              <div className="profile-section">
                <h3>Allergien / Unverträglichkeiten</h3>
                <div className="profile-tags">
                  {profile.allergies.map((a, i) => (
                    <span key={i} className="profile-tag allergy-tag">{a}</span>
                  ))}
                </div>
              </div>
            )}

            {profile?.cuisinePreferences?.length > 0 && (
              <div className="profile-section">
                <h3>Lieblingsküchen</h3>
                <div className="profile-tags">
                  {profile.cuisinePreferences.map((c, i) => (
                    <span key={i} className="profile-tag cuisine-tag">{c}</span>
                  ))}
                </div>
              </div>
            )}

            {!profile?.bio && !profile?.allergies?.length && !profile?.cuisinePreferences?.length && isOwnProfile && (
              <div className="profile-empty">
                <p>Dein Profil ist noch leer. Klicke auf "Bearbeiten", um es auszufüllen.</p>
              </div>
            )}
          </>
        )}

        {hostedDinners.length > 0 && (
          <div className="profile-section">
            <h3><ChefHat size={18} /> Gehostete Dinner</h3>
            <div className="profile-dinners-list">
              {hostedDinners.map(d => (
                <Link key={d.id} to={`/dinner/${d.id}`} className="profile-dinner-item">
                  <div className="profile-dinner-info">
                    <strong>{d.title}</strong>
                    <span className="profile-dinner-meta">
                      <Calendar size={12} /> {d.date} · <MapPin size={12} /> {d.location || d.address}
                    </span>
                  </div>
                  <span className="profile-dinner-cuisine">{d.cuisine}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
