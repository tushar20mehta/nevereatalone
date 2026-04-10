import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'

const firebaseConfig = {
  apiKey: "AIzaSyDNiByycQvorgGnZmj6C0oWFTCF6Dkqi9E",
  authDomain: "nevereatalone-2.firebaseapp.com",
  projectId: "nevereatalone-2",
  storageBucket: "nevereatalone-2.firebasestorage.app",
  messagingSenderId: "245339629017",
  appId: "1:245339629017:web:1052dadbd461cfd91c65c8",
  measurementId: "G-0NK2Z23EVZ"
}

const app = initializeApp(firebaseConfig)

// Firebase App Check with reCAPTCHA v3.
// Setup steps (one-time):
//   1. Get a reCAPTCHA v3 site key: https://www.google.com/recaptcha/admin
//   2. Register the site key in Firebase Console → App Check → Web app.
//   3. Put the site key in a local `.env` file as VITE_RECAPTCHA_SITE_KEY=...
// If the env variable is missing we skip App Check so local dev keeps working.
const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY
if (recaptchaSiteKey) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true
    })
  } catch (err) {
    console.warn('App Check init failed:', err)
  }
}

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)
export const storage = getStorage(app)

export default app
