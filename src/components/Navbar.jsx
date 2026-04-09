import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { UtensilsCrossed, LogOut, Compass, Utensils } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect, useRef } from 'react'
import LoginModal from './LoginModal'

export default function Navbar() {
  const { user, profilePhoto, logout } = useAuth()
  const [showLogin, setShowLogin] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const menuRef = useRef(null)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

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
              <span className="navbar-logo-text">Never Eat Alone</span>
            </button>
            {menuOpen && (
              <div className="logo-dropdown">
                <NavLink to="/" className={({ isActive }) => `logo-dropdown-link ${isActive ? 'active' : ''}`}>
                  Entdecken
                </NavLink>
                <NavLink to="/create" className={({ isActive }) => `logo-dropdown-link ${isActive ? 'active' : ''}`}>
                  Hosten
                </NavLink>
                <NavLink to="/my-dinners" className={({ isActive }) => `logo-dropdown-link ${isActive ? 'active' : ''}`}>
                  Meine Dinner
                </NavLink>
                <NavLink to="/stöbern" className={({ isActive }) => `logo-dropdown-link ${isActive ? 'active' : ''}`}>
                  <Compass size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  Stöbern
                </NavLink>
                <NavLink to="/running-dinner" className={({ isActive }) => `logo-dropdown-link ${isActive ? 'active' : ''}`}>
                  <Utensils size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  Running Dinner
                </NavLink>
                {user && (
                  <NavLink to="/profile" className={({ isActive }) => `logo-dropdown-link ${isActive ? 'active' : ''}`}>
                    Mein Profil
                  </NavLink>
                )}
              </div>
            )}
          </div>

          <div className="navbar-links">
            <NavLink to="/" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
              Entdecken
            </NavLink>
            <NavLink to="/create" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
              Hosten
            </NavLink>
            <NavLink to="/my-dinners" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
              Meine Dinner
            </NavLink>
          </div>

          <div className="navbar-right">
            <div className="navbar-auth">
              {user ? (
                <>
                  <div className="user-menu user-menu-clickable" onClick={() => navigate('/profile')} title="Mein Profil">
                    {profilePhoto ? (
                      <img src={profilePhoto} alt="" className="user-avatar" />
                    ) : (
                      <div className="user-avatar" style={{
                        background: 'var(--color-primary-bg)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.85rem'
                      }}>
                        {user.displayName?.[0] || user.email?.[0] || '?'}
                      </div>
                    )}
                    <span className="user-name">{user.displayName || 'Benutzer'}</span>
                  </div>
                  <button className="btn-logout" onClick={logout}>
                    <LogOut size={16} />
                    <span className="logout-text">Abmelden</span>
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
      {menuOpen && <div className="mobile-menu-overlay" onClick={() => setMenuOpen(false)} />}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  )
}
