import { useState } from 'react'
import { Link } from 'react-router-dom'
import { UtensilsCrossed } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function LoginModal({ onClose }) {
  const { t } = useTranslation()
  const { loginWithGoogle } = useAuth()
  const { showToast } = useToast()
  const [accepted, setAccepted] = useState(false)

  const handleLogin = async () => {
    const result = await loginWithGoogle()
    if (result?.success) {
      onClose()
    } else if (result?.reason === 'popup-blocked') {
      showToast(t('login.popupBlocked'), 'error')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div style={{width:56,height:56,background:'var(--color-primary-bg)',borderRadius:'var(--radius-md)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--color-primary)',margin:'0 auto 16px'}}>
          <UtensilsCrossed size={28} />
        </div>
        <h2>{t('login.welcome')}</h2>
        <p>{t('login.subtitle')}</p>
        <label className="login-privacy-checkbox">
          <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
          <span>
            {t('login.privacyAccept')} <Link to="/datenschutz" onClick={onClose} className="login-privacy-link">{t('login.privacyLink')}</Link>{t('login.privacyEnd')}
          </span>
        </label>
        <button className="btn btn-google" onClick={handleLogin} disabled={!accepted}>
          <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          {t('login.googleLogin')}
        </button>
        <button className="modal-close" onClick={onClose}>{t('common.cancel')}</button>
      </div>
    </div>
  )
}
