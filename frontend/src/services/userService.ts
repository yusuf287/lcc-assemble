import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  collection,
  getDocs,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot,
} from 'firebase/firestore'
import { db } from './firebase'
import {
  User,
  UserProfile,
  UserSummary,
  UserAdminView,
  UserFilters,
  UserQueryResult,
} from '../types'

// Collection name
const USERS_COLLECTION = 'users'

// Get user profile by UID
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, uid)
    const userDoc = await getDoc(userDocRef)

    if (userDoc.exists()) {
      const data = userDoc.data() as User
      return {
        ...data,
        createdAt: data.createdAt.toISOString(),
        updatedAt: data.updatedAt.toISOString(),
      }
    }

    return null
  } catch (error) {
    console.error('Error getting user profile:', error)
    throw new Error('Failed to get user profile')
  }
}

// Create or update user profile
export const setUserProfile = async (uid: string, profile: Partial<User>): Promise<void> => {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, uid)
    const now = new Date()

    const profileData = {
      ...profile,
      updatedAt: now,
    }

    // If creating new profile, set createdAt
    if (!profile.createdAt) {
      profileData.createdAt = now
    }

    await setDoc(userDocRef, profileData, { merge: true })
  } catch (error) {
    console.error('Error setting user profile:', error)
    throw new Error('Failed to save user profile')
  }
}

// Update user profile
export const updateUserProfile = async (uid: string, updates: Partial<User>): Promise<void> => {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, uid)
    const updateData = {
      ...updates,
      updatedAt: new Date(),
    }

    await updateDoc(userDocRef, updateData)
  } catch (error) {
    console.error('Error updating user profile:', error)
    throw new Error('Failed to update user profile')
  }
}

// Get user summary (for member directory)
export const getUserSummary = async (uid: string): Promise<UserSummary | null> => {
  try {
    const profile = await getUserProfile(uid)
    if (!profile) return null

    return {
      uid: profile.uid,
      displayName: profile.displayName,
      profileImage: profile.profileImage,
      interests: profile.interests,
      defaultAvailability: profile.defaultAvailability,
    }
  } catch (error) {
    console.error('Error getting user summary:', error)
    throw new Error('Failed to get user summary')
  }
}

// Search users with filters
export const searchUsers = async (
  filters: UserFilters = {},
  pageSize: number = 20,
  startAfterDoc?: QueryDocumentSnapshot
): Promise<UserQueryResult> => {
  try {
    let q = query(collection(db, USERS_COLLECTION))

    // Apply filters
    if (filters.status) {
      q = query(q, where('status', '==', filters.status))
    }

    if (filters.role) {
      q = query(q, where('role', '==', filters.role))
    }

    // Apply ordering
    q = query(q, orderBy('displayName', 'asc'))

    // Apply pagination
    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc))
    }

    q = query(q, limit(pageSize))

    const querySnapshot = await getDocs(q)
    const users: UserSummary[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data() as User
      users.push({
        uid: data.uid,
        displayName: data.displayName,
        profileImage: data.profileImage,
        interests: data.interests,
        defaultAvailability: data.defaultAvailability,
      })
    })

    return {
      users,
      hasMore: querySnapshot.size === pageSize,
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || undefined,
    }
  } catch (error) {
    console.error('Error searching users:', error)
    throw new Error('Failed to search users')
  }
}

// Get users by interests
export const getUsersByInterests = async (
  interests: string[],
  limitCount: number = 10
): Promise<UserSummary[]> => {
  try {
    // Note: This is a simplified implementation
    // In a real app, you might use array-contains-any for better performance
    const q = query(
      collection(db, USERS_COLLECTION),
      where('status', '==', 'approved'),
      orderBy('displayName'),
      limit(limitCount)
    )

    const querySnapshot = await getDocs(q)
    const users: UserSummary[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data() as User
      // Simple interest matching (can be improved)
      const hasMatchingInterest = interests.some(interest =>
        data.interests.some(userInterest =>
          userInterest.toLowerCase().includes(interest.toLowerCase())
        )
      )

      if (hasMatchingInterest) {
        users.push({
          uid: data.uid,
          displayName: data.displayName,
          profileImage: data.profileImage,
          interests: data.interests,
          defaultAvailability: data.defaultAvailability,
        })
      }
    })

    return users
  } catch (error) {
    console.error('Error getting users by interests:', error)
    throw new Error('Failed to get users by interests')
  }
}

// Admin functions
export const getUserAdminView = async (uid: string): Promise<UserAdminView | null> => {
  try {
    const profile = await getUserProfile(uid)
    if (!profile) return null

    // In a real app, you'd calculate these from related data
    const adminView: UserAdminView = {
      ...profile,
      createdAt: new Date(profile.createdAt),
      updatedAt: new Date(profile.updatedAt),
      lastLogin: new Date(), // Would be tracked separately
      eventCount: 0, // Would be calculated from events collection
      rsvpCount: 0, // Would be calculated from event RSVPs
    }

    return adminView
  } catch (error) {
    console.error('Error getting user admin view:', error)
    throw new Error('Failed to get user admin view')
  }
}

// Approve user (admin only)
export const approveUser = async (uid: string): Promise<void> => {
  try {
    await updateUserProfile(uid, { status: 'approved' })
  } catch (error) {
    console.error('Error approving user:', error)
    throw new Error('Failed to approve user')
  }
}

// Suspend user (admin only)
export const suspendUser = async (uid: string): Promise<void> => {
  try {
    await updateUserProfile(uid, { status: 'suspended' })
  } catch (error) {
    console.error('Error suspending user:', error)
    throw new Error('Failed to suspend user')
  }
}

// Check if user exists
export const userExists = async (uid: string): Promise<boolean> => {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, uid)
    const userDoc = await getDoc(userDocRef)
    return userDoc.exists()
  } catch (error) {
    console.error('Error checking if user exists:', error)
    return false
  }
}

// Get user count by status (for admin dashboard)
export const getUserCountByStatus = async (): Promise<Record<string, number>> => {
  try {
    const q = query(collection(db, USERS_COLLECTION))
    const querySnapshot = await getDocs(q)

    const counts: Record<string, number> = {
      pending: 0,
      approved: 0,
      suspended: 0,
    }

    querySnapshot.forEach((doc) => {
      const data = doc.data() as User
      counts[data.status] = (counts[data.status] || 0) + 1
    })

    return counts
  } catch (error) {
    console.error('Error getting user count by status:', error)
    throw new Error('Failed to get user statistics')
  }
}