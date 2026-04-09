import { createContext, useContext, useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
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
    // Set persistence to LOCAL so users stay logged in
    setPersistence(auth, browserLocalPersistence).catch(() => {})

    // Handle redirect result (for when signInWithRedirect was used)
    getRedirectResult(auth).catch(() => {})

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
      // Set persistence before signing in
      await setPersistence(auth, browserLocalPersistence)
      await signInWithPopup(auth, googleProvider)
    } catch (error) {
      console.error('Login fehlgeschlagen:', error)
      // If popup was blocked (Safari/mobile), fall back to redirect
      if (
        error.code === 'auth/popup-blocked' ||
        error.code === 'auth/popup-closed-by-user' ||
        error.code === 'auth/cancelled-popup-request'
      ) {
        try {
          await signInWithRedirect(auth, googleProvider)
        } catch (redirectError) {
          console.error('Redirect Login fehlgeschlagen:', redirectError)
        }
      }
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
