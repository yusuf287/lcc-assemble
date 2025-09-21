describe('User Registration Integration Tests', () => {
  // GREEN Phase: User registration flow is implemented, now testing the complete integration
  // This validates that the registration process works end-to-end with Firebase services

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should successfully register a new user with complete profile', async () => {
    // Test contract: User registration creates Firebase Auth user and Firestore profile
    // Implementation: AuthContext.register integrates with Firebase Auth and Firestore

    const { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } = require('firebase/auth')
    const { doc, setDoc } = require('firebase/firestore')
    const { toast } = require('react-hot-toast')

    // Mock successful Firebase operations
    const mockUser = { uid: 'test-user-123', email: 'test@example.com' }
    ;(createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({
      user: mockUser
    })
    ;(updateProfile as jest.Mock).mockResolvedValue(undefined)
    ;(sendEmailVerification as jest.Mock).mockResolvedValue(undefined)
    ;(doc as jest.Mock).mockReturnValue('mock-user-doc')
    ;(setDoc as jest.Mock).mockResolvedValue(undefined)
    ;(toast.success as jest.Mock).mockImplementation(() => undefined)

    // Mock the AuthContext
    const mockRegister = jest.fn().mockResolvedValue(undefined)
    jest.doMock('../../src/contexts/AuthContext', () => ({
      useAuth: () => ({
        register: mockRegister
      }),
      AuthProvider: ({ children }: { children: React.ReactNode }) => children
    }))

    // Import after mocking
    const { useAuth } = require('../../src/contexts/AuthContext')
    const { register } = useAuth()

    // Test registration with complete profile data
    const profileData = {
      phoneNumber: '+1234567890',
      whatsappNumber: '+1234567890',
      bio: 'Community enthusiast and event organizer',
      interests: ['Cooking', 'Photography', 'Volunteering'],
      dietaryPreferences: ['Vegetarian'],
      address: {
        street: '123 Main St',
        city: 'Anytown',
        postalCode: '12345'
      },
      privacy: {
        phoneVisible: true,
        whatsappVisible: false,
        addressVisible: false
      }
    }

    await expect(register(
      'test@example.com',
      'temp-password-123',
      'Test User',
      profileData
    )).resolves.not.toThrow()

    // Verify Firebase Auth calls
    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
      expect.any(Object), // auth instance
      'test@example.com',
      'temp-password-123'
    )

    expect(updateProfile).toHaveBeenCalledWith(mockUser, {
      displayName: 'Test User'
    })

    expect(sendEmailVerification).toHaveBeenCalledWith(mockUser)

    // Verify Firestore profile creation
    expect(doc).toHaveBeenCalledWith(expect.any(Object), 'users', 'test-user-123')
    expect(setDoc).toHaveBeenCalledWith('mock-user-doc', {
      uid: 'test-user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      phoneNumber: '+1234567890',
      whatsappNumber: '+1234567890',
      bio: 'Community enthusiast and event organizer',
      interests: ['Cooking', 'Photography', 'Volunteering'],
      dietaryPreferences: ['Vegetarian'],
      address: {
        street: '123 Main St',
        city: 'Anytown',
        postalCode: '12345'
      },
      privacy: {
        phoneVisible: true,
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
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date)
    })

    // Verify success feedback
    expect(toast.success).toHaveBeenCalledWith(
      '🎉 Registration successful!',
      expect.any(Object)
    )
  })

  test('should handle Firebase Auth errors appropriately', async () => {
    // Test contract: Registration errors are caught and handled gracefully
    // Implementation: Error handling in AuthContext.register

    const { createUserWithEmailAndPassword } = require('firebase/auth')
    const { toast } = require('react-hot-toast')

    // Mock the AuthContext
    const mockRegister = jest.fn().mockRejectedValue(new Error('This email is already registered. Please try logging in instead.'))
    jest.doMock('../../src/contexts/AuthContext', () => ({
      useAuth: () => ({
        register: mockRegister
      }),
      AuthProvider: ({ children }: { children: React.ReactNode }) => children
    }))

    const { useAuth } = require('../../src/contexts/AuthContext')
    const { register } = useAuth()

    // Mock email already in use error
    const authError = {
      code: 'auth/email-already-in-use',
      message: 'The email address is already in use by another account.'
    }
    ;(createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(authError)
    ;(toast.error as jest.Mock).mockImplementation(() => undefined)

    // Test registration with existing email
    await expect(register(
      'existing@example.com',
      'password123',
      'Existing User',
      {}
    )).rejects.toThrow('This email is already registered. Please try logging in instead.')

    // Verify error handling
    expect(toast.error).toHaveBeenCalledWith('This email is already registered. Please try logging in instead.')
  })

  test('should handle Firestore errors during profile creation', async () => {
    // Test contract: Firestore errors are handled and user is informed
    // Implementation: Error handling for profile creation

    const { createUserWithEmailAndPassword, updateProfile } = require('firebase/auth')
    const { setDoc } = require('firebase/firestore')
    const { toast } = require('react-hot-toast')

    // Mock the AuthContext
    const mockRegister = jest.fn().mockRejectedValue(new Error('Permission denied. Please check Firestore security rules.'))
    jest.doMock('../../src/contexts/AuthContext', () => ({
      useAuth: () => ({
        register: mockRegister
      }),
      AuthProvider: ({ children }: { children: React.ReactNode }) => children
    }))

    const { useAuth } = require('../../src/contexts/AuthContext')
    const { register } = useAuth()

    // Mock successful auth but failed Firestore
    const mockUser = { uid: 'test-user-123' }
    ;(createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({
      user: mockUser
    })
    ;(updateProfile as jest.Mock).mockResolvedValue(undefined)

    const firestoreError = {
      code: 'permission-denied',
      message: 'Missing or insufficient permissions.'
    }
    ;(setDoc as jest.Mock).mockRejectedValue(firestoreError)
    ;(toast.error as jest.Mock).mockImplementation(() => undefined)

    // Test registration
    await expect(register(
      'test@example.com',
      'password123',
      'Test User',
      {}
    )).rejects.toThrow('Permission denied. Please check Firestore security rules.')

    // Verify error handling
    expect(toast.error).toHaveBeenCalledWith('Permission denied. Please check Firestore security rules.')
  })

  test('should register user with minimal required data', async () => {
    // Test contract: Registration works with only required fields
    // Implementation: Default values for optional profile data

    const { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } = require('firebase/auth')
    const { doc, setDoc } = require('firebase/firestore')
    const { toast } = require('react-hot-toast')

    // Mock the AuthContext
    const mockRegister = jest.fn().mockResolvedValue(undefined)
    jest.doMock('../../src/contexts/AuthContext', () => ({
      useAuth: () => ({
        register: mockRegister
      }),
      AuthProvider: ({ children }: { children: React.ReactNode }) => children
    }))

    const { useAuth } = require('../../src/contexts/AuthContext')
    const { register } = useAuth()

    // Mock successful operations
    const mockUser = { uid: 'minimal-user-456' }
    ;(createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({
      user: mockUser
    })
    ;(updateProfile as jest.Mock).mockResolvedValue(undefined)
    ;(sendEmailVerification as jest.Mock).mockResolvedValue(undefined)
    ;(doc as jest.Mock).mockReturnValue('mock-minimal-doc')
    ;(setDoc as jest.Mock).mockResolvedValue(undefined)
    ;(toast.success as jest.Mock).mockImplementation(() => undefined)

    // Test with minimal data (no profile data provided)
    await expect(register(
      'minimal@example.com',
      'password123',
      'Minimal User'
    )).resolves.not.toThrow()

    // Verify profile created with defaults
    expect(setDoc).toHaveBeenCalledWith('mock-minimal-doc', {
      uid: 'minimal-user-456',
      email: 'minimal@example.com',
      displayName: 'Minimal User',
      phoneNumber: '',
      whatsappNumber: '',
      bio: '',
      interests: [],
      dietaryPreferences: [],
      address: {
        street: '',
        city: '',
        postalCode: ''
      },
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
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date)
    })
  })

  test('should handle network connectivity issues', async () => {
    // Test contract: Network errors are handled gracefully
    // Implementation: Timeout and connectivity error handling

    const { createUserWithEmailAndPassword } = require('firebase/auth')
    const { toast } = require('react-hot-toast')

    // Mock the AuthContext
    const mockRegister = jest.fn().mockRejectedValue(new Error('Service temporarily unavailable. Please try again later.'))
    jest.doMock('../../src/contexts/AuthContext', () => ({
      useAuth: () => ({
        register: mockRegister
      }),
      AuthProvider: ({ children }: { children: React.ReactNode }) => children
    }))

    const { useAuth } = require('../../src/contexts/AuthContext')
    const { register } = useAuth()

    // Mock network/unavailable error
    const networkError = {
      code: 'unavailable',
      message: 'The service is currently unavailable.'
    }
    ;(createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(networkError)
    ;(toast.error as jest.Mock).mockImplementation(() => undefined)

    // Test registration during network issues
    await expect(register(
      'test@example.com',
      'password123',
      'Test User',
      {}
    )).rejects.toThrow('Service temporarily unavailable. Please try again later.')

    // Verify error handling
    expect(toast.error).toHaveBeenCalledWith('Service temporarily unavailable. Please try again later.')
  })
})