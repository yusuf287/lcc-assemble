import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { searchUsers } from '../../services/userService'
import { UserSummary } from '../../types'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { LoadingSpinner } from '../ui/LoadingSpinner'

interface MemberSelectorProps {
  selectedMembers: string[]
  onMembersChange: (members: string[]) => void
  maxSelections?: number
}

const MemberSelector: React.FC<MemberSelectorProps> = ({
  selectedMembers,
  onMembersChange,
  maxSelections = 50
}) => {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [members, setMembers] = useState<UserSummary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadMembers()
  }, [searchQuery])

  const loadMembers = async () => {
    try {
      setIsLoading(true)
      setError('')

      const result = await searchUsers({
        status: 'approved'
      }, 50)

      // Filter out current user, apply search filter, and sort by display name
      let filteredMembers = result.users
        .filter(member => member.uid !== user?.uid)

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        filteredMembers = filteredMembers.filter(member =>
          member.displayName.toLowerCase().includes(query) ||
          member.interests.some(interest => interest.toLowerCase().includes(query))
        )
      }

      filteredMembers = filteredMembers.sort((a, b) => a.displayName.localeCompare(b.displayName))

      setMembers(filteredMembers)
    } catch (error) {
      console.error('Error loading members:', error)
      setError('Failed to load members')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMember = (memberId: string) => {
    if (selectedMembers.includes(memberId)) {
      // Remove member
      onMembersChange(selectedMembers.filter(id => id !== memberId))
    } else {
      // Add member (check max selections)
      if (selectedMembers.length >= maxSelections) {
        setError(`You can select a maximum of ${maxSelections} members`)
        return
      }
      onMembersChange([...selectedMembers, memberId])
    }
  }

  const removeMember = (memberId: string) => {
    onMembersChange(selectedMembers.filter(id => id !== memberId))
  }

  const getSelectedMemberDetails = (memberId: string): UserSummary | undefined => {
    return members.find(member => member.uid === memberId)
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div>
        <Input
          type="text"
          placeholder="Search members by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Selected Members */}
      {selectedMembers.length > 0 && (
        <Card className="p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Selected Members ({selectedMembers.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedMembers.map(memberId => {
              const member = getSelectedMemberDetails(memberId)
              return (
                <div
                  key={memberId}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800"
                >
                  <span className="mr-2">
                    {member?.displayName || 'Unknown Member'}
                  </span>
                  <button
                    onClick={() => removeMember(memberId)}
                    className="text-orange-600 hover:text-orange-800"
                    aria-label={`Remove ${member?.displayName || 'member'}`}
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Member List */}
      <Card className="p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Available Members
        </h4>

        {error && (
          <div className="text-sm text-red-600 mb-3 p-2 bg-red-50 rounded">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : members.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {members.map(member => {
              const isSelected = selectedMembers.includes(member.uid)
              return (
                <div
                  key={member.uid}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-orange-50 border-orange-300'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => toggleMember(member.uid)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-orange-600">
                        {member.displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {member.displayName}
                      </p>
                      {member.interests.length > 0 && (
                        <p className="text-xs text-gray-500">
                          {member.interests.slice(0, 2).join(', ')}
                          {member.interests.length > 2 && '...'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isSelected && (
                      <span className="text-orange-600 text-sm font-medium">
                        Selected
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant={isSelected ? "secondary" : "outline"}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleMember(member.uid)
                      }}
                    >
                      {isSelected ? 'Remove' : 'Add'}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            {searchQuery ? 'No members found matching your search.' : 'No members available.'}
          </div>
        )}
      </Card>

      {/* Selection Summary */}
      <div className="text-sm text-gray-600">
        {selectedMembers.length === 0 ? (
          <p>No members selected. This will be a public event visible to all community members.</p>
        ) : (
          <p>
            {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected.
            Only these members will be able to see and RSVP to this private event.
          </p>
        )}
      </div>
    </div>
  )
}

export default MemberSelector