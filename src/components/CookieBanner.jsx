import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent')
    if (!consent) setVisible(true)
  }, [])

  const handleConsent = (value) => {
    localStorage.setItem('cookieConsent', value)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="cookie-banner">
      <div className="cookie-banner-inner">
        <p className="cookie-banner-text">
          Diese Website verwendet Cookies, die für den Betrieb der Seite notwendig sind (z.B. Authentifizierung).
          Weitere Informationen findest du in unserer{' '}
          <Link to="/datenschutz" className="cookie-banner-link">Datenschutzerklärung</Link>.
        </p>
        <div className="cookie-banner-buttons">
          <button className="btn btn-primary cookie-btn" onClick={() => handleConsent('all')}>
            Akzeptieren
          </button>
          <button className="btn cookie-btn cookie-btn-secondary" onClick={() => handleConsent('essential')}>
            Nur essenzielle Cookies
          </button>
        </div>
      </div>
    </div>
  )
}
