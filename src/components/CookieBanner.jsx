import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function CookieBanner() {
  const { t } = useTranslation()
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
          {t('cookie.text')}{' '}
          <Link to="/datenschutz" className="cookie-banner-link">{t('cookie.privacyLink')}</Link>.
        </p>
        <div className="cookie-banner-buttons">
          <button className="btn btn-primary cookie-btn" onClick={() => handleConsent('all')}>
            {t('cookie.accept')}
          </button>
          <button className="btn cookie-btn cookie-btn-secondary" onClick={() => handleConsent('essential')}>
            {t('cookie.essential')}
          </button>
        </div>
      </div>
    </div>
  )
}
