import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MemberDirectory } from '../components/members/MemberDirectory'
import { UserSummary } from '../types'
import { getUserProfile } from '../services/userService'
import toast from 'react-hot-toast'

const MembersPage: React.FC = () => {
  const navigate = useNavigate()
  const [selectedMember, setSelectedMember] = useState<UserSummary | null>(null)

  const handleMemberSelect = (member: UserSummary) => {
    setSelectedMember(member)
    // Navigate to member profile page
    navigate(`/members/${member.uid}`)
  }

  const handleContactMember = async (member: UserSummary, method: 'whatsapp' | 'phone' | 'email') => {
    try {
      // Fetch the full user profile to get contact information and privacy settings
      const userProfile = await getUserProfile(member.uid)

      if (!userProfile) {
        toast.error('Unable to load member contact information')
        return
      }

      let contactUrl = ''
      let successMessage = ''
      let isContactAllowed = false

      switch (method) {
        case 'whatsapp':
          if (userProfile.whatsappNumber && userProfile.privacy?.whatsappVisible) {
            // Clean the WhatsApp number (remove spaces, parentheses, etc.)
            const cleanNumber = userProfile.whatsappNumber.replace(/[\s\-\(\)]/g, '')
            contactUrl = `https://wa.me/${cleanNumber}?text=Hi%20${encodeURIComponent(member.displayName)}!%20I%20found%20you%20through%20LCC%20Assemble.`
            successMessage = `Opening WhatsApp to message ${member.displayName}`
            isContactAllowed = true
          } else {
            toast.error(`${member.displayName} has not made their WhatsApp number visible`)
            return
          }
          break

        case 'phone':
          if (userProfile.phoneNumber && userProfile.privacy?.phoneVisible) {
            contactUrl = `tel:${userProfile.phoneNumber}`
            successMessage = `Calling ${member.displayName}`
            isContactAllowed = true
          } else {
            toast.error(`${member.displayName} has not made their phone number visible`)
            return
          }
          break

        case 'email':
          // Email is always available from Firebase Auth, but we'll use a generic contact
          contactUrl = `mailto:?subject=Hello%20from%20LCC%20Assemble&body=Hi%20${encodeURIComponent(member.displayName)}!%20I%20found%20you%20through%20LCC%20Assemble.`
          successMessage = `Opening email to contact ${member.displayName}`
          isContactAllowed = true
          break
      }

      if (isContactAllowed && contactUrl) {
        window.open(contactUrl, '_blank')
        toast.success(successMessage)
      }
    } catch (error) {
      console.error('Error contacting member:', error)
      toast.error('Unable to contact member. Please try again.')
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Community Members</h1>
        <p className="mt-2 text-gray-600">
          Connect with fellow community members and discover shared interests
        </p>
      </div>

      {/* Member Directory */}
      <MemberDirectory
        onMemberSelect={handleMemberSelect}
        onContactMember={handleContactMember}
      />

      {/* Community Stats */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">Join Our Growing Community</h3>
          <p className="text-orange-100 mb-4">
            Connect with neighbors, share interests, and build lasting relationships
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">50+</div>
              <div className="text-orange-200">Active Members</div>
            </div>
            <div>
              <div className="text-2xl font-bold">25+</div>
              <div className="text-orange-200">Events This Month</div>
            </div>
            <div>
              <div className="text-2xl font-bold">15+</div>
              <div className="text-orange-200">Shared Interests</div>
            </div>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">How to Connect</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">📱 WhatsApp</h4>
            <p>Quick messaging for urgent communications and event coordination</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">📞 Phone</h4>
            <p>Direct calls for immediate assistance or detailed discussions</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">✉️ Email</h4>
            <p>Formal communications and sharing detailed information</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">👥 In-Person</h4>
            <p>Meet at community events and build personal connections</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MembersPage