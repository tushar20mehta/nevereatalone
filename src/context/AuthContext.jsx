import { createContext, useContext, useState, useEffect } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
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
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
        if (userDoc.exists() && userDoc.data().photoURL) {
          setProfilePhoto(userDoc.data().photoURL)
        } else {
          setProfilePhoto(currentUser.photoURL || null)
        }
      } else {
        setProfilePhoto(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const updateProfilePhoto = async (url) => {
    if (!user) return
    await setDoc(doc(db, 'users', user.uid), { photoURL: url }, { merge: true })
    setProfilePhoto(url)
  }

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (error) {
      console.error('Login fehlgeschlagen:', error)
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Logout fehlgeschlagen:', error)
    }
  }

  const value = {
    user,
    profilePhoto,
    updateProfilePhoto,
    loading,
    loginWithGoogle,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
