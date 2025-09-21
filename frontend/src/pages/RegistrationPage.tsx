import React, { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuth } from '../contexts/AuthContext'
import { userRegistrationSchema, UserRegistrationForm } from '../validation/schemas'

const RegistrationPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [privacyStepInteracted, setPrivacyStepInteracted] = useState(false)
  const navigate = useNavigate()
  const { register, error, clearError } = useAuth()

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
    trigger
  } = useForm<UserRegistrationForm>({
    resolver: zodResolver(userRegistrationSchema),
    mode: 'onBlur', // Change to onBlur to prevent auto-advancement
    defaultValues: {
      email: '',
      displayName: '',
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
      }
    }
  })

  const watchedInterests = watch('interests')
  const watchedDietaryPreferences = watch('dietaryPreferences')

  // Clear error when user interacts with form
  const clearFormError = () => {
    if (error && clearError) {
      clearError()
    }
  }

  const interestOptions = [
    'Cooking', 'Baking', 'Gardening', 'Photography', 'Music', 'Sports',
    'Reading', 'Travel', 'Art', 'Technology', 'Volunteering', 'Fitness'
  ]

  const dietaryOptions = [
    'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut-Free',
    'Kosher', 'Halal', 'Low-Carb', 'Paleo', 'Mediterranean'
  ]

  const onSubmit = async (data: UserRegistrationForm) => {
    try {
      setIsLoading(true)
      console.log('🚀 Starting registration submission...')
      console.log('📝 Form data:', data)

      // Clear any previous errors
      if (clearError) {
        clearError()
        console.log('🧹 Cleared previous errors')
      }

      // Final validation check
      console.log('🔍 Running final validation...')
      const isFormValid = await trigger()
      console.log('✅ Form validation result:', isFormValid)

      if (!isFormValid) {
        console.log('❌ Form validation failed')
        toast.error('Please fill in all required fields correctly.')
        setIsLoading(false)
        return
      }

      // Generate a secure temporary password
      const tempPassword = Math.random().toString(36).slice(-12) + 'A1!'
      console.log('🔑 Generated temporary password')

      console.log('📤 Calling register function...')
      await register(
        data.email,
        tempPassword,
        data.displayName,
        {
          phoneNumber: data.phoneNumber,
          whatsappNumber: data.whatsappNumber,
          bio: data.bio,
          interests: data.interests,
          dietaryPreferences: data.dietaryPreferences,
          address: data.address,
          privacy: data.privacy
        }
      )

      console.log('🎉 Registration successful!')
      console.log('🔑 Temporary password:', tempPassword)

      // Show success message with password prominently
      toast.success('🎉 Registration successful!', {
        duration: 5000,
        style: {
          background: '#10B981',
          color: '#fff',
          fontSize: '16px',
          fontWeight: 'bold'
        }
      })

      // Show password in a separate prominent toast
      setTimeout(() => {
        toast.success(`🔑 Your temporary password: ${tempPassword}`, {
          duration: 10000,
          style: {
            background: '#F59E0B',
            color: '#000',
            fontSize: '16px',
            fontWeight: 'bold',
            border: '2px solid #000'
          }
        })
      }, 1000)

      // Navigate after showing messages
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (error: any) {
      console.error('❌ Registration submission error:', error)
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      })

      // Error is already handled by AuthContext and displayed via toast
      // The AuthContext sets the error state which will be displayed
      if (error.message) {
        toast.error(error.message)
      } else {
        toast.error('Registration failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
      console.log('🏁 Registration submission completed')
    }
  }

  const handleNextStep = async () => {
    let fieldsToValidate: (keyof UserRegistrationForm)[] = []

    // Define which fields to validate for each step
    switch (currentStep) {
      case 1:
        fieldsToValidate = ['email', 'displayName']
        break
      case 2:
        fieldsToValidate = ['phoneNumber', 'whatsappNumber', 'bio']
        // Validate address fields if any are filled
        const addressValue = watch('address')
        if (addressValue?.street || addressValue?.city || addressValue?.postalCode) {
          fieldsToValidate.push('address.street' as keyof UserRegistrationForm)
          fieldsToValidate.push('address.city' as keyof UserRegistrationForm)
          fieldsToValidate.push('address.postalCode' as keyof UserRegistrationForm)
        }
        break
      case 3:
        // Interests and dietary preferences are completely optional - no validation required
        fieldsToValidate = []
        break
      case 4:
        // Privacy settings are required
        fieldsToValidate = ['privacy.phoneVisible' as keyof UserRegistrationForm, 'privacy.whatsappVisible' as keyof UserRegistrationForm, 'privacy.addressVisible' as keyof UserRegistrationForm]
        break
      default:
        break
    }

    const isStepValid = await trigger(fieldsToValidate)
    if (isStepValid) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1)
  }

  const toggleInterest = (interest: string) => {
    const currentInterests = watchedInterests || []
    if (currentInterests.includes(interest)) {
      setValue('interests', currentInterests.filter(i => i !== interest))
    } else if (currentInterests.length < 10) {
      setValue('interests', [...currentInterests, interest])
    }
  }

  const toggleDietaryPreference = (preference: string) => {
    const currentPreferences = watchedDietaryPreferences || []
    if (currentPreferences.includes(preference)) {
      setValue('dietaryPreferences', currentPreferences.filter(p => p !== preference))
    } else if (currentPreferences.length < 10) {
      setValue('dietaryPreferences', [...currentPreferences, preference])
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join LCC Assemble</h1>
          <p className="text-lg text-gray-600">Connect with your community through shared events and experiences</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step}
                </div>
                {step < 4 && (
                  <div
                    className={`w-12 h-1 mx-2 ${
                      step < currentStep ? 'bg-orange-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2 space-x-8 text-sm text-gray-600">
            <span className={currentStep >= 1 ? 'text-orange-600 font-medium' : ''}>Account</span>
            <span className={currentStep >= 2 ? 'text-orange-600 font-medium' : ''}>Profile</span>
            <span className={currentStep >= 3 ? 'text-orange-600 font-medium' : ''}>Preferences</span>
            <span className={currentStep >= 4 ? 'text-orange-600 font-medium' : ''}>Privacy</span>
          </div>
        </div>

        <Card className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Account Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">Create Your Account</h3>
                <p className="text-sm text-gray-600">* Required fields</p>

                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      onChange={(e) => {
                        field.onChange(e)
                        clearFormError()
                      }}
                      type="email"
                      label="Email Address *"
                      placeholder="your.email@example.com"
                      error={errors.email?.message}
                      required
                    />
                  )}
                />

                <Controller
                  name="displayName"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      onChange={(e) => {
                        field.onChange(e)
                        clearFormError()
                      }}
                      label="Display Name *"
                      placeholder="How you want to be known in the community"
                      error={errors.displayName?.message}
                      required
                    />
                  )}
                />

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> You'll receive a secure temporary password after registration.
                    You can change it later in your profile settings.
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Profile Information */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">Tell Us About Yourself</h3>
                <p className="text-sm text-gray-600">All fields are optional but help us personalize your experience</p>

                <Controller
                  name="phoneNumber"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      value={field.value || ''}
                      type="tel"
                      label="Phone Number (Optional)"
                      placeholder="+1 (555) 123-4567"
                      error={errors.phoneNumber?.message}
                    />
                  )}
                />

                <Controller
                  name="whatsappNumber"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      value={field.value || ''}
                      type="tel"
                      label="WhatsApp Number (Optional)"
                      placeholder="+1 (555) 123-4567"
                      error={errors.whatsappNumber?.message}
                    />
                  )}
                />

                <Controller
                  name="bio"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio (Optional)
                      </label>
                      <textarea
                        {...field}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Tell us a bit about yourself..."
                      />
                      {errors.bio && (
                        <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
                      )}
                    </div>
                  )}
                />

                {/* Address Section */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900">Address (Optional)</h4>

                  <Controller
                    name="address.street"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label="Street Address"
                        placeholder="123 Main Street"
                        error={errors.address?.street?.message}
                      />
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Controller
                      name="address.city"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          label="City"
                          placeholder="Your City"
                          error={errors.address?.city?.message}
                        />
                      )}
                    />

                    <Controller
                      name="address.postalCode"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          label="Postal Code"
                          placeholder="A1A 1A1"
                          error={errors.address?.postalCode?.message}
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Interests and Preferences */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">Your Interests & Preferences</h3>
                <p className="text-sm text-gray-600">Optional selections to help us connect you with like-minded community members</p>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Tip:</strong> Select any interests or dietary preferences that match your lifestyle, or click "Next" to skip this step.
                  </p>
                </div>

                {/* Interests */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Interests (Select up to 10)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {interestOptions.map((interest) => (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className={`px-3 py-2 text-sm rounded-full border transition-colors ${
                          watchedInterests?.includes(interest)
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-orange-300'
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                  {errors.interests && (
                    <p className="mt-1 text-sm text-red-600">{errors.interests.message}</p>
                  )}
                </div>

                {/* Dietary Preferences */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Dietary Preferences (Select up to 10)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {dietaryOptions.map((preference) => (
                      <button
                        key={preference}
                        type="button"
                        onClick={() => toggleDietaryPreference(preference)}
                        className={`px-3 py-2 text-sm rounded-full border transition-colors ${
                          watchedDietaryPreferences?.includes(preference)
                            ? 'bg-green-500 text-white border-green-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-green-300'
                        }`}
                      >
                        {preference}
                      </button>
                    ))}
                  </div>
                  {errors.dietaryPreferences && (
                    <p className="mt-1 text-sm text-red-600">{errors.dietaryPreferences.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Privacy Settings */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">Privacy Settings</h3>
                <p className="text-sm text-gray-600">
                  Control what information is visible to other community members. These settings are required.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    🔒 <strong>Final Step:</strong> Set your privacy preferences and click "Join the Community" to complete your registration.
                  </p>
                </div>

                <div className="space-y-4">
                  <Controller
                    name="privacy.phoneVisible"
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={(e) => {
                            field.onChange(e)
                            setPrivacyStepInteracted(true)
                          }}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                          className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm text-gray-700">
                          Make phone number visible to other members
                        </label>
                      </div>
                    )}
                  />

                  <Controller
                    name="privacy.whatsappVisible"
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={(e) => {
                            field.onChange(e)
                            setPrivacyStepInteracted(true)
                          }}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                          className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm text-gray-700">
                          Make WhatsApp number visible to other members
                        </label>
                      </div>
                    )}
                  />

                  <Controller
                    name="privacy.addressVisible"
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={(e) => {
                            field.onChange(e)
                            setPrivacyStepInteracted(true)
                          }}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                          className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm text-gray-700">
                          Make address visible to other members
                        </label>
                      </div>
                    )}
                  />
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-green-800 mb-2">Privacy Promise</h4>
                  <p className="text-sm text-green-700">
                    Your privacy is important to us. You can change these settings anytime in your profile.
                    We never share your information with third parties without your explicit consent.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={isLoading}
                >
                  Previous
                </Button>
              )}

              <div className="flex-1" />

              {currentStep < 4 ? (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  disabled={isLoading}
                  className="px-6 py-2"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isLoading || !isValid || !privacyStepInteracted}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={(e) => {
                    // Prevent any accidental auto-submission
                    if (!isValid || isLoading || !privacyStepInteracted) {
                      e.preventDefault()
                      return
                    }
                  }}
                >
                  {isLoading ? 'Creating Account...' : 'Join the Community'}
                </Button>
              )}
            </div>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-orange-600 hover:text-orange-500"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default RegistrationPage