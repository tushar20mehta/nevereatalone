import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

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
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)
export default app
