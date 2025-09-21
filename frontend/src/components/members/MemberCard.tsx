import React from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { UserSummary } from '../../types'

interface MemberCardProps {
  member: UserSummary
  currentUserId?: string
  onViewProfile?: (member: UserSummary) => void
  onContact?: (member: UserSummary, method: 'whatsapp' | 'phone' | 'email') => void
  compact?: boolean
  showContactButtons?: boolean
}

export const MemberCard: React.FC<MemberCardProps> = ({
  member,
  currentUserId,
  onViewProfile,
  onContact,
  compact = false,
  showContactButtons = true
}) => {
  const isCurrentUser = currentUserId === member.uid

  const getInitials = (displayName: string) => {
    return displayName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleContact = (method: 'whatsapp' | 'phone' | 'email') => {
    // Let the parent component handle the contact logic with real user data and privacy checks
    onContact?.(member, method)
  }

  if (compact) {
    return (
      <Card className="p-3 hover:shadow-md transition-shadow">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-orange-600">
              {getInitials(member.displayName)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {member.displayName}
              {isCurrentUser && <span className="text-xs text-gray-500 ml-1">(You)</span>}
            </h4>
            {member.interests.length > 0 && (
              <p className="text-xs text-gray-600 truncate">
                {member.interests.slice(0, 2).join(', ')}
                {member.interests.length > 2 && ` +${member.interests.length - 2} more`}
              </p>
            )}
          </div>
          {showContactButtons && !isCurrentUser && (
            <div className="flex space-x-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleContact('whatsapp')}
                className="p-1 h-8 w-8"
                title="WhatsApp"
              >
                💬
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleContact('email')}
                className="p-1 h-8 w-8"
                title="Email"
              >
                ✉️
              </Button>
            </div>
          )}
        </div>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        {/* Member Header */}
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-bold text-white">
              {getInitials(member.displayName)}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {member.displayName}
              </h3>
              {isCurrentUser && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  You
                </span>
              )}
            </div>

            {member.interests.length > 0 && (
              <div className="mb-3">
                <p className="text-sm text-gray-600 mb-2">Interests:</p>
                <div className="flex flex-wrap gap-1">
                  {member.interests.slice(0, 4).map((interest, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
                    >
                      {interest}
                    </span>
                  ))}
                  {member.interests.length > 4 && (
                    <span className="text-xs text-gray-500">
                      +{member.interests.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Contact Buttons */}
            {showContactButtons && !isCurrentUser && (
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleContact('whatsapp')}
                  className="flex items-center space-x-1"
                >
                  <span>💬</span>
                  <span>WhatsApp</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleContact('phone')}
                  className="flex items-center space-x-1"
                >
                  <span>📞</span>
                  <span>Call</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleContact('email')}
                  className="flex items-center space-x-1"
                >
                  <span>✉️</span>
                  <span>Email</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Button
            onClick={() => onViewProfile?.(member)}
            className="w-full"
            variant={isCurrentUser ? "outline" : "primary"}
          >
            {isCurrentUser ? 'Edit Profile' : 'View Profile'}
          </Button>
        </div>
      </div>
    </Card>
  )
}