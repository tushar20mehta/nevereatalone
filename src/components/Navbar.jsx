import { NavLink } from 'react-router-dom'
import { UtensilsCrossed } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'
import LoginModal from './LoginModal'

export default function Navbar() {
  const { user, logout } = useAuth()
  const [showLogin, setShowLogin] = useState(false)

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
            <NavLink to="/" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>Entdecken</NavLink>
            <NavLink to="/create" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>Hosten</NavLink>
            <NavLink to="/my-dinners" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>Meine Dinner</NavLink>
          </div>
          <div className="navbar-auth">
            {user ? (
              <div className="user-menu" onClick={logout}>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="user-avatar" />
                ) : (
                  <div className="user-avatar" style={{background:'var(--color-primary-bg)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--color-primary)',fontWeight:600,fontSize:'0.85rem'}}>
                    {user.displayName?.[0] || user.email?.[0] || '?'}
                  </div>
                )}
                <span className="user-name">{user.displayName || 'Benutzer'}</span>
              </div>
            ) : (
              <button className="btn btn-primary" onClick={() => setShowLogin(true)}>Anmelden</button>
            )}
          </div>
        </div>
      </nav>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  )
}
