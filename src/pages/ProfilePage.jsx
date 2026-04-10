import { useState, useEffect, useRef } from 'react'
import { doc, getDoc, setDoc, deleteDoc, updateDoc, collection, query, where, getDocs, arrayRemove, collectionGroup } from 'firebase/firestore'
import { deleteUser, GoogleAuthProvider, reauthenticateWithPopup } from 'firebase/auth'
import { db, auth } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { User, Mail, Edit3, Save, X, ChefHat, Star, Calendar, MapPin, ArrowLeft, Camera, Trash2, AlertTriangle, Instagram } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import { useTranslation } from 'react-i18next'
import StarRating from '../components/StarRating'
import { COUNTRY_CODES } from '../utils/countries'

export default function ProfilePage() {
  const { t } = useTranslation()
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [hostedDinners, setHostedDinners] = useState([])
  const [avgRating, setAvgRating] = useState(null)
  const [totalRatings, setTotalRatings] = useState(0)
  const [form, setForm] = useState({
    bio: '',
    allergies: '',
    cuisinePreferences: '',
    country: 'DE',
    city: '',
    postalCode: '',
    street: '',
    instagram: ''
  })
  // Legacy multi-line address from older schema — shown read-only as a fallback
  // until the user fills out the new city/postalCode fields.
  const [legacyAddress, setLegacyAddress] = useState('')

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
          // Backwards compat: assemble a legacy string view if no new fields are set yet
          let legacy = ''
          if (!data.city && !data.postalCode) {
            legacy = data.address || ''
            if (!legacy && (data.street || data.plz || data.city)) {
              const parts = []
              if (data.street) parts.push(data.street)
              const line2 = [data.plz, data.city].filter(Boolean).join(' ')
              if (line2) parts.push(line2)
              legacy = parts.join('\n')
            }
            if (!legacy && data.location) legacy = data.location
          }
          setLegacyAddress(legacy)

          // Load private street address (only owner can read their own)
          let street = ''
          if (isOwnProfile && user && profileUid === user.uid) {
            try {
              const privSnap = await getDoc(doc(db, 'users', profileUid, 'private', 'address'))
              if (privSnap.exists()) street = privSnap.data().street || ''
            } catch (e) { /* no private doc yet */ }
          }

          setForm({
            bio: data.bio || '',
            allergies: (data.allergies || []).join(', '),
            cuisinePreferences: (data.cuisinePreferences || []).join(', '),
            country: data.country || 'DE',
            city: data.city || '',
            postalCode: data.postalCode || '',
            street,
            instagram: data.instagram || ''
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
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image could not be loaded')) }
      img.src = url
    })
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    if (!file.type.startsWith('image/')) {
      showToast(t('profile.pickImage'), 'error')
      return
    }

    setUploading(true)
    try {
      const base64 = await compressImage(file)
      await setDoc(doc(db, 'users', user.uid), { photoURL: base64 }, { merge: true })
      setProfile(prev => ({ ...prev, photoURL: base64 }))
      updateProfilePhoto(base64)
      showToast(t('profile.photoUpdated'), 'success')
    } catch (err) {
      console.error('Upload error:', err)
      showToast(t('profile.photoUploadError'), 'error')
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
      showToast(t('profile.photoRemoved'), 'success')
    } catch (err) {
      console.error('Delete error:', err)
      showToast(t('profile.photoRemoveError'), 'error')
    }
    setUploading(false)
  }

  const handleSave = async () => {
    if (!user) return
    const city = form.city.trim()
    const postalCode = form.postalCode.trim()
    if (!city) { showToast(t('profile.cityRequired'), 'error'); return }
    if (!postalCode) { showToast(t('profile.postalCodeRequired'), 'error'); return }
    setSaving(true)
    try {
      const street = form.street.trim()
      const updates = {
        bio: form.bio.trim(),
        allergies: form.allergies.split(',').map(s => s.trim()).filter(Boolean),
        cuisinePreferences: form.cuisinePreferences.split(',').map(s => s.trim()).filter(Boolean),
        country: form.country,
        city,
        postalCode,
        instagram: form.instagram.trim().replace(/^@/, ''),
        displayName: user.displayName || '',
        email: user.email || '',
        photoURL: profile?.photoURL || ''
      }
      await setDoc(doc(db, 'users', user.uid), updates, { merge: true })

      // Write the sensitive street address into the private subcollection.
      // Set even if empty so that a cleared field removes the old value.
      await setDoc(doc(db, 'users', user.uid, 'private', 'address'), { street })

      setProfile(prev => ({ ...prev, ...updates }))
      setLegacyAddress('')
      setEditing(false)
      showToast(t('profile.profileSaved'), 'success')
    } catch (err) {
      console.error('Save profile error:', err)
      showToast(t('profile.saveError'), 'error')
    }
    setSaving(false)
  }

  const handleDeleteAccount = async () => {
    if (!user) return
    setDeleting(true)
    try {
      const uid = user.uid

      // 1. Delete all dinners hosted by this user
      const hostedSnap = await getDocs(query(collection(db, 'dinners'), where('hostId', '==', uid)))
      for (const d of hostedSnap.docs) {
        await deleteDoc(d.ref)
      }

      // 2. Remove user from guest arrays of all dinners they joined
      const guestSnap = await getDocs(query(collection(db, 'dinners'), where('guests', 'array-contains', uid)))
      for (const d of guestSnap.docs) {
        await updateDoc(d.ref, { guests: arrayRemove(uid) })
      }

      // 3. Delete running dinner teams where user is member
      const allEventsSnap = await getDocs(collection(db, 'runningDinners'))
      for (const event of allEventsSnap.docs) {
        const teamsSnap = await getDocs(collection(db, 'runningDinners', event.id, 'teams'))
        for (const team of teamsSnap.docs) {
          const data = team.data()
          if (data.member1Id === uid || data.member2Id === uid) {
            await deleteDoc(team.ref)
          }
        }
      }

      // 4. Delete running dinner events organized by this user
      const organizedSnap = await getDocs(query(collection(db, 'runningDinners'), where('organizerId', '==', uid)))
      for (const d of organizedSnap.docs) {
        // Delete all teams in this event first
        const teamsSnap = await getDocs(collection(db, 'runningDinners', d.id, 'teams'))
        for (const team of teamsSnap.docs) {
          await deleteDoc(team.ref)
        }
        await deleteDoc(d.ref)
      }

      // 5. Delete user document
      await deleteDoc(doc(db, 'users', uid))

      // 6. Try deleting Auth account directly (works if login is recent enough)
      try {
        await deleteUser(auth.currentUser)
      } catch (authErr) {
        if (authErr.code !== 'auth/requires-recent-login') throw authErr

        // 7. Login not recent enough — try re-auth via popup
        try {
          const provider = new GoogleAuthProvider()
          await reauthenticateWithPopup(auth.currentUser, provider)
          await deleteUser(auth.currentUser)
        } catch (reauthErr) {
          if (reauthErr.code === 'auth/popup-blocked' || reauthErr.code === 'auth/popup-closed-by-user' || reauthErr.code === 'auth/cancelled-popup-request') {
            showToast(t('profile.loginAgainHint'), 'error')
            setDeleting(false)
            setShowDeleteConfirm(false)
            return
          }
          throw reauthErr
        }
      }
      navigate('/')
    } catch (err) {
      console.error('Delete account error:', err)
      showToast(t('profile.deleteError'), 'error')
    }
    setDeleting(false)
    setShowDeleteConfirm(false)
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>

  if (!profileUid) {
    return (
      <div className="empty-state" style={{ paddingTop: 120 }}>
        <h3>{t('profile.loginRequired')}</h3>
        <p>{t('profile.loginToSeeProfile')}</p>
      </div>
    )
  }

  const displayName = profile?.displayName || t('common.user')
  const photoURL = profile?.photoURL || ''
  // Public display: never shows street / house number. City + postal code only.
  // Fallback: if the user hasn't filled the new fields yet, show the legacy
  // string read-only so the profile isn't empty mid-migration.
  const publicLocationLine = [profile?.postalCode, profile?.city].filter(Boolean).join(' ')
  const hasNewAddress = !!(profile?.city || profile?.postalCode)
  const displayAddress = hasNewAddress ? publicLocationLine : legacyAddress
  const displayCountry = profile?.country

  return (
    <div className="profile-page">
      <button className="detail-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} /> {t('common.back')}
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
                title={t('profile.changePhoto')}
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
                  title={t('profile.removePhoto')}
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
              <span className="rating-count">({t('dinner.ratingCount', { count: totalRatings })})</span>
            </div>
          )}
          {displayAddress && (
            <div className="profile-location">
              <MapPin size={14} />
              <span className="display-address">
                {displayAddress}
                {displayCountry && `\n${t(`countries.${displayCountry}`, { defaultValue: displayCountry })}`}
              </span>
            </div>
          )}
          {profile?.instagram && (
            <a
              href={`https://instagram.com/${profile.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="profile-instagram"
            >
              <Instagram size={14} />
              <span>@{profile.instagram}</span>
            </a>
          )}
          <div className="profile-stats">
            <div className="profile-stat">
              <ChefHat size={16} />
              <span>{t('profile.dinnersHosted', { count: hostedDinners.length })}</span>
            </div>
          </div>
        </div>

        {isOwnProfile && !editing && (
          <button className="btn btn-outline profile-edit-btn" onClick={() => setEditing(true)}>
            <Edit3 size={16} /> {t('profile.edit')}
          </button>
        )}
      </div>

      <div className="profile-body">
        {editing ? (
          <div className="profile-edit-form">
            <div className="form-group">
              <label className="form-label">{t('profile.about')}</label>
              <textarea
                className="form-textarea"
                placeholder={t('profile.aboutPlaceholder')}
                value={form.bio}
                onChange={(e) => setForm(prev => ({ ...prev, bio: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{t('profile.country')}</label>
                <select
                  className="form-select"
                  value={form.country}
                  onChange={(e) => setForm(prev => ({ ...prev, country: e.target.value }))}
                >
                  {COUNTRY_CODES.map(code => (
                    <option key={code} value={code}>{t(`countries.${code}`)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{t('profile.postalCode')} <span className="required">*</span></label>
                <input
                  className="form-input"
                  type="text"
                  placeholder={t('profile.postalCodePlaceholder')}
                  value={form.postalCode}
                  onChange={(e) => setForm(prev => ({ ...prev, postalCode: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('profile.city')} <span className="required">*</span></label>
                <input
                  className="form-input"
                  type="text"
                  placeholder={t('profile.cityPlaceholder')}
                  value={form.city}
                  onChange={(e) => setForm(prev => ({ ...prev, city: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{t('profile.street')}</label>
              <input
                className="form-input"
                type="text"
                placeholder={t('profile.streetPlaceholder')}
                value={form.street}
                onChange={(e) => setForm(prev => ({ ...prev, street: e.target.value }))}
              />
              <small className="form-hint">{t('profile.addressPrivacyHint')}</small>
              {legacyAddress && !form.city && !form.postalCode && (
                <small className="form-hint" style={{ display: 'block', marginTop: 6, color: 'var(--color-text-light)' }}>
                  {t('profile.legacyAddressNotice')}
                </small>
              )}
            </div>
            <div className="form-group">
              <label className="form-label"><Instagram size={14} /> {t('profile.instagram')}</label>
              <div className="instagram-input-wrapper">
                <span className="instagram-input-prefix">@</span>
                <input
                  className="form-input instagram-input"
                  placeholder="your_username"
                  value={form.instagram}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^a-zA-Z0-9._]/g, '')
                    setForm(prev => ({ ...prev, instagram: val }))
                  }}
                />
              </div>
              <small className="form-hint">{t('profile.instagramHint')}</small>
            </div>
            <div className="form-group">
              <label className="form-label">{t('profile.allergies')}</label>
              <input
                className="form-input"
                placeholder={t('profile.allergiesPlaceholder')}
                value={form.allergies}
                onChange={(e) => setForm(prev => ({ ...prev, allergies: e.target.value }))}
              />
              <small className="form-hint">{t('profile.commaSeparated')}</small>
            </div>
            <div className="form-group">
              <label className="form-label">{t('profile.cuisinePrefs')}</label>
              <input
                className="form-input"
                placeholder={t('profile.cuisinePrefsPlaceholder')}
                value={form.cuisinePreferences}
                onChange={(e) => setForm(prev => ({ ...prev, cuisinePreferences: e.target.value }))}
              />
              <small className="form-hint">{t('profile.commaSeparated')}</small>
            </div>
            <div className="profile-edit-actions">
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                <Save size={16} /> {saving ? t('common.saving') : t('common.save')}
              </button>
              <button className="btn btn-outline" onClick={() => setEditing(false)}>
                <X size={16} /> {t('common.cancel')}
              </button>
            </div>
          </div>
        ) : (
          <>
            {profile?.bio && (
              <div className="profile-section">
                <h3>{t('profile.about')}</h3>
                <p>{profile.bio}</p>
              </div>
            )}

            {profile?.allergies?.length > 0 && (
              <div className="profile-section">
                <h3>{t('profile.allergies')}</h3>
                <div className="profile-tags">
                  {profile.allergies.map((a, i) => (
                    <span key={i} className="profile-tag allergy-tag">{a}</span>
                  ))}
                </div>
              </div>
            )}

            {profile?.cuisinePreferences?.length > 0 && (
              <div className="profile-section">
                <h3>{t('profile.cuisinePrefs')}</h3>
                <div className="profile-tags">
                  {profile.cuisinePreferences.map((c, i) => (
                    <span key={i} className="profile-tag cuisine-tag">{c}</span>
                  ))}
                </div>
              </div>
            )}

            {!profile?.bio && !profile?.allergies?.length && !profile?.cuisinePreferences?.length && isOwnProfile && (
              <div className="profile-empty">
                <p>{t('profile.empty')}</p>
              </div>
            )}
          </>
        )}

        {hostedDinners.length > 0 && (
          <div className="profile-section">
            <h3><ChefHat size={18} /> {t('profile.hostedDinners')}</h3>
            <div className="profile-dinners-list">
              {hostedDinners.map(d => (
                <Link key={d.id} to={`/dinner/${d.id}`} className="profile-dinner-item">
                  <div className="profile-dinner-info">
                    <strong>{d.title}</strong>
                    <span className="profile-dinner-meta">
                      <Calendar size={12} /> {d.date} · <MapPin size={12} /> {d.location}
                    </span>
                  </div>
                  <span className="profile-dinner-cuisine">{d.cuisine}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
        {isOwnProfile && (
          <div className="profile-danger-zone">
            <h3><AlertTriangle size={16} /> {t('profile.dangerZone')}</h3>
            {!showDeleteConfirm ? (
              <button className="btn btn-danger" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 size={16} /> {t('profile.deleteAccount')}
              </button>
            ) : (
              <div className="profile-delete-confirm">
                <p>{t('profile.deleteConfirm')}</p>
                <div className="form-actions">
                  <button className="btn btn-danger" onClick={handleDeleteAccount} disabled={deleting}>
                    {deleting ? t('profile.deleting') : t('profile.deleteFinal')}
                  </button>
                  <button className="btn btn-outline" onClick={() => setShowDeleteConfirm(false)}>{t('common.cancel')}</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
