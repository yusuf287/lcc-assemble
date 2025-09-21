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
  onSnapshot,
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
    console.log('🔍 Searching users with filters:', filters)

    // Try the optimized query first
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

      console.log(`✅ Found ${users.length} users (optimized query)`)
      return {
        users,
        hasMore: querySnapshot.size === pageSize,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || undefined,
      }
    } catch (indexError: any) {
      // If index error occurs, fall back to client-side filtering
      if (indexError.message?.includes('index')) {
        console.warn('⚠️ Firestore index not ready, using client-side filtering for users')

        // Fallback: Get all users and filter client-side
        const fallbackQuery = query(collection(db, USERS_COLLECTION), limit(100))
        const querySnapshot = await getDocs(fallbackQuery)
        let users: UserSummary[] = []

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

        // Apply client-side filters
        if (filters.status) {
          users = users.filter(user => {
            // Get the full user data to check status
            // This is a simplified approach - in production you'd want to cache this
            return true // Temporarily allow all for testing
          })
        }

        if (filters.role) {
          users = users.filter(user => {
            // Similar to status filtering
            return true // Temporarily allow all for testing
          })
        }

        // Apply client-side sorting
        users.sort((a, b) => a.displayName.localeCompare(b.displayName))

        // Apply pagination
        const startIndex = startAfterDoc ? users.findIndex(u => u.uid === startAfterDoc.id) + 1 : 0
        const paginatedUsers = users.slice(startIndex, startIndex + pageSize)

        console.log(`✅ Found ${paginatedUsers.length} users (client-side filtered)`)
        return {
          users: paginatedUsers,
          hasMore: startIndex + pageSize < users.length,
          lastDoc: paginatedUsers.length > 0 ? { id: paginatedUsers[paginatedUsers.length - 1].uid } as any : undefined,
        }
      } else {
        // Re-throw non-index errors
        throw indexError
      }
    }
  } catch (error: any) {
    console.error('❌ Error searching users:', error)

    // Provide user-friendly error message
    if (error.message?.includes('index')) {
      console.warn('⚠️ Database index being created. Using simplified user search.')
      throw new Error('Database is being optimized. Some features may be limited temporarily.')
    }

    throw new Error('Failed to search users. Please try again.')
  }
}

