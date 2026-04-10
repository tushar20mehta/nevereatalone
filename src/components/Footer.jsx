import { NavLink } from 'react-router-dom'
import { UtensilsCrossed } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-logo">
          <UtensilsCrossed size={20} style={{ color: 'var(--color-primary)' }} />
          Never Eat Alone
        </div>
        <div className="footer-links">
          <NavLink to="/" className="footer-link">{t('footer.discover')}</NavLink>
          <NavLink to="/create" className="footer-link">{t('footer.host')}</NavLink>
          <NavLink to="/my-dinners" className="footer-link">{t('footer.myDinners')}</NavLink>
          <NavLink to="/impressum" className="footer-link">{t('footer.imprint')}</NavLink>
          <NavLink to="/datenschutz" className="footer-link">{t('footer.privacy')}</NavLink>
        </div>
        <span className="footer-copy">&copy; {new Date().getFullYear()} Never Eat Alone</span>
      </div>
    </footer>
  )
}
