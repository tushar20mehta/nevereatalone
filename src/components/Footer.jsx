import { NavLink } from 'react-router-dom'
import { UtensilsCrossed } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-logo">
          <UtensilsCrossed size={20} style={{ color: 'var(--color-primary)' }} />
          Never Eat Alone
        </div>
        <div className="footer-links">
          <NavLink to="/" className="footer-link">Entdecken</NavLink>
          <NavLink to="/create" className="footer-link">Hosten</NavLink>
          <NavLink to="/my-dinners" className="footer-link">Meine Dinner</NavLink>
        </div>
        <span className="footer-copy">&copy; {new Date().getFullYear()} Never Eat Alone</span>
      </div>
    </footer>
  )
}
