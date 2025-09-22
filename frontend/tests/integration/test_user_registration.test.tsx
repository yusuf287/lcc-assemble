import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../../src/contexts/AuthContext'
import RegistrationPage from '../../src/pages/RegistrationPage'

// Mock the AuthContext to avoid complex Firebase mocking
const mockRegister = jest.fn()
const mockClearError = jest.fn()

jest.mock('../../src/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    user: null,
    loading: false,
    register: mockRegister,
    error: null,
    clearError: mockClearError
  })
}))

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn()
  },
  Toaster: () => null
}))

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}))

const renderRegistrationPage = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <RegistrationPage />
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('User Registration Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should render registration form with all required fields', () => {
    renderRegistrationPage()

    // Check for main elements
    expect(screen.getByText('Join LCC Assemble')).toBeInTheDocument()
    expect(screen.getByText('Connect with your community through shared events and experiences')).toBeInTheDocument()

    // Check for form steps
    expect(screen.getByText('Account')).toBeInTheDocument()
    expect(screen.getByText('Profile')).toBeInTheDocument()
    expect(screen.getByText('Preferences')).toBeInTheDocument()
    expect(screen.getByText('Privacy')).toBeInTheDocument()

    // Check for form fields
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument()
  })

  test('should navigate through multi-step form correctly', () => {
    renderRegistrationPage()

    // Should start on step 1
    expect(screen.getByText('Create Your Account')).toBeInTheDocument()

    // Navigate to step 2
    fireEvent.click(screen.getByText('Next'))
    expect(screen.getByText('Tell Us About Yourself')).toBeInTheDocument()

    // Navigate to step 3
    fireEvent.click(screen.getByText('Next'))
    expect(screen.getByText('Your Interests & Preferences')).toBeInTheDocument()

    // Navigate to step 4
    fireEvent.click(screen.getByText('Next'))
    expect(screen.getByText('Privacy Settings')).toBeInTheDocument()

    // Navigate back to step 3
    fireEvent.click(screen.getByText('Previous'))
    expect(screen.getByText('Your Interests & Preferences')).toBeInTheDocument()
  })

  test('should show validation errors for required fields', async () => {
    renderRegistrationPage()

    // Try to submit without filling required fields
    fireEvent.click(screen.getByText('Join the Community'))

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument()
      expect(screen.getByText('Display name must be at least 2 characters')).toBeInTheDocument()
    })

    // Should not call register function
    expect(mockRegister).not.toHaveBeenCalled()
  })

  test('should successfully submit registration with valid data', async () => {
    mockRegister.mockResolvedValueOnce(undefined)

    renderRegistrationPage()

    // Fill out required fields
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' }
    })
    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: 'Test User' }
    })

    // Navigate to privacy step
    fireEvent.click(screen.getByText('Next'))
    fireEvent.click(screen.getByText('Next'))
    fireEvent.click(screen.getByText('Next'))

    // Check privacy checkbox
    const privacyCheckboxes = screen.getAllByRole('checkbox')
    fireEvent.click(privacyCheckboxes[0])

    // Submit the form
    fireEvent.click(screen.getByText('Join the Community'))

    // Should call register with correct data
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String), // Temporary password
        'Test User',
        expect.objectContaining({
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
            phoneVisible: true,
            whatsappVisible: false,
            addressVisible: false
          }
        })
      )
    })
  })

  test('should handle registration errors gracefully', async () => {
    const registerError = new Error('Email already in use')
    ;(registerError as any).code = 'auth/email-already-in-use'
    mockRegister.mockRejectedValueOnce(registerError)

    renderRegistrationPage()

    // Fill out required fields
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'existing@example.com' }
    })
    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: 'Test User' }
    })

    // Navigate to privacy step and submit
    fireEvent.click(screen.getByText('Next'))
    fireEvent.click(screen.getByText('Next'))
    fireEvent.click(screen.getByText('Next'))

    const privacyCheckboxes = screen.getAllByRole('checkbox')
    fireEvent.click(privacyCheckboxes[0])

    fireEvent.click(screen.getByText('Join the Community'))

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('This email is already registered. Please try logging in instead.')).toBeInTheDocument()
    })
  })

  test('should handle interest and dietary preference selection', () => {
    renderRegistrationPage()

    // Navigate to preferences step
    fireEvent.click(screen.getByText('Next'))
    fireEvent.click(screen.getByText('Next'))

    // Should show interest options
    expect(screen.getByText('Cooking')).toBeInTheDocument()
    expect(screen.getByText('Vegetarian')).toBeInTheDocument()

    // Click on interests
    fireEvent.click(screen.getByText('Cooking'))
    fireEvent.click(screen.getByText('Photography'))

    // Click on dietary preferences
    fireEvent.click(screen.getByText('Vegetarian'))
    fireEvent.click(screen.getByText('Gluten-Free'))

    // Navigate to privacy step
    fireEvent.click(screen.getByText('Next'))

    // Submit form
    const privacyCheckboxes = screen.getAllByRole('checkbox')
    fireEvent.click(privacyCheckboxes[0])

    fireEvent.click(screen.getByText('Join the Community'))

    // Should include selected preferences in registration data
    expect(mockRegister).toHaveBeenCalledWith(
      '',
      expect.any(String),
      '',
      expect.objectContaining({
        interests: ['Cooking', 'Photography'],
        dietaryPreferences: ['Vegetarian', 'Gluten-Free']
      })
    )
  })

  test('should handle optional address fields', () => {
    renderRegistrationPage()

    // Navigate to profile step
    fireEvent.click(screen.getByText('Next'))

    // Fill optional address fields
    fireEvent.change(screen.getByLabelText(/street address/i), {
      target: { value: '123 Main St' }
    })
    fireEvent.change(screen.getByLabelText(/city/i), {
      target: { value: 'Test City' }
    })
    fireEvent.change(screen.getByLabelText(/postal code/i), {
      target: { value: '12345' }
    })

    // Navigate to privacy step
    fireEvent.click(screen.getByText('Next'))
    fireEvent.click(screen.getByText('Next'))

    // Submit form
    const privacyCheckboxes = screen.getAllByRole('checkbox')
    fireEvent.click(privacyCheckboxes[0])

    fireEvent.click(screen.getByText('Join the Community'))

    // Should include address in registration data
    expect(mockRegister).toHaveBeenCalledWith(
      '',
      expect.any(String),
      '',
      expect.objectContaining({
        address: {
          street: '123 Main St',
          city: 'Test City',
          postalCode: '12345'
        }
      })
    )
  })
})