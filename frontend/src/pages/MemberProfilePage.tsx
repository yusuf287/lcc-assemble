import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Alert } from '../components/ui/Alert'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { User } from '../types'
import { getUserProfile } from '../services/userService'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const MemberProfilePage: React.FC = () => {
  const { memberId } = useParams<{ memberId: string }>()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [member, setMember] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadMemberProfile = async () => {
      if (!memberId) {
        setError('Member ID not provided')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const memberProfile = await getUserProfile(memberId)
        if (!memberProfile) {
          setError('Member not found')
          return
        }

        // Check if user can view this profile
        // For now, allow viewing all approved members
        if (memberProfile.status === 'suspended') {
          setError('This member profile is not available')
          return
        }

        // Convert UserProfile to User (convert date strings to Date objects)
        const memberData: User = {
          ...memberProfile,
          createdAt: new Date(memberProfile.createdAt),
          updatedAt: new Date(memberProfile.updatedAt)
        }

        setMember(memberData)
      } catch (error) {
        console.error('Error loading member profile:', error)
        setError('Failed to load member profile')
      } finally {
        setIsLoading(false)
      }
    }

    loadMemberProfile()
  }, [memberId])

  const handleContact = (method: 'whatsapp' | 'phone' | 'email') => {
    if (!member) return

    let contactUrl = ''
    let successMessage = ''

    switch (method) {
      case 'whatsapp':
        if (member.whatsappNumber && member.privacy?.whatsappVisible) {
          const cleanNumber = member.whatsappNumber.replace(/[\s\-\(\)]/g, '')
          contactUrl = `https://wa.me/${cleanNumber}?text=Hi%20${encodeURIComponent(member.displayName)}!%20I%20saw%20your%20profile%20on%20LCC%20Assemble.`
          successMessage = `Opening WhatsApp to message ${member.displayName}`
        } else {
          toast.error(`${member.displayName} has not made their WhatsApp number visible`)
          return
        }
        break

      case 'phone':
        if (member.phoneNumber && member.privacy?.phoneVisible) {
          contactUrl = `tel:${member.phoneNumber}`
          successMessage = `Calling ${member.displayName}`
        } else {
          toast.error(`${member.displayName} has not made their phone number visible`)
          return
        }
        break

      case 'email':
        contactUrl = `mailto:?subject=Hello%20from%20LCC%20Assemble&body=Hi%20${encodeURIComponent(member.displayName)}!%20I%20saw%20your%20profile%20on%20LCC%20Assemble.`
        successMessage = `Opening email to contact ${member.displayName}`
        break
    }

    if (contactUrl) {
      window.open(contactUrl, '_blank')
      toast.success(successMessage)
    }
  }

  const getInitials = (displayName: string) => {
    return displayName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
        <span className="ml-2 text-gray-600">Loading member profile...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Alert variant="error">
          {error}
        </Alert>
        <div className="text-center">
          <Button onClick={() => navigate('/members')}>
            Back to Members
          </Button>
        </div>
      </div>
    )
  }

  if (!member) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Alert variant="error">
          Member not found
        </Alert>
        <div className="text-center">
          <Button onClick={() => navigate('/members')}>
            Back to Members
          </Button>
        </div>
      </div>
    )
  }

  const isCurrentUser = currentUser?.uid === member.uid

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Member Profile</h1>
        <p className="mt-2 text-gray-600">
          Learn more about {member.displayName}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card className="p-6 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-white">
                {getInitials(member.displayName)}
              </span>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {member.displayName}
            </h2>

            {member.role === 'admin' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mb-4">
                Administrator
              </span>
            )}

            {member.status === 'pending' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mb-4">
                Pending Approval
              </span>
            )}

            {/* Contact Buttons */}
            {!isCurrentUser && (
              <div className="space-y-2 mt-4">
                <Button
                  onClick={() => handleContact('whatsapp')}
                  className="w-full flex items-center justify-center space-x-2"
                  disabled={!member.whatsappNumber || !member.privacy?.whatsappVisible}
                >
                  <span>💬</span>
                  <span>WhatsApp</span>
                </Button>

                <Button
                  onClick={() => handleContact('phone')}
                  variant="outline"
                  className="w-full flex items-center justify-center space-x-2"
                  disabled={!member.phoneNumber || !member.privacy?.phoneVisible}
                >
                  <span>📞</span>
                  <span>Call</span>
                </Button>

                <Button
                  onClick={() => handleContact('email')}
                  variant="outline"
                  className="w-full flex items-center justify-center space-x-2"
                >
                  <span>✉️</span>
                  <span>Email</span>
                </Button>
              </div>
            )}

            {isCurrentUser && (
              <div className="mt-4">
                <Button
                  onClick={() => navigate('/profile')}
                  className="w-full"
                >
                  Edit Profile
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          {member.bio && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">About</h3>
              <p className="text-gray-700 leading-relaxed">{member.bio}</p>
            </Card>
          )}

          {/* Interests */}
          {member.interests && member.interests.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {member.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Dietary Preferences */}
          {member.dietaryPreferences && member.dietaryPreferences.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Dietary Preferences</h3>
              <div className="flex flex-wrap gap-2">
                {member.dietaryPreferences.map((preference, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                  >
                    {preference}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Availability */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Availability</h3>
            <div className="space-y-2">
              {member.defaultAvailability?.weekdays && (
                <div className="flex items-center text-gray-700">
                  <span className="w-4 h-4 mr-2">📅</span>
                  Available on weekdays
                </div>
              )}
              {member.defaultAvailability?.evenings && (
                <div className="flex items-center text-gray-700">
                  <span className="w-4 h-4 mr-2">🌅</span>
                  Available in evenings
                </div>
              )}
              {member.defaultAvailability?.weekends && (
                <div className="flex items-center text-gray-700">
                  <span className="w-4 h-4 mr-2">🏖️</span>
                  Available on weekends
                </div>
              )}
              {!member.defaultAvailability?.weekdays &&
               !member.defaultAvailability?.evenings &&
               !member.defaultAvailability?.weekends && (
                <div className="flex items-center text-gray-700">
                  <span className="w-4 h-4 mr-2">🔄</span>
                  Flexible availability
                </div>
              )}
            </div>
          </Card>

          {/* Contact Information (only visible if privacy allows) */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
            <div className="space-y-3">
              {member.privacy?.phoneVisible && member.phoneNumber && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-700">
                    <span className="w-4 h-4 mr-2">📞</span>
                    Phone
                  </div>
                  <span className="text-gray-900">{member.phoneNumber}</span>
                </div>
              )}

              {member.privacy?.whatsappVisible && member.whatsappNumber && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-700">
                    <span className="w-4 h-4 mr-2">💬</span>
                    WhatsApp
                  </div>
                  <span className="text-gray-900">{member.whatsappNumber}</span>
                </div>
              )}

              {member.privacy?.addressVisible && member.address && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-700">
                    <span className="w-4 h-4 mr-2">📍</span>
                    Address
                  </div>
                  <div className="text-right text-gray-900">
                    <div>{member.address.street}</div>
                    <div>{member.address.city}, {member.address.postalCode}</div>
                  </div>
                </div>
              )}

              {(!member.privacy?.phoneVisible || !member.phoneNumber) &&
               (!member.privacy?.whatsappVisible || !member.whatsappNumber) &&
               (!member.privacy?.addressVisible || !member.address) && (
                <p className="text-gray-500 italic">
                  {member.displayName} has chosen to keep their contact information private.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Back Button */}
      <div className="text-center">
        <Button
          variant="outline"
          onClick={() => navigate('/members')}
        >
          Back to Members
        </Button>
      </div>
    </div>
  )
}

export default MemberProfilePage