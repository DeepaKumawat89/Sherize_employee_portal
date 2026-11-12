import { initializeApp } from 'firebase/app'
import {
  browserLocalPersistence,
  connectAuthEmulator,
  indexedDBLocalPersistence,
  initializeAuth,
} from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'
import { connectStorageEmulator, getStorage } from 'firebase/storage'
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

const requiredConfig = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]

const missingConfig = requiredConfig.filter((key) => !import.meta.env[key])

if (missingConfig.length) {
  throw new Error(`Missing Firebase configuration: ${missingConfig.join(', ')}`)
}

// Emulator services are development-only. Production always uses the existing
// deployed Sherize Firebase services and Cloud Functions.
const useEmulator = import.meta.env.DEV && import.meta.env.VITE_USE_EMULATOR === 'true'

const app = initializeApp(firebaseConfig)

// Match the existing portals: prefer IndexedDB persistence and fall back to
// localStorage so authenticated sessions survive reloads.
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence],
})

export const db = getFirestore(app)
export const storage = getStorage(app)
export const functions = getFunctions(
  app,
  import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || 'us-central1',
)

if (useEmulator) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  connectStorageEmulator(storage, '127.0.0.1', 9199)
  connectFunctionsEmulator(functions, '127.0.0.1', 5001)
}

export default app
