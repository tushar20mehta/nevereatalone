import { NavLink, useLocation } from 'react-router-dom'
import { UtensilsCrossed, Menu, X, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import LoginModal from './LoginModal'

export default function Navbar() {
  const { user, logout } = useAuth()
  const [showLogin, setShowLogin] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  // Menü schließen bei Seitenwechsel
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <NavLink to="/" className="navbar-logo">
            <div className="navbar-logo-icon">
              <UtensilsCrossed size={22} />
            </div>
            Never Eat Alone
          </NavLink>

          <div className="navbar-links">
            <NavLink
              to="/"
              className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
            >
              Entdecken
            </NavLink>
            <NavLink
              to="/create"
              className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
            >
              Hosten
            </NavLink>
            <NavLink
              to="/my-dinners"
              className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
            >
              Meine Dinner
            </NavLink>
          </div>

          <div className="navbar-right">
            <div className="navbar-auth">
              {user ? (
                <div className="user-menu-wrapper">
                  <div className="user-menu">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="" className="user-avatar" />
                    ) : (
                      <div className="user-avatar" style={{
                        background: 'var(--color-primary-bg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-primary)',
                        fontWeight: 600,
                        fontSize: '0.85rem'
                      }}>
                        {user.displayName?.[0] || user.email?.[0] || '?'}
                      </div>
                    )}
                    <span className="user-name">{user.displayName || 'Benutzer'}</span>
                  </div>
                  <button className="logout-btn" onClick={logout} title="Abmelden">
                    <LogOut size={16} />
                    <span>Abmelden</span>
                  </button>
                </div>
              ) : (
                <button className="btn btn-primary" onClick={() => setShowLogin(true)}>
                  Anmelden
                </button>
              )}
            </div>

            <button
              className="hamburger-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menü öffnen"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobiles Dropdown-Menü */}
        {menuOpen && (
          <div className="mobile-menu">
            <NavLink
              to="/"
              className={({ isActive }) => `mobile-menu-link ${isActive ? 'active' : ''}`}
            >
              Entdecken
            </NavLink>
            <NavLink
              to="/create"
              className={({ isActive }) => `mobile-menu-link ${isActive ? 'active' : ''}`}
            >
              Hosten
            </NavLink>
            <NavLink
              to="/my-dinners"
              className={({ isActive }) => `mobile-menu-link ${isActive ? 'active' : ''}`}
            >
              Meine Dinner
            </NavLink>
            {user && (
              <button className="mobile-menu-link mobile-logout-btn" onClick={logout}>
                <LogOut size={16} />
                Abmelden
              </button>
            )}
          </div>
        )}
      </nav>

      {/* Overlay zum Schließen */}
      {menuOpen && <div className="mobile-menu-overlay" onClick={() => setMenuOpen(false)} />}

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  )
}
