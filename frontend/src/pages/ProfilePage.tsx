import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ProfileForm } from '../components/profile/ProfileForm'
import { PasswordChangeForm } from '../components/profile/PasswordChangeForm'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

const ProfilePage: React.FC = () => {
  const navigate = useNavigate()
  const { userProfile, logout } = useAuth()
  const [showPasswordForm, setShowPasswordForm] = useState(false)

  const handleProfileUpdateSuccess = () => {
    toast.success('Profile updated successfully!')
  }

  const handlePasswordChangeSuccess = () => {
    toast.success('Password changed successfully!')
    setShowPasswordForm(false)
  }

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Logged out successfully')
      navigate('/login')
    } catch (error) {
      toast.error('Failed to log out')
    }
  }

  if (!userProfile) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  const getInitials = (displayName: string) => {
    return displayName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="mt-2 text-gray-600">Manage your account information and preferences</p>
      </div>

      {/* Profile Overview Card */}
      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-white">
              {getInitials(userProfile.displayName)}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">{userProfile.displayName}</h2>
            <p className="text-gray-600">{userProfile.email}</p>
            {userProfile.bio && (
              <p className="text-gray-700 mt-1">{userProfile.bio}</p>
            )}
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
              <span>Role: {userProfile.role}</span>
              <span>Status: {userProfile.status}</span>
              <span>Member since: {new Date(userProfile.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/events')}
            >
              View My Events
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-red-600 hover:text-red-800"
            >
              Logout
            </Button>
          </div>
        </div>
      </Card>

      {/* Profile Form */}
      <ProfileForm onSuccess={handleProfileUpdateSuccess} />

      {/* Password Change Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Password & Security</h3>
            <p className="text-gray-600 mt-1">Change your password to keep your account secure</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowPasswordForm(!showPasswordForm)}
          >
            {showPasswordForm ? 'Cancel' : 'Change Password'}
          </Button>
        </div>

        {showPasswordForm && (
          <div className="mt-6">
            <PasswordChangeForm
              onSuccess={handlePasswordChangeSuccess}
              onCancel={() => setShowPasswordForm(false)}
            />
          </div>
        )}
      </Card>

      {/* Account Statistics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {userProfile.interests?.length || 0}
            </div>
            <div className="text-sm text-gray-600">Interests Listed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {userProfile.dietaryPreferences?.length || 0}
            </div>
            <div className="text-sm text-gray-600">Dietary Preferences</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {userProfile.privacy?.phoneVisible || userProfile.privacy?.whatsappVisible || userProfile.privacy?.addressVisible ? 'Yes' : 'No'}
            </div>
            <div className="text-sm text-gray-600">Contact Info Public</div>
          </div>
        </div>
      </Card>

      {/* Privacy Notice */}
      <Card className="p-6 bg-blue-50">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Privacy & Security</h3>
        <p className="text-blue-800 text-sm mb-3">
          Your privacy is important to us. You control what information is visible to other community members.
          You can change your privacy settings above.
        </p>
        <div className="text-xs text-blue-700">
          <p>• Phone/WhatsApp numbers are only visible if you choose to share them</p>
          <p>• Your email address is never shared with other members</p>
          <p>• You can update your privacy settings at any time</p>
        </div>
      </Card>
    </div>
  )
}

export default ProfilePage