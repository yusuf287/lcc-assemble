import { initializeApp, getApps } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Validate configuration
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
]

const missingEnvVars = requiredEnvVars.filter(envVar => !import.meta.env[envVar])

if (missingEnvVars.length > 0) {
  console.error('Missing Firebase environment variables:', missingEnvVars)
  throw new Error(`Missing Firebase configuration: ${missingEnvVars.join(', ')}`)
}

// Initialize Firebase with proper duplicate app handling
let app

// Check if app already exists BEFORE trying to initialize
const existingApps = getApps()
if (existingApps.length > 0) {
  // Use existing app
  app = existingApps[0]
  console.log('🔥 Using existing Firebase app instance')
} else {
  // No existing app, safe to initialize
  app = initializeApp(firebaseConfig)
  console.log('🔥 Created new Firebase app instance')
}

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Connect to emulators in development
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  try {
    // Auth emulator
    if (!auth.app.options.projectId?.includes('demo-')) {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
    }

    // Firestore emulator
    connectFirestoreEmulator(db, 'localhost', 8080)

    // Storage emulator
    connectStorageEmulator(storage, 'localhost', 9199)

    console.log('🔥 Connected to Firebase emulators')
  } catch (error) {
    console.error('Error connecting to Firebase emulators:', error)
  }
}

// Export the app instance
export default app

// Firebase service status
export const firebaseServices = {
  auth: {
    initialized: true,
    emulator: import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true'
  },
  firestore: {
    initialized: true,
    emulator: import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true'
  },
  storage: {
    initialized: true,
    emulator: import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true'
  }
}

// Health check function
export const checkFirebaseHealth = async (): Promise<{
  auth: boolean
  firestore: boolean
  storage: boolean
  overall: boolean
}> => {
  const results = {
    auth: false,
    firestore: false,
    storage: false,
    overall: false
  }

  try {
    // Check Auth
    results.auth = !!auth.app

    // Check Firestore
    const { getDoc, doc } = await import('firebase/firestore')
    // Try to get a non-existent document to test connection
    try {
      await getDoc(doc(db, '_health_check_', 'test'))
      results.firestore = true
    } catch (error: any) {
      // If we get a permission error, Firestore is connected
      if (error?.code === 'permission-denied') {
        results.firestore = true
      }
    }

    // Check Storage
    const { ref, getDownloadURL } = await import('firebase/storage')
    try {
      // Try to get a reference (doesn't check actual file existence)
      const testRef = ref(storage, '_health_check_/test.txt')
      results.storage = !!testRef
    } catch (error) {
      console.error('Storage health check failed:', error)
    }

    results.overall = results.auth && results.firestore && results.storage

  } catch (error) {
    console.error('Firebase health check failed:', error)
  }

  return results
}

// Error handling utilities
export const handleFirebaseError = (error: any): string => {
  if (!error) return 'Unknown error occurred'

  // Firebase Auth errors
  if (error.code?.startsWith('auth/')) {
    switch (error.code) {
      case 'auth/user-not-found':
        return 'No account found with this email address'
      case 'auth/wrong-password':
        return 'Incorrect password'
      case 'auth/email-already-in-use':
        return 'An account with this email already exists'
      case 'auth/weak-password':
        return 'Password should be at least 6 characters'
      case 'auth/invalid-email':
        return 'Please enter a valid email address'
      case 'auth/user-disabled':
        return 'This account has been disabled'
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later'
      default:
        return 'Authentication error occurred'
    }
  }

  // Firestore errors
  if (error.code?.startsWith('firestore/') || error.code?.startsWith('permission-denied')) {
    switch (error.code) {
      case 'permission-denied':
        return 'You do not have permission to perform this action'
      case 'firestore/not-found':
        return 'The requested data was not found'
      case 'firestore/already-exists':
        return 'This data already exists'
      case 'firestore/resource-exhausted':
        return 'Service temporarily unavailable. Please try again later'
      default:
        return 'Database error occurred'
    }
  }

  // Storage errors
  if (error.code?.startsWith('storage/')) {
    switch (error.code) {
      case 'storage/unauthorized':
        return 'You do not have permission to upload files'
      case 'storage/canceled':
        return 'Upload was cancelled'
      case 'storage/quota-exceeded':
        return 'Storage quota exceeded'
      case 'storage/invalid-format':
        return 'Invalid file format'
      case 'storage/object-not-found':
        return 'File not found'
      default:
        return 'File upload error occurred'
    }
  }

  // Network errors
  if (error.code === 'unavailable' || error.message?.includes('network')) {
    return 'Network connection error. Please check your internet connection'
  }

  // Generic error
  return error.message || 'An unexpected error occurred'
}

// Re-export commonly used Firebase functions for convenience
export {
  // Auth
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  deleteUser
} from 'firebase/auth'

export {
  // Firestore
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  writeBatch
} from 'firebase/firestore'

export {
  // Storage
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll
} from 'firebase/storage'