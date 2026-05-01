'use client'

import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, Auth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let app: FirebaseApp | undefined
let auth: Auth | undefined

function getFirebaseApp() {
  if (!app) {
    app = initializeApp(firebaseConfig)
  }
  return app
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    const firebaseApp = getFirebaseApp()
    auth = getAuth(firebaseApp)
  }
  return auth
}

export async function signInWithGoogle(): Promise<{ user?: any; error?: string }> {
  try {
    const firebaseAuth = getFirebaseAuth()
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({
      prompt: 'select_account',
    })

    const result = await signInWithPopup(firebaseAuth, provider)
    const idToken = await result.user.getIdToken()

    return { user: { ...result.user, idToken } }
  } catch (error: any) {
    console.error('Firebase Google sign-in error:', error)
    return { error: error.message || 'Failed to sign in with Google' }
  }
}

export async function logOut(): Promise<void> {
  try {
    const firebaseAuth = getFirebaseAuth()
    await signOut(firebaseAuth)
  } catch (error) {
    console.error('Sign out error:', error)
  }
}

export { getFirebaseApp as app }