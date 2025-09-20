import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card } from '../ui/Card'
import { Alert } from '../ui/Alert'
import { UserProfile, UserAddress } from '../../types'

interface ProfileFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  onSuccess,
  onCancel
}) => {
  const { userProfile, updateUserProfile, isLoading, error, clearError } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    displayName: '',
    phoneNumber: '',
    whatsappNumber: '',
    bio: '',
    interests: [] as string[],
    dietaryPreferences: [] as string[],
    address: {
      street: '',
      city: '',
      postalCode: ''
    } as UserAddress,
    privacy: {
      phoneVisible: false,
      whatsappVisible: false,
      addressVisible: false
    }
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [newInterest, setNewInterest] = useState('')
  const [newDietaryPreference, setNewDietaryPreference] = useState('')

  // Load existing profile data
  useEffect(() => {
    if (userProfile) {
      setFormData({
        displayName: userProfile.displayName,
        phoneNumber: userProfile.phoneNumber || '',
        whatsappNumber: userProfile.whatsappNumber || '',
        bio: userProfile.bio || '',
        interests: userProfile.interests || [],
        dietaryPreferences: userProfile.dietaryPreferences || [],
        address: userProfile.address || {
          street: '',
          city: '',
          postalCode: ''
        },
        privacy: userProfile.privacy
      })
    }
  }, [userProfile])

  const handleInputChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.value
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }))
    }
    // Clear auth error when user interacts with form
    if (error && clearError) {
      clearError()
    }
  }

  const handleAddressChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value }
    }))
  }

  const handlePrivacyChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const checked = e.target.checked
    setFormData(prev => ({
      ...prev,
      privacy: { ...prev.privacy, [field]: checked }
    }))
  }

  const addInterest = () => {
    if (newInterest.trim() && !formData.interests.includes(newInterest.trim())) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, newInterest.trim()]
      }))
      setNewInterest('')
    }
  }

  const removeInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }))
  }

  const addDietaryPreference = () => {
    if (newDietaryPreference.trim() && !formData.dietaryPreferences.includes(newDietaryPreference.trim())) {
      setFormData(prev => ({
        ...prev,
        dietaryPreferences: [...prev.dietaryPreferences, newDietaryPreference.trim()]
      }))
      setNewDietaryPreference('')
    }
  }

  const removeDietaryPreference = (preference: string) => {
    setFormData(prev => ({
      ...prev,
      dietaryPreferences: prev.dietaryPreferences.filter(p => p !== preference)
    }))
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.displayName.trim()) {
      errors.displayName = 'Display name is required'
    } else if (formData.displayName.length < 2) {
      errors.displayName = 'Display name must be at least 2 characters'
    } else if (formData.displayName.length > 50) {
      errors.displayName = 'Display name must be less than 50 characters'
    }

    if (formData.bio && formData.bio.length > 500) {
      errors.bio = 'Bio must be less than 500 characters'
    }

    if (formData.phoneNumber && !/^\+?[\d\s\-\(\)]+$/.test(formData.phoneNumber)) {
      errors.phoneNumber = 'Please enter a valid phone number'
    }

    if (formData.whatsappNumber && !/^\+?[\d\s\-\(\)]+$/.test(formData.whatsappNumber)) {
      errors.whatsappNumber = 'Please enter a valid WhatsApp number'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setIsSubmitting(true)
      if (updateUserProfile) {
        await updateUserProfile(formData)
        onSuccess?.()
      }
    } catch (err) {
      // Error is handled by the auth context
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
          <p className="text-gray-600 mt-2">Update your personal information and preferences</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert type="error" message={error} />
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>

            <Input
              type="text"
              label="Display Name"
              value={formData.displayName}
              onChange={handleInputChange('displayName')}
              {...(validationErrors.displayName && { error: validationErrors.displayName })}
              placeholder="Your display name"
              disabled={isLoading || isSubmitting}
              required
            />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={handleInputChange('bio')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-50 disabled:cursor-not-allowed"
                placeholder="Tell us about yourself..."
                rows={3}
                disabled={isLoading || isSubmitting}
              />
              {validationErrors.bio && (
                <p className="text-sm text-red-600">{validationErrors.bio}</p>
              )}
              <p className="text-sm text-gray-500">
                {formData.bio.length}/500 characters
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>

            <Input
              type="tel"
              label="Phone Number"
              value={formData.phoneNumber}
              onChange={handleInputChange('phoneNumber')}
              {...(validationErrors.phoneNumber && { error: validationErrors.phoneNumber })}
              placeholder="+1 (555) 123-4567"
              disabled={isLoading || isSubmitting}
            />

            <Input
              type="tel"
              label="WhatsApp Number"
              value={formData.whatsappNumber}
              onChange={handleInputChange('whatsappNumber')}
              {...(validationErrors.whatsappNumber && { error: validationErrors.whatsappNumber })}
              placeholder="+1 (555) 123-4567"
              disabled={isLoading || isSubmitting}
            />
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Address</h3>

            <Input
              type="text"
              label="Street Address"
              value={formData.address.street}
              onChange={handleAddressChange('street')}
              placeholder="123 Main Street"
              disabled={isLoading || isSubmitting}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="text"
                label="City"
                value={formData.address.city}
                onChange={handleAddressChange('city')}
                placeholder="City"
                disabled={isLoading || isSubmitting}
              />

              <Input
                type="text"
                label="Postal Code"
                value={formData.address.postalCode}
                onChange={handleAddressChange('postalCode')}
                placeholder="A1A 1A1"
                disabled={isLoading || isSubmitting}
              />
            </div>
          </div>

          {/* Interests */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Interests</h3>

            <div className="flex gap-2">
              <Input
                type="text"
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                placeholder="Add an interest..."
                disabled={isLoading || isSubmitting}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addInterest()
                  }
                }}
              />
              <Button
                type="button"
                onClick={addInterest}
                disabled={!newInterest.trim() || isLoading || isSubmitting}
                size="sm"
              >
                Add
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.interests.map((interest) => (
                <span
                  key={interest}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  {interest}
                  <button
                    type="button"
                    onClick={() => removeInterest(interest)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                    disabled={isLoading || isSubmitting}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Dietary Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Dietary Preferences</h3>

            <div className="flex gap-2">
              <Input
                type="text"
                value={newDietaryPreference}
                onChange={(e) => setNewDietaryPreference(e.target.value)}
                placeholder="Add a dietary preference..."
                disabled={isLoading || isSubmitting}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addDietaryPreference()
                  }
                }}
              />
              <Button
                type="button"
                onClick={addDietaryPreference}
                disabled={!newDietaryPreference.trim() || isLoading || isSubmitting}
                size="sm"
              >
                Add
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.dietaryPreferences.map((preference) => (
                <span
                  key={preference}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                >
                  {preference}
                  <button
                    type="button"
                    onClick={() => removeDietaryPreference(preference)}
                    className="ml-2 text-green-600 hover:text-green-800"
                    disabled={isLoading || isSubmitting}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Privacy Settings</h3>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.privacy.phoneVisible}
                  onChange={handlePrivacyChange('phoneVisible')}
                  disabled={isLoading || isSubmitting}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Make phone number visible to other members
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.privacy.whatsappVisible}
                  onChange={handlePrivacyChange('whatsappVisible')}
                  disabled={isLoading || isSubmitting}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Make WhatsApp number visible to other members
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.privacy.addressVisible}
                  onChange={handlePrivacyChange('addressVisible')}
                  disabled={isLoading || isSubmitting}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Make address visible to other members
                </span>
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading || isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isLoading || isSubmitting}
              isLoading={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  )
}