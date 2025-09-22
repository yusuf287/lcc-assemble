import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '../services/firebase'
import { User as AppUser } from '../types'

interface AuthContextType {
  user: AppUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string, profileData?: any) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateProfile: (updates: Partial<AppUser>) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  resendEmailVerification: () => Promise<void>
  checkEmailVerificationStatus: () => Promise<boolean>
  verifyEmailManually: (userId: string) => Promise<void>
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password)

      // DEVELOPMENT MODE: Skip email verification for testing
      if (import.meta.env.DEV && import.meta.env.VITE_SKIP_EMAIL_VERIFICATION === 'true') {
        console.log('🔧 DEVELOPMENT: Skipping email verification check')
      } else if (!userCredential.user.emailVerified) {
        await signOut(auth)
        throw new Error('Please verify your email before logging in. Check your inbox for the verification link.')
      }

      // Check user status
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid))
      if (userDoc.exists()) {
        const userData = userDoc.data() as AppUser
        if (userData.status === 'suspended') {
          await signOut(auth)
          throw new Error('Your account has been suspended. Please contact an administrator.')
        }
      }
    } catch (error: any) {
      console.error('Login error:', error)
      const errorMessage = error.code === 'auth/user-not-found'
        ? 'No account found with this email address. Please check your email or sign up for a new account.'
        : error.code === 'auth/wrong-password'
        ? 'Incorrect password. Please try again or reset your password.'
        : error.code === 'auth/invalid-credential'
        ? 'Invalid email or password. Please check your credentials and try again.'
        : error.code === 'auth/invalid-email'
        ? 'Please enter a valid email address.'
        : error.code === 'auth/user-disabled'
        ? 'This account has been disabled. Please contact an administrator.'
        : error.code === 'auth/too-many-requests'
        ? 'Too many failed login attempts. Please wait a few minutes before trying again.'
        : error.code === 'auth/network-request-failed'
        ? 'Network error. Please check your internet connection and try again.'
        : error.code === 'auth/operation-not-allowed'
        ? 'This sign-in method is not enabled. Please contact support.'
        : error.message || 'Login failed. Please try again.'

      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  // Register function
  const register = async (email: string, password: string, displayName: string, profileData?: any): Promise<void> => {
    try {
      setError(null)
      console.log('🔥 Starting registration process...')
      console.log('📧 Email:', email)
      console.log('👤 Display Name:', displayName)

      // Step 1: Create Firebase Auth user
      console.log('🔥 Creating Firebase Auth user...')
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      console.log('✅ Firebase Auth user created:', userCredential.user.uid)

      // Step 2: Update Firebase Auth profile
      console.log('🔥 Updating Firebase Auth profile...')
      await updateProfile(userCredential.user, {
        displayName: displayName
      })
      console.log('✅ Firebase Auth profile updated')

      // Step 3: Create comprehensive user profile in Firestore
      console.log('🔥 Creating Firestore user document...')
      const userDocRef = doc(db, 'users', userCredential.user.uid)
      const userData = {
        uid: userCredential.user.uid,
        email,
        displayName,
        phoneNumber: profileData?.phoneNumber || '',
        whatsappNumber: profileData?.whatsappNumber || '',
        bio: profileData?.bio || '',
        interests: profileData?.interests || [],
        dietaryPreferences: profileData?.dietaryPreferences || [],
        address: profileData?.address || {
          street: '',
          city: '',
          postalCode: ''
        },
        privacy: profileData?.privacy || {
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
      }

      console.log('🔥 User data to save:', userData)
      await setDoc(userDocRef, userData)
      console.log('✅ Firestore user document created')

      // Step 4: Send email verification
      console.log('🔥 Sending email verification...')
      try {
        await sendEmailVerification(userCredential.user)
        console.log('✅ Email verification sent successfully')
      } catch (emailError: any) {
        console.error('❌ Email verification failed:', emailError)
        console.error('❌ Email error code:', emailError.code)
        console.error('❌ Email error message:', emailError.message)

        // Don't fail registration if email verification fails
        // User can still verify later or use manual verification in development
        console.warn('⚠️ Registration completed but email verification failed. User may need to verify manually.')

        // In development, automatically mark email as verified for testing
        if (import.meta.env.DEV && import.meta.env.VITE_SKIP_EMAIL_VERIFICATION === 'true') {
          console.log('🔧 DEVELOPMENT: Auto-verifying email for testing')
          const userDocRef = doc(db, 'users', userCredential.user.uid)
          await updateDoc(userDocRef, {
            emailVerified: true,
            updatedAt: new Date()
          })
        }
      }

      console.log('🎉 Registration completed successfully!')

    } catch (error: any) {
      console.error('❌ Registration error:', error)
      console.error('❌ Error code:', error.code)
      console.error('❌ Error message:', error.message)

      const errorMessage = error.code === 'auth/email-already-in-use'
        ? 'This email is already registered. Please try logging in instead.'
        : error.code === 'auth/weak-password'
        ? 'Password is too weak. Please choose a stronger password (at least 6 characters).'
        : error.code === 'auth/invalid-email'
        ? 'Please enter a valid email address.'
        : error.code === 'auth/operation-not-allowed'
        ? 'Email/password registration is not enabled. Please contact support.'
        : error.code === 'auth/too-many-requests'
        ? 'Too many registration attempts. Please wait a few minutes before trying again.'
        : error.code === 'auth/network-request-failed'
        ? 'Network error. Please check your internet connection and try again.'
        : error.code === 'permission-denied'
        ? 'Registration is currently disabled. Please contact an administrator.'
        : error.code === 'unavailable'
        ? 'Service temporarily unavailable. Please try again later.'
        : error.message || 'Registration failed. Please try again.'

      setError(errorMessage)
      throw new Error(errorMessage)
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
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)

      const errorMessage = error.code === 'auth/user-not-found'
        ? 'No account found with this email address.'
        : error.code === 'auth/invalid-email'
        ? 'Please enter a valid email address.'
        : error.code === 'auth/too-many-requests'
        ? 'Too many password reset requests. Please wait before trying again.'
        : error.code === 'auth/network-request-failed'
        ? 'Network error. Please check your internet connection and try again.'
        : error.message || 'Password reset failed. Please try again.'

      throw new Error(errorMessage)
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

  // Change password function
  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    if (!auth.currentUser) {
      throw new Error('No user logged in')
    }

    if (!auth.currentUser.email) {
      throw new Error('User email not available')
    }

    try {
      // Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword)
      await reauthenticateWithCredential(auth.currentUser, credential)

      // Update password
      await updatePassword(auth.currentUser, newPassword)

      console.log('✅ Password changed successfully')
    } catch (error: any) {
      console.error('❌ Password change error:', error)
      console.error('❌ Error code:', error.code)
      console.error('❌ Error message:', error.message)

      const errorMessage = error.code === 'auth/wrong-password'
        ? 'Current password is incorrect'
        : error.code === 'auth/weak-password'
        ? 'New password is too weak. Please choose a stronger password.'
        : error.code === 'auth/requires-recent-login'
        ? 'Please log out and log back in before changing your password.'
        : error.message || 'Failed to change password'

      throw new Error(errorMessage)
    }
  }

  // Manual email verification for testing
  const verifyEmailManually = async (userId: string): Promise<void> => {
    try {
      console.log('🔧 Manually verifying email for user:', userId)
      // This is a development helper - in production, users verify via email
      const userDocRef = doc(db, 'users', userId)
      await updateDoc(userDocRef, {
        emailVerified: true,
        updatedAt: new Date()
      })
      console.log('✅ Email manually verified for testing')
    } catch (error: any) {
      console.error('Manual verification error:', error)
      throw new Error('Manual verification failed')
    }
  }

  // Resend email verification
  const resendEmailVerification = async (): Promise<void> => {
    if (!auth.currentUser) {
      throw new Error('No user logged in')
    }

    try {
      console.log('🔄 Resending email verification...')
      await sendEmailVerification(auth.currentUser)
      console.log('✅ Email verification resent successfully')
    } catch (error: any) {
      console.error('❌ Resend email verification failed:', error)
      console.error('❌ Error code:', error.code)
      console.error('❌ Error message:', error.message)

      const errorMessage = error.code === 'auth/too-many-requests'
        ? 'Too many requests. Please wait before requesting another verification email.'
        : error.code === 'auth/user-token-expired'
        ? 'Your session has expired. Please log in again.'
        : error.message || 'Failed to resend verification email'

      throw new Error(errorMessage)
    }
  }

  // Check email verification status
  const checkEmailVerificationStatus = async (): Promise<boolean> => {
    if (!auth.currentUser) {
      return false
    }

    try {
      // Refresh user data to get latest email verification status
      await auth.currentUser.reload()
      const isVerified = auth.currentUser.emailVerified
      console.log('📧 Email verification status:', isVerified)

      // Also check our database record
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid))
      if (userDoc.exists()) {
        const userData = userDoc.data() as AppUser
        const dbEmailVerified = userData.emailVerified || false
        console.log('📧 Database email verification status:', dbEmailVerified)
        return dbEmailVerified
      }

      return isVerified
    } catch (error: any) {
      console.error('❌ Error checking email verification status:', error)
      return false
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
    changePassword,
    resendEmailVerification,
    checkEmailVerificationStatus,
    verifyEmailManually,
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