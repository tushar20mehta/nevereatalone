import { createContext, useContext, useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  browserLocalPersistence,
  setPersistence
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, googleProvider, db } from '../firebase'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profilePhoto, setProfilePhoto] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch(() => {})

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
          setProfilePhoto(userDoc.exists() ? (userDoc.data().photoURL || null) : null)
        } catch {
          setProfilePhoto(null)
        }
      } else {
        setProfilePhoto(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const updateProfilePhoto = (url) => {
    setProfilePhoto(url || null)
  }

  const loginWithGoogle = async () => {
    try {
      await setPersistence(auth, browserLocalPersistence)
      await signInWithPopup(auth, googleProvider)
      return { success: true }
    } catch (error) {
      console.error('Login fehlgeschlagen:', error)
      if (
        error.code === 'auth/popup-blocked' ||
        error.code === 'auth/popup-closed-by-user' ||
        error.code === 'auth/cancelled-popup-request'
      ) {
        return { success: false, reason: 'popup-blocked' }
      }
      return { success: false, reason: 'unknown' }
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Logout fehlgeschlagen:', error)
    }
  }

  const value = { user, profilePhoto, updateProfilePhoto, loading, loginWithGoogle, logout }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
