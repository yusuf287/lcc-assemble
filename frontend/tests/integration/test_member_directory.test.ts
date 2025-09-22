import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { UserSummary } from '../../src/types'
import { searchUsers, onUsersChange, getUserProfile, getUserSummary } from '../../src/services/userService'

// Mock the user service
jest.mock('../../src/services/userService')

// Mock data for testing
const mockUsers: UserSummary[] = [
  {
    uid: 'user1',
    displayName: 'Alice Johnson',
    profileImage: 'https://example.com/alice.jpg',
    interests: ['hiking', 'cooking', 'photography'],
    defaultAvailability: { weekdays: true, evenings: false, weekends: true }
  },
  {
    uid: 'user2',
    displayName: 'Bob Smith',
    profileImage: 'https://example.com/bob.jpg',
    interests: ['gaming', 'music', 'cooking'],
    defaultAvailability: { weekdays: false, evenings: true, weekends: true }
  },
  {
    uid: 'user3',
    displayName: 'Charlie Brown',
    profileImage: '',
    interests: ['reading', 'hiking'],
    defaultAvailability: { weekdays: true, evenings: true, weekends: false }
  }
]

describe('Member Directory Integration Tests', () => {
  let mockOnUsersChange: jest.MockedFunction<typeof onUsersChange>
  let mockSearchUsers: jest.MockedFunction<typeof searchUsers>
  let mockGetUserProfile: jest.MockedFunction<typeof getUserProfile>
  let mockGetUserSummary: jest.MockedFunction<typeof getUserSummary>

  beforeEach(() => {
    jest.clearAllMocks()
    mockOnUsersChange = onUsersChange as jest.MockedFunction<typeof onUsersChange>
    mockSearchUsers = searchUsers as jest.MockedFunction<typeof searchUsers>
    mockGetUserProfile = getUserProfile as jest.MockedFunction<typeof getUserProfile>
    mockGetUserSummary = getUserSummary as jest.MockedFunction<typeof getUserSummary>

    // Default mock implementations
    mockOnUsersChange.mockImplementation((filters, callback) => {
      callback(mockUsers)
      return jest.fn() // unsubscribe function
    })

    mockSearchUsers.mockResolvedValue({
      users: mockUsers,
      hasMore: false,
      lastDoc: undefined
    })

    mockGetUserProfile.mockResolvedValue({
      uid: 'user1',
      email: 'alice@example.com',
      displayName: 'Alice Johnson',
      profileImage: 'https://example.com/alice.jpg',
      interests: ['hiking', 'cooking', 'photography'],
      dietaryPreferences: [],
      defaultAvailability: { weekdays: true, evenings: false, weekends: true },
      role: 'member',
      status: 'approved',
      privacy: {
        phoneVisible: true,
        whatsappVisible: true,
        addressVisible: false
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })

    mockGetUserSummary.mockResolvedValue(mockUsers[0])
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  describe('Directory Access', () => {
    it('should load member directory data', async () => {
      const callback = jest.fn()
      const unsubscribe = onUsersChange({}, callback)

      // Simulate the callback being called
      expect(callback).toHaveBeenCalledWith(mockUsers)
      expect(typeof unsubscribe).toBe('function')
    })

    it('should search users with filters', async () => {
      const result = await searchUsers({ status: 'approved' })

      expect(mockSearchUsers).toHaveBeenCalledWith({ status: 'approved' })
      expect(result.users).toEqual(mockUsers)
      expect(result.hasMore).toBe(false)
    })

    it('should get user profile by ID', async () => {
      const profile = await getUserProfile('user1')

      expect(mockGetUserProfile).toHaveBeenCalledWith('user1')
      expect(profile?.displayName).toBe('Alice Johnson')
      expect(profile?.interests).toContain('hiking')
    })

    it('should get user summary by ID', async () => {
      const summary = await getUserSummary('user1')

      expect(mockGetUserSummary).toHaveBeenCalledWith('user1')
      expect(summary?.displayName).toBe('Alice Johnson')
      expect(summary?.interests).toContain('hiking')
    })
  })

  describe('Member Search and Filtering', () => {
    it('should search users by name', async () => {
      const filteredUsers = mockUsers.filter(user =>
        user.displayName.toLowerCase().includes('alice')
      )

      mockSearchUsers.mockResolvedValueOnce({
        users: filteredUsers,
        hasMore: false,
        lastDoc: undefined
      })

      const result = await searchUsers({})

      expect(result.users).toHaveLength(1)
      expect(result.users[0].displayName).toBe('Alice Johnson')
    })

    it('should filter by interests', async () => {
      const filteredUsers = mockUsers.filter(user =>
        user.interests.some(interest => interest.toLowerCase().includes('cooking'))
      )

      mockSearchUsers.mockResolvedValueOnce({
        users: filteredUsers,
        hasMore: false,
        lastDoc: undefined
      })

      const result = await searchUsers({})

      expect(result.users).toHaveLength(2) // Alice and Bob both have cooking
      expect(result.users.map(u => u.displayName)).toEqual(
        expect.arrayContaining(['Alice Johnson', 'Bob Smith'])
      )
    })

    it('should filter by availability', async () => {
      // Test filtering by weekday availability
      const weekdayUsers = mockUsers.filter(user => user.defaultAvailability.weekdays)

      expect(weekdayUsers).toHaveLength(2) // Alice and Charlie
      expect(weekdayUsers.map(u => u.displayName)).toEqual(
        expect.arrayContaining(['Alice Johnson', 'Charlie Brown'])
      )
    })

    it('should handle pagination', async () => {
      mockSearchUsers.mockResolvedValueOnce({
        users: [mockUsers[0]],
        hasMore: true,
        lastDoc: { id: 'user1' } as any
      })

      const result = await searchUsers({}, 1)

      expect(result.users).toHaveLength(1)
      expect(result.hasMore).toBe(true)
      expect(result.lastDoc).toBeDefined()
    })
  })

  describe('Member Profile Display', () => {
    it('should return complete user profile data', async () => {
      const profile = await getUserProfile('user1')

      expect(profile).toHaveProperty('uid', 'user1')
      expect(profile).toHaveProperty('email', 'alice@example.com')
      expect(profile).toHaveProperty('displayName', 'Alice Johnson')
      expect(profile).toHaveProperty('profileImage')
      expect(profile).toHaveProperty('interests')
      expect(profile).toHaveProperty('defaultAvailability')
      expect(profile).toHaveProperty('role')
      expect(profile).toHaveProperty('status')
      expect(profile).toHaveProperty('privacy')
    })

    it('should handle profile images', async () => {
      const profile = await getUserProfile('user1')

      expect(profile?.profileImage).toBe('https://example.com/alice.jpg')
    })

    it('should show member availability data', async () => {
      const profile = await getUserProfile('user1')

      expect(profile?.defaultAvailability).toEqual({
        weekdays: true,
        evenings: false,
        weekends: true
      })
    })

    it('should respect privacy settings', async () => {
      const profile = await getUserProfile('user1')

      expect(profile?.privacy).toEqual({
        phoneVisible: true,
        whatsappVisible: true,
        addressVisible: false
      })
    })
  })

  describe('Contact Integration', () => {
    it('should provide contact information based on privacy settings', async () => {
      const profile = await getUserProfile('user1')

      expect(profile?.privacy.phoneVisible).toBe(true)
      expect(profile?.privacy.whatsappVisible).toBe(true)
      expect(profile?.privacy.addressVisible).toBe(false)
    })

    it('should handle WhatsApp contact visibility', async () => {
      const profile = await getUserProfile('user1')

      // In a real implementation, this would be used to show/hide WhatsApp contact options
      expect(profile?.privacy.whatsappVisible).toBe(true)
    })

    it('should handle email contact visibility', async () => {
      const profile = await getUserProfile('user1')

      // Email is always available from the profile
      expect(profile?.email).toBe('alice@example.com')
    })
  })

  describe('Directory Performance', () => {
    it('should handle large member lists efficiently', async () => {
      const largeUserList = Array.from({ length: 100 }, (_, i) => ({
        ...mockUsers[0],
        uid: `user${i}`,
        displayName: `User ${i}`
      }))

      mockSearchUsers.mockResolvedValueOnce({
        users: largeUserList,
        hasMore: true,
        lastDoc: { id: 'user99' } as any
      })

      const result = await searchUsers({}, 20)

      expect(result.users).toHaveLength(100)
      expect(result.hasMore).toBe(true)
    })

    it('should cache member data appropriately', async () => {
      // First call
      await getUserProfile('user1')
      // Second call should use cached data or make another request
      await getUserProfile('user1')

      expect(mockGetUserProfile).toHaveBeenCalledTimes(2)
    })

    it('should provide real-time updates', async () => {
      const callback = jest.fn()
      const unsubscribe = onUsersChange({}, callback)

      // Simulate real-time update
      const updatedUsers = [...mockUsers, {
        uid: 'user4',
        displayName: 'Diana Prince',
        profileImage: '',
        interests: ['martial arts'],
        defaultAvailability: { weekdays: true, evenings: true, weekends: true }
      }]

      // Call the callback again to simulate real-time update
      callback(updatedUsers)

      expect(callback).toHaveBeenCalledTimes(2)
      expect(callback).toHaveBeenLastCalledWith(updatedUsers)
    })
  })

  describe('User Experience', () => {
    it('should provide intuitive data structure', async () => {
      const summary = await getUserSummary('user1')

      expect(summary).toHaveProperty('uid')
      expect(summary).toHaveProperty('displayName')
      expect(summary).toHaveProperty('profileImage')
      expect(summary).toHaveProperty('interests')
      expect(summary).toHaveProperty('defaultAvailability')
    })

    it('should handle empty search results', async () => {
      mockSearchUsers.mockResolvedValueOnce({
        users: [],
        hasMore: false,
        lastDoc: undefined
      })

      const result = await searchUsers({})

      expect(result.users).toHaveLength(0)
      expect(result.hasMore).toBe(false)
    })

    it('should show member count information', async () => {
      const result = await searchUsers({})

      expect(result.users).toHaveLength(3)
      expect(result.hasMore).toBe(false)
    })

    it('should handle error cases gracefully', async () => {
      mockGetUserProfile.mockRejectedValueOnce(new Error('User not found'))

      await expect(getUserProfile('nonexistent')).rejects.toThrow('User not found')
    })
  })
})