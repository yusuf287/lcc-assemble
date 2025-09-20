import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '../services/firebase'
import { User as AppUser } from '../types'

interface AuthContextType {
  user: AppUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateProfile: (updates: Partial<AppUser>) => Promise<void>
  // Legacy aliases for backward compatibility
  signIn?: (email: string, password: string) => Promise<void>
  isLoading?: boolean
  error?: string | null
  clearError?: () => void
  userProfile?: AppUser | null
  updateUserProfile?: (updates: Partial<AppUser>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Convert Firebase User to App User
  const convertFirebaseUser = async (firebaseUser: User): Promise<AppUser> => {
    const userDocRef = doc(db, 'users', firebaseUser.uid)
    const userDoc = await getDoc(userDocRef)

    if (userDoc.exists()) {
      const userData = userDoc.data() as Omit<AppUser, 'uid'>
      return {
        uid: firebaseUser.uid,
        ...userData
      }
    } else {
      // Create basic profile for new user
      const basicProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        interests: [],
        dietaryPreferences: [],
        privacy: {
          phoneVisible: false,
          whatsappVisible: false,
          addressVisible: false
        },
        role: 'member' as const,
        status: 'pending' as const,
        defaultAvailability: {
          weekdays: false,
          evenings: false,
          weekends: false
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await setDoc(userDocRef, basicProfile)
      return basicProfile
    }
  }

  // Listen to authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const appUser = await convertFirebaseUser(firebaseUser)
          setUser(appUser)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Error in auth state change:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    try {
      setError(null)
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error: any) {
      console.error('Login error:', error)
      const errorMessage = error.message || 'Login failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  // Register function
  const register = async (email: string, password: string, displayName: string): Promise<void> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)

      // Update Firebase Auth profile
      await updateProfile(userCredential.user, {
        displayName: displayName
      })

      // Create user profile in Firestore
      const userDocRef = doc(db, 'users', userCredential.user.uid)
      await setDoc(userDocRef, {
        uid: userCredential.user.uid,
        email,
        displayName,
        interests: [],
        dietaryPreferences: [],
        privacy: {
          phoneVisible: false,
          whatsappVisible: false,
          addressVisible: false
        },
        role: 'member',
        status: 'pending',
        defaultAvailability: {
          weekdays: false,
          evenings: false,
          weekends: false
        },
        createdAt: new Date(),
        updatedAt: new Date()
      })
    } catch (error: any) {
      console.error('Registration error:', error)
      throw new Error(error.message || 'Registration failed')
    }
  }

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await signOut(auth)
    } catch (error: any) {
      console.error('Logout error:', error)
      throw new Error(error.message || 'Logout failed')
    }
  }

  // Reset password function
  const resetPassword = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error: any) {
      console.error('Password reset error:', error)
      throw new Error(error.message || 'Password reset failed')
    }
  }

  // Update profile function
  const updateUserProfile = async (updates: Partial<AppUser>): Promise<void> => {
    if (!user) {
      throw new Error('No user logged in')
    }

    try {
      const userDocRef = doc(db, 'users', user.uid)
      const updateData = {
        ...updates,
        updatedAt: new Date()
      }

      await updateDoc(userDocRef, updateData)

      // Update local state
      setUser(prev => prev ? { ...prev, ...updates } : null)
    } catch (error: any) {
      console.error('Profile update error:', error)
      throw new Error(error.message || 'Profile update failed')
    }
  }

  // Legacy methods for backward compatibility
  const signIn = login
  const isLoading = loading
  const clearError = () => setError(null)
  const userProfile = user
  const updateUserProfileLegacy = updateUserProfile

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    resetPassword,
    updateProfile: updateUserProfile,
    // Legacy aliases
    signIn,
    isLoading,
    error,
    clearError,
    userProfile,
    updateUserProfile: updateUserProfileLegacy
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}