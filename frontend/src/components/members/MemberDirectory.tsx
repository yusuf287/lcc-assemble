import React, { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card } from '../ui/Card'
import { Alert } from '../ui/Alert'
import { UserSummary, UserFilters } from '../../types'

interface MemberDirectoryProps {
  onMemberSelect?: (member: UserSummary) => void
  onContactMember?: (member: UserSummary, method: 'whatsapp' | 'phone' | 'email') => void
  currentUserId?: string
}

export const MemberDirectory: React.FC<MemberDirectoryProps> = ({
  onMemberSelect,
  onContactMember,
  currentUserId
}) => {
  const [members, setMembers] = useState<UserSummary[]>([])
  const [filteredMembers, setFilteredMembers] = useState<UserSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<UserFilters>({})
  const [showFilters, setShowFilters] = useState(false)

  // Mock data for demonstration - in real app, this would come from API
  useEffect(() => {
    const loadMembers = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Mock member data
        const mockMembers: UserSummary[] = [
          {
            uid: 'user1',
            displayName: 'Alice Johnson',
            profileImage: 'https://via.placeholder.com/100',
            interests: ['Cooking', 'Gardening', 'Book Club'],
            defaultAvailability: { weekdays: true, evenings: false, weekends: true }
          },
          {
            uid: 'user2',
            displayName: 'Bob Smith',
            profileImage: 'https://via.placeholder.com/100',
            interests: ['Photography', 'Hiking', 'Cooking'],
            defaultAvailability: { weekdays: false, evenings: true, weekends: true }
          },
          {
            uid: 'user3',
            displayName: 'Carol Davis',
            profileImage: 'https://via.placeholder.com/100',
            interests: ['Yoga', 'Meditation', 'Book Club'],
            defaultAvailability: { weekdays: true, evenings: true, weekends: false }
          },
          {
            uid: 'user4',
            displayName: 'David Wilson',
            profileImage: 'https://via.placeholder.com/100',
            interests: ['Music', 'Photography', 'Hiking'],
            defaultAvailability: { weekdays: false, evenings: false, weekends: true }
          }
        ]

        setMembers(mockMembers)
        setFilteredMembers(mockMembers)
      } catch (err) {
        console.error('Error loading members:', err)
        setError('Failed to load member directory')
      } finally {
        setIsLoading(false)
      }
    }

    loadMembers()
  }, [])

  // Filter and search members
  useEffect(() => {
    let filtered = members

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(member =>
        member.displayName.toLowerCase().includes(query) ||
        member.interests.some(interest => interest.toLowerCase().includes(query))
      )
    }

    // Apply filters
    if (filters.status) {
      filtered = filtered.filter(member => {
        // In real app, this would check member status
        return true // Mock implementation
      })
    }

    if (filters.role) {
      filtered = filtered.filter(member => {
        // In real app, this would check member role
        return true // Mock implementation
      })
    }

    setFilteredMembers(filtered)
  }, [members, searchQuery, filters])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleFilterChange = (filterType: keyof UserFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value || undefined
    }))
  }

  const clearFilters = () => {
    setFilters({})
    setSearchQuery('')
  }

  const getAvailabilityText = (availability: UserSummary['defaultAvailability']) => {
    const parts = []
    if (availability.weekdays) parts.push('Weekdays')
    if (availability.evenings) parts.push('Evenings')
    if (availability.weekends) parts.push('Weekends')
    return parts.length > 0 ? parts.join(', ') : 'Flexible'
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading members...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert type="error" message={error} />
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search by name or interests..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={filters.role || ''}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">All Roles</option>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
          )}

          {(searchQuery || Object.keys(filters).length > 0) && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''} found
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Member List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.map((member) => (
          <Card key={member.uid} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start space-x-4">
              <img
                src={member.profileImage || 'https://via.placeholder.com/60'}
                alt={member.displayName}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {member.displayName}
                </h3>

                <div className="mt-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Available:</span> {getAvailabilityText(member.defaultAvailability)}
                  </p>
                </div>

                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Interests:</p>
                  <div className="flex flex-wrap gap-1">
                    {member.interests.slice(0, 3).map((interest) => (
                      <span
                        key={interest}
                        className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                      >
                        {interest}
                      </span>
                    ))}
                    {member.interests.length > 3 && (
                      <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                        +{member.interests.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  {onMemberSelect && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onMemberSelect(member)}
                      className="flex-1"
                    >
                      View Profile
                    </Button>
                  )}

                  <div className="flex gap-1">
                    {onContactMember && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onContactMember(member, 'whatsapp')}
                          title="WhatsApp"
                        >
                          📱
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onContactMember(member, 'phone')}
                          title="Call"
                        >
                          📞
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onContactMember(member, 'email')}
                          title="Email"
                        >
                          ✉️
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No members found matching your criteria.</p>
          <Button
            variant="outline"
            onClick={clearFilters}
            className="mt-4"
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  )
}