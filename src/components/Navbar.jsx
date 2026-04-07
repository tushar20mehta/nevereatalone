import { NavLink, useLocation } from 'react-router-dom'
import { UtensilsCrossed, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect, useRef } from 'react'
import LoginModal from './LoginModal'

export default function Navbar() {
  const { user, logout } = useAuth()
  const [showLogin, setShowLogin] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const menuRef = useRef(null)

  // Menü schließen bei Seitenwechsel
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  // Menü schließen bei Klick außerhalb
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="navbar-logo-wrapper" ref={menuRef}>
            <button
              className="navbar-logo"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menü öffnen"
            >
              <div className="navbar-logo-icon">
                <UtensilsCrossed size={22} />
              </div>
              Never Eat Alone
            </button>

            {menuOpen && (
              <div className="logo-dropdown">
                <NavLink
                  to="/"
                  className={({ isActive }) => `logo-dropdown-link ${isActive ? 'active' : ''}`}
                >
                  Entdecken
                </NavLink>
                <NavLink
                  to="/create"
                  className={({ isActive }) => `logo-dropdown-link ${isActive ? 'active' : ''}`}
                >
                  Hosten
                </NavLink>
                <NavLink
                  to="/my-dinners"
                  className={({ isActive }) => `logo-dropdown-link ${isActive ? 'active' : ''}`}
                >
                  Meine Dinner
                </NavLink>
              </div>
            )}
          </div>

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
                <>
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
                  <button className="btn-logout" onClick={logout}>
                    <LogOut size={16} />
                    Abmelden
                  </button>
                </>
              ) : (
                <button className="btn btn-primary" onClick={() => setShowLogin(true)}>
                  Anmelden
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Overlay zum Schließen */}
      {menuOpen && <div className="mobile-menu-overlay" onClick={() => setMenuOpen(false)} />}

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  )
}
