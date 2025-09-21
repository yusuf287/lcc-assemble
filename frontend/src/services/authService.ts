import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
  UserCredential,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  applyActionCode,
  sendEmailVerification,
  reload
} from 'firebase/auth'
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { auth, db, storage } from './firebase'
import { User, UserProfile, UserStatus } from '../types'

export class AuthService {
  // Authentication Methods
  static async register(
    email: string,
    password: string,
    displayName: string,
    profileData?: {
      phoneNumber?: string
      whatsappNumber?: string
      bio?: string
      interests?: string[]
      dietaryPreferences?: string[]
      address?: {
        street: string
        city: string
        postalCode: string
      }
      privacy?: {
        phoneVisible: boolean
        whatsappVisible: boolean
        addressVisible: boolean
      }
    }
  ): Promise<UserCredential> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)

      // Update Firebase Auth profile
      await updateProfile(userCredential.user, { displayName })

      // Create comprehensive user document in Firestore
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
        role: 'member' as const,
        status: 'approved' as const,
        defaultAvailability: {
          weekdays: false,
          evenings: false,
          weekends: false
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await setDoc(doc(db, 'users', userCredential.user.uid), userData)

      // Send email verification
      await sendEmailVerification(userCredential.user)

      return userCredential
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  static async login(email: string, password: string): Promise<UserCredential> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)

      // Check if email is verified
      if (!userCredential.user.emailVerified) {
        throw new Error('Please verify your email before logging in.')
      }

      // Check user status
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid))
      if (userDoc.exists()) {
        const userData = userDoc.data() as User
        if (userData.status === 'suspended') {
          await signOut(auth)
          throw new Error('Your account has been suspended. Please contact an administrator.')
        }
      }

      return userCredential
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  static async logout(): Promise<void> {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  static async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error) {
      console.error('Password reset error:', error)
      throw error
    }
  }

  static async confirmPasswordReset(oobCode: string, newPassword: string): Promise<void> {
    try {
      await confirmPasswordReset(auth, oobCode, newPassword)
    } catch (error) {
      console.error('Password reset confirmation error:', error)
      throw error
    }
  }

  static async verifyPasswordResetCode(code: string): Promise<string> {
    try {
      return await verifyPasswordResetCode(auth, code)
    } catch (error) {
      console.error('Password reset code verification error:', error)
      throw error
    }
  }

  static async verifyEmail(actionCode: string): Promise<void> {
    try {
      await applyActionCode(auth, actionCode)
      // Reload user to get updated emailVerified status
      if (auth.currentUser) {
        await reload(auth.currentUser)
      }
    } catch (error) {
      console.error('Email verification error:', error)
      throw error
    }
  }

  static async resendEmailVerification(): Promise<void> {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser)
      } else {
        throw new Error('No user is currently signed in.')
      }
    } catch (error) {
      console.error('Resend email verification error:', error)
      throw error
    }
  }

  // User Profile Methods
  static async getCurrentUser(): Promise<User | null> {
    try {
      if (!auth.currentUser) return null

      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid))
      if (userDoc.exists()) {
        return { uid: auth.currentUser.uid, ...userDoc.data() } as User
      }
      return null
    } catch (error) {
      console.error('Get current user error:', error)
      throw error
    }
  }

  static async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const userRef = doc(db, 'users', uid)
      await updateDoc(userRef, {
        ...updates,
        updatedAt: new Date()
      })
    } catch (error) {
      console.error('Update user profile error:', error)
      throw error
    }
  }

  static async uploadProfileImage(uid: string, file: File): Promise<string> {
    try {
      const storageRef = ref(storage, `users/${uid}/profile/${file.name}`)
      const snapshot = await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)

      // Update user profile with new image URL
      await this.updateUserProfile(uid, { profileImage: downloadURL })

      return downloadURL
    } catch (error) {
      console.error('Profile image upload error:', error)
      throw error
    }
  }

  // Admin Methods
  static async approveUser(uid: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        status: 'approved',
        updatedAt: new Date()
      })
    } catch (error) {
      console.error('Approve user error:', error)
      throw error
    }
  }

  static async suspendUser(uid: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        status: 'suspended',
        updatedAt: new Date()
      })
    } catch (error) {
      console.error('Suspend user error:', error)
      throw error
    }
  }

  static async getPendingUsers(): Promise<User[]> {
    try {
      const q = query(collection(db, 'users'), where('status', '==', 'pending'))
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as User[]
    } catch (error) {
      console.error('Get pending users error:', error)
      throw error
    }
  }

  static async getAllUsers(): Promise<User[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'))
      return querySnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as User[]
    } catch (error) {
      console.error('Get all users error:', error)
      throw error
    }
  }

  // Auth State Listener
  static onAuthStateChange(callback: (user: FirebaseUser | null) => void): () => void {
    return onAuthStateChanged(auth, callback)
  }

  // Real-time User Profile Listener
  static onUserProfileChange(uid: string, callback: (user: User | null) => void): () => void {
    const userRef = doc(db, 'users', uid)
    return onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        callback({ uid: doc.id, ...doc.data() } as User)
      } else {
        callback(null)
      }
    }, (error) => {
      console.error('User profile listener error:', error)
      callback(null)
    })
  }

  // Utility Methods
  static getCurrentUserId(): string | null {
    return auth.currentUser?.uid || null
  }

  static isAuthenticated(): boolean {
    return !!auth.currentUser
  }

  static async refreshUser(): Promise<void> {
    if (auth.currentUser) {
      await reload(auth.currentUser)
    }
  }
}