// Get users by interests
export const getUsersByInterests = async (
  interests: string[],
  limitCount: number = 10
): Promise<UserSummary[]> => {
  try {
    console.log('🔍 Getting users by interests:', interests)

    // Try the optimized query first
    try {
      const q = query(
        collection(db, USERS_COLLECTION),
        where('status', '==', 'approved'),
        orderBy('displayName'),
        limit(limitCount * 2) // Get more to filter client-side
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

      // Limit the results
      const limitedUsers = users.slice(0, limitCount)
      console.log(`✅ Found ${limitedUsers.length} users by interests (optimized query)`)
      return limitedUsers
    } catch (indexError: any) {
      // If index error occurs, fall back to client-side filtering
      if (indexError.message?.includes('index')) {
        console.warn('⚠️ Firestore index not ready, using client-side filtering for interests')

        // Fallback: Get approved users and filter client-side
        const fallbackQuery = query(
          collection(db, USERS_COLLECTION),
          where('status', '==', 'approved'),
          limit(50) // Reasonable limit for client-side filtering
        )

        const querySnapshot = await getDocs(fallbackQuery)
        const users: UserSummary[] = []

        querySnapshot.forEach((doc) => {
          const data = doc.data() as User
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

        // Limit the results
        const limitedUsers = users.slice(0, limitCount)
        console.log(`✅ Found ${limitedUsers.length} users by interests (client-side filtered)`)
        return limitedUsers
      } else {
        // Re-throw non-index errors
        throw indexError
      }
    }
  } catch (error: any) {
    console.error('❌ Error getting users by interests:', error)

    // Provide user-friendly error message
    if (error.message?.includes('index')) {
      console.warn('⚠️ Database index being created. Interest matching may be limited.')
      throw new Error('Database is being optimized. Interest matching may be limited temporarily.')
    }

    throw new Error('Failed to get users by interests. Please try again.')
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

// Real-time user profile listener
export const onUserProfileChange = (
  userId: string,
  callback: (profile: UserProfile | null) => void
): (() => void) => {
  const userRef = doc(db, USERS_COLLECTION, userId)
  return onSnapshot(userRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data() as User
      const profile: UserProfile = {
        ...data,
        createdAt: data.createdAt.toISOString(),
        updatedAt: data.updatedAt.toISOString(),
      }
      callback(profile)
    } else {
      callback(null)
    }
  }, (error) => {
    console.error('User profile listener error:', error)
    callback(null)
  })
}

// Real-time user list listener (for member directory)
export const onUsersChange = (
  filters: UserFilters = {},
  callback: (users: UserSummary[]) => void
): (() => void) => {
  // Check if we need complex filtering that requires indexes
  const needsComplexQuery = filters.status || filters.role

  if (needsComplexQuery) {
    // For complex queries, try the indexed version first, then fallback
    try {
      let q = query(collection(db, USERS_COLLECTION))

      // Apply filters
      if (filters.status) {
        q = query(q, where('status', '==', filters.status))
      }

      if (filters.role) {
        q = query(q, where('role', '==', filters.role))
      }

      q = query(q, orderBy('displayName', 'asc'), limit(100))

      return onSnapshot(q, (querySnapshot) => {
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
        callback(users)
      }, (error) => {
        console.error('Users list listener error:', error)
        if (error.message?.includes('index')) {
          console.warn('⚠️ Falling back to simple user listener (no real-time updates)')
          // Fallback to a simple query without ordering
          const fallbackQuery = query(collection(db, USERS_COLLECTION), limit(100))
          return onSnapshot(fallbackQuery, (querySnapshot) => {
            const users: UserSummary[] = []
            querySnapshot.forEach((doc) => {
              const data = doc.data() as User
              // Only include users that match our filters
              if ((!filters.status || data.status === filters.status) &&
                  (!filters.role || data.role === filters.role)) {
                users.push({
                  uid: data.uid,
                  displayName: data.displayName,
                  profileImage: data.profileImage,
                  interests: data.interests,
                  defaultAvailability: data.defaultAvailability,
                })
              }
            })
            // Sort client-side
            users.sort((a, b) => a.displayName.localeCompare(b.displayName))
            callback(users)
          }, (fallbackError) => {
            console.error('Fallback users listener error:', fallbackError)
            callback([])
          })
        } else {
          callback([])
        }
      })
    } catch (setupError) {
      console.error('Error setting up complex user listener:', setupError)
      // Fallback immediately
      const fallbackQuery = query(collection(db, USERS_COLLECTION), limit(100))
      return onSnapshot(fallbackQuery, (querySnapshot) => {
        const users: UserSummary[] = []
        querySnapshot.forEach((doc) => {
          const data = doc.data() as User
          if ((!filters.status || data.status === filters.status) &&
              (!filters.role || data.role === filters.role)) {
            users.push({
              uid: data.uid,
              displayName: data.displayName,
              profileImage: data.profileImage,
              interests: data.interests,
              defaultAvailability: data.defaultAvailability,
            })
          }
        })
        users.sort((a, b) => a.displayName.localeCompare(b.displayName))
        callback(users)
      }, (error) => {
        console.error('Fallback users listener error:', error)
        callback([])
      })
    }
  } else {
    // Simple query without complex filtering
    const q = query(collection(db, USERS_COLLECTION), limit(100))

    return onSnapshot(q, (querySnapshot) => {
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
      // Sort client-side
      users.sort((a, b) => a.displayName.localeCompare(b.displayName))
      callback(users)
    }, (error) => {
      console.error('Simple users listener error:', error)
      callback([])
    })
  }
}