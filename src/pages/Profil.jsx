import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { Camera, LogOut, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { storage } from '../firebase'

export default function Profil() {
  const { user, profilePhoto, updateProfilePhoto, logout } = useAuth()
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const navigate = useNavigate()

  if (!user) {
    return (
      <div className="profile-page">
        <p>Bitte melde dich an, um dein Profil zu sehen.</p>
      </div>
    )
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Bitte wähle eine Bilddatei aus.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Das Bild darf maximal 5 MB groß sein.')
      return
    }

    setUploading(true)
    try {
      const storageRef = ref(storage, `profilePhotos/${user.uid}`)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      await updateProfilePhoto(url)
    } catch (error) {
      console.error('Upload fehlgeschlagen:', error)
      alert('Profilbild konnte nicht hochgeladen werden.')
    } finally {
      setUploading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const initials = user.displayName?.[0] || user.email?.[0] || '?'

  return (
    <div className="profile-page">
      <button className="profile-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} />
        Zurück
      </button>

      <div className="profile-card">
        <div
          className="profile-avatar-wrapper"
          onClick={() => fileInputRef.current?.click()}
        >
          {profilePhoto ? (
            <img src={profilePhoto} alt="Profilbild" className="profile-avatar" />
          ) : (
            <div className="profile-avatar profile-avatar-initials">
              {initials}
            </div>
          )}
          <div className="profile-avatar-overlay">
            {uploading ? (
              <div className="profile-spinner" />
            ) : (
              <Camera size={24} />
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            hidden
          />
        </div>

        <h2 className="profile-name">{user.displayName || 'Benutzer'}</h2>
        <p className="profile-email">{user.email}</p>

        <button className="btn btn-outline profile-logout" onClick={handleLogout}>
          <LogOut size={16} />
          Abmelden
        </button>
      </div>
    </div>
  )
}
