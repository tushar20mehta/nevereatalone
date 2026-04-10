import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { UtensilsCrossed, LogOut, Compass, Utensils, Globe } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import LoginModal from './LoginModal'

export default function Navbar() {
  const { t, i18n } = useTranslation()
  const { user, profilePhoto, logout } = useAuth()
  const [showLogin, setShowLogin] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const menuRef = useRef(null)
  const langRef = useRef(null)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
    localStorage.setItem('language', lng)
    setLangOpen(false)
  }

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="navbar-logo-wrapper" ref={menuRef}>
            <button
              className="navbar-logo"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={t('navbar.openMenu')}
            >
              <div className="navbar-logo-icon">
                <UtensilsCrossed size={22} />
              </div>
              <span className="navbar-logo-text">Never Eat Alone</span>
            </button>
            {menuOpen && (
              <div className="logo-dropdown">
                <NavLink to="/" className={({ isActive }) => `logo-dropdown-link ${isActive ? 'active' : ''}`}>
                  {t('navbar.discover')}
                </NavLink>
                <NavLink to="/create" className={({ isActive }) => `logo-dropdown-link ${isActive ? 'active' : ''}`}>
                  {t('navbar.host')}
                </NavLink>
                <NavLink to="/my-dinners" className={({ isActive }) => `logo-dropdown-link ${isActive ? 'active' : ''}`}>
                  {t('navbar.myDinners')}
                </NavLink>
                <NavLink to="/stöbern" className={({ isActive }) => `logo-dropdown-link ${isActive ? 'active' : ''}`}>
                  <Compass size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  {t('navbar.browse')}
                </NavLink>
                <NavLink to="/running-dinner" className={({ isActive }) => `logo-dropdown-link ${isActive ? 'active' : ''}`}>
                  <Utensils size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  {t('navbar.runningDinner')}
                </NavLink>
                {user && (
                  <NavLink to="/profile" className={({ isActive }) => `logo-dropdown-link ${isActive ? 'active' : ''}`}>
                    {t('navbar.myProfile')}
                  </NavLink>
                )}
              </div>
            )}
          </div>

          <div className="navbar-links">
            <NavLink to="/" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
              {t('navbar.discover')}
            </NavLink>
            <NavLink to="/create" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
              {t('navbar.host')}
            </NavLink>
            <NavLink to="/my-dinners" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
              {t('navbar.myDinners')}
            </NavLink>
          </div>

          <div className="navbar-right">
            <div className="language-switcher" ref={langRef}>
              <button
                className="language-btn"
                onClick={() => setLangOpen(!langOpen)}
                aria-label={t('navbar.language')}
                title={t('navbar.language')}
              >
                <Globe size={18} />
                <span className="language-code">{i18n.language?.startsWith('en') ? 'EN' : 'DE'}</span>
              </button>
              {langOpen && (
                <div className="language-dropdown">
                  <button
                    className={`language-option ${i18n.language?.startsWith('de') ? 'active' : ''}`}
                    onClick={() => changeLanguage('de')}
                  >
                    Deutsch
                  </button>
                  <button
                    className={`language-option ${i18n.language?.startsWith('en') ? 'active' : ''}`}
                    onClick={() => changeLanguage('en')}
                  >
                    English
                  </button>
                </div>
              )}
            </div>
            <div className="navbar-auth">
              {user ? (
                <>
                  <div className="user-menu user-menu-clickable" onClick={() => navigate('/profile')} title={t('navbar.myProfile')}>
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
                    <span className="user-name">{user.displayName || t('common.user')}</span>
                  </div>
                  <button className="btn-logout" onClick={logout}>
                    <LogOut size={16} />
                    <span className="logout-text">{t('common.logout')}</span>
                  </button>
                </>
              ) : (
                <button className="btn btn-primary" onClick={() => setShowLogin(true)}>
                  {t('common.login')}
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
