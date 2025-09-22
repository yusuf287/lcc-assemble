// Jest setup file
import '@testing-library/jest-dom'

// Mock AuthContext
jest.mock('../src/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: { uid: 'test-user', email: 'test@example.com' },
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    resetPassword: jest.fn(),
    updateProfile: jest.fn()
  }),
  AuthContext: {
    Provider: ({ children, value }: { children: React.ReactNode, value: any }) => children,
    Consumer: ({ children }: { children: (value: any) => React.ReactNode }) => children(null)
  }
}))

// Mock Firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
}))

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  updateProfile: jest.fn(),
  sendEmailVerification: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}))

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  getDocs: jest.fn(),
  onSnapshot: jest.fn(),
  Timestamp: {
    fromDate: jest.fn((date) => ({ toDate: () => date })),
    now: jest.fn(() => ({ toDate: () => new Date() })),
  },
}))

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(),
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
  deleteObject: jest.fn(),
}))

// Mock the local firebase service
jest.mock('../src/services/firebase', () => ({
  db: {},
  storage: {},
  auth: {},
}))

// Mock AuthContext
jest.mock('../src/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: { uid: 'test-user', email: 'test@example.com' },
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    resetPassword: jest.fn(),
    updateProfile: jest.fn()
  })
}))

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
  Toaster: () => null,
}))

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => children,
  Routes: ({ children }: { children: React.ReactNode }) => children,
  Route: () => null,
  Navigate: () => null,
  useNavigate: jest.fn(() => jest.fn()),
  useParams: jest.fn(() => ({})),
  useLocation: jest.fn(() => ({ pathname: '/' })),
}))

// Global test utilities
global.console = {
  ...console,
  // Uncomment to ignore console logs during tests
  // log: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
}

// Mock import.meta for Vite environment variables
Object.defineProperty(global, 'import', {
  value: {
    meta: {
      env: {
        DEV: true,
        VITE_SKIP_EMAIL_VERIFICATION: 'true'
      }
    }
  }
})