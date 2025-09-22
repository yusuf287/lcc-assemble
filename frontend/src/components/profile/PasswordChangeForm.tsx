import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card } from '../ui/Card'
import { Alert } from '../ui/Alert'
import toast from 'react-hot-toast'

interface PasswordChangeFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export const PasswordChangeForm: React.FC<PasswordChangeFormProps> = ({
  onSuccess,
  onCancel
}) => {
  const { changePassword, error, clearError } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [showSuccess, setShowSuccess] = useState(false)

  const handleInputChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement>
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

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.currentPassword) {
      errors.currentPassword = 'Current password is required'
    }

    if (!formData.newPassword) {
      errors.newPassword = 'New password is required'
    } else if (formData.newPassword.length < 6) {
      errors.newPassword = 'New password must be at least 6 characters'
    } else if (formData.newPassword === formData.currentPassword) {
      errors.newPassword = 'New password must be different from current password'
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password'
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
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
      await changePassword(formData.currentPassword, formData.newPassword)

      // Clear form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })

      setShowSuccess(true)
      toast.success('Password changed successfully!')

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false)
      }, 3000)

      onSuccess?.()
    } catch (err) {
      // Error is handled by the auth context
      console.error('Password change error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Change Password</h2>
          <p className="text-gray-600 mt-2">Update your password to keep your account secure</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert type="error" message={error} />
          )}

          {showSuccess && (
            <Alert type="success" message="Password changed successfully!" />
          )}

          {/* Current Password */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Current Password *
            </label>
            <Input
              type="password"
              value={formData.currentPassword}
              onChange={handleInputChange('currentPassword')}
              error={validationErrors.currentPassword}
              placeholder="Enter your current password"
              disabled={isSubmitting}
              required
            />
          </div>

          {/* New Password */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              New Password *
            </label>
            <Input
              type="password"
              value={formData.newPassword}
              onChange={handleInputChange('newPassword')}
              error={validationErrors.newPassword}
              placeholder="Enter your new password"
              disabled={isSubmitting}
              required
            />
            <p className="text-sm text-gray-500">
              Password must be at least 6 characters long
            </p>
          </div>

          {/* Confirm New Password */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Confirm New Password *
            </label>
            <Input
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange('confirmPassword')}
              error={validationErrors.confirmPassword}
              placeholder="Confirm your new password"
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Password Requirements */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Password Requirements:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• At least 6 characters long</li>
              <li>• Must be different from your current password</li>
              <li>• Use a combination of letters, numbers, and symbols for better security</li>
            </ul>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              isLoading={isSubmitting}
            >
              {isSubmitting ? 'Changing Password...' : 'Change Password'}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  )
}