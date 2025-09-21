import React, { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card } from '../ui/Card'
import { Alert } from '../ui/Alert'
import { UserSummary, UserFilters } from '../../types'
import { searchUsers, onUsersChange } from '../../services/userService'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { MemberCard } from './MemberCard'

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

  // Load members from Firebase with real-time updates
  useEffect(() => {
    setIsLoading(true)
    setError(null)

    // Set up real-time listener for approved members
    const unsubscribe = onUsersChange({ status: 'approved' }, (users) => {
      setMembers(users)
      setFilteredMembers(users)
      setIsLoading(false)
    })

    // Cleanup listener on unmount
    return unsubscribe
  }, [])

  // Filter and search members (client-side only since real-time listener handles server-side filtering)
  useEffect(() => {
    let filtered = members

    // Apply client-side search query (for interests and name matching)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(member =>
        member.displayName.toLowerCase().includes(query) ||
        member.interests.some(interest => interest.toLowerCase().includes(query))
      )
    }

    setFilteredMembers(filtered)
  }, [members, searchQuery])

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
          <MemberCard
            key={member.uid}
            member={member}
            currentUserId={currentUserId}
            onViewProfile={onMemberSelect}
            onContact={onContactMember}
            showContactButtons={true}
          />
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