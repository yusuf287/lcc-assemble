import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Alert } from '../components/ui/Alert'
import { searchUsers, approveUser, suspendUser, getUserCountByStatus, getUserProfile } from '../services/userService'
import { searchEvents } from '../services/eventService'
import { UserSummary, UserProfile, EventSummary } from '../types'
import toast from 'react-hot-toast'

const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth()
  const [pendingMembers, setPendingMembers] = useState<UserSummary[]>([])
  const [allMembers, setAllMembers] = useState<UserSummary[]>([])
  const [memberDetails, setMemberDetails] = useState<Record<string, UserProfile>>({})
  const [events, setEvents] = useState<EventSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalMembers: 0,
    pendingMembers: 0,
    approvedMembers: 0,
    suspendedMembers: 0,
    totalEvents: 0,
    publishedEvents: 0
  })

  useEffect(() => {
    loadAdminData()
  }, [])

  const loadAdminData = async () => {
    try {
      setIsLoading(true)

      // Load all members
      const membersResult = await searchUsers({}, 1000) // Get all members
      setAllMembers(membersResult.users)

      // Load pending members specifically
      const pendingResult = await searchUsers({ status: 'pending' }, 100)
      setPendingMembers(pendingResult.users)

      // Load events
      const eventsResult = await searchEvents({}, 100)
      setEvents(eventsResult.events)

      // Calculate stats using the getUserCountByStatus function
      const memberStats = await getUserCountByStatus()

      const eventStats = eventsResult.events.reduce(
        (acc, event) => {
          acc.totalEvents++
          if (event.status === 'published') {
            acc.publishedEvents++
          }
          return acc
        },
        { totalEvents: 0, publishedEvents: 0 }
      )

      setStats({
        totalMembers: memberStats.pending + memberStats.approved + memberStats.suspended,
        pendingMembers: memberStats.pending,
        approvedMembers: memberStats.approved,
        suspendedMembers: memberStats.suspended,
        ...eventStats
      })
    } catch (error) {
      console.error('Error loading admin data:', error)
      toast.error('Failed to load admin data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApproveMember = async (memberId: string) => {
    try {
      setIsActionLoading(memberId)
      await approveUser(memberId)
      toast.success('Member approved successfully')

      // Update local state
      setPendingMembers(prev => prev.filter(m => m.uid !== memberId))
      setStats(prev => ({
        ...prev,
        pendingMembers: prev.pendingMembers - 1,
        approvedMembers: prev.approvedMembers + 1
      }))

      // Update member details
      const updatedProfile = await getUserProfile(memberId)
      if (updatedProfile) {
        setMemberDetails(prev => ({ ...prev, [memberId]: updatedProfile }))
      }
    } catch (error) {
      console.error('Error approving member:', error)
      toast.error('Failed to approve member')
    } finally {
      setIsActionLoading(null)
    }
  }

  const handleSuspendMember = async (memberId: string) => {
    try {
      setIsActionLoading(memberId)
      await suspendUser(memberId)
      toast.success('Member suspended')

      // Update local state
      setStats(prev => ({
        ...prev,
        approvedMembers: prev.approvedMembers - 1,
        suspendedMembers: prev.suspendedMembers + 1
      }))

      // Update member details
      const updatedProfile = await getUserProfile(memberId)
      if (updatedProfile) {
        setMemberDetails(prev => ({ ...prev, [memberId]: updatedProfile }))
      }
    } catch (error) {
      console.error('Error suspending member:', error)
      toast.error('Failed to suspend member')
    } finally {
      setIsActionLoading(null)
    }
  }

  const handleReactivateMember = async (memberId: string) => {
    try {
      setIsActionLoading(memberId)
      await approveUser(memberId)
      toast.success('Member reactivated')

      // Update local state
      setStats(prev => ({
        ...prev,
        suspendedMembers: prev.suspendedMembers - 1,
        approvedMembers: prev.approvedMembers + 1
      }))

      // Update member details
      const updatedProfile = await getUserProfile(memberId)
      if (updatedProfile) {
        setMemberDetails(prev => ({ ...prev, [memberId]: updatedProfile }))
      }
    } catch (error) {
      console.error('Error reactivating member:', error)
      toast.error('Failed to reactivate member')
    } finally {
      setIsActionLoading(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">Manage community members and monitor activity</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{stats.totalMembers}</h3>
              <p className="text-sm text-gray-600">Total Members</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <span className="text-2xl">⏳</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{stats.pendingMembers}</h3>
              <p className="text-sm text-gray-600">Pending Approval</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{stats.approvedMembers}</h3>
              <p className="text-sm text-gray-600">Active Members</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <span className="text-2xl">📅</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{stats.totalEvents}</h3>
              <p className="text-sm text-gray-600">Total Events</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Pending Approvals */}
      {pendingMembers.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending Member Approvals</h2>
          <div className="space-y-4">
            {pendingMembers.map((member) => {
              const memberDetail = memberDetails[member.uid]
              return (
                <div key={member.uid} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-orange-600">
                        {member.displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{member.displayName}</h3>
                      {memberDetail && (
                        <>
                          <p className="text-sm text-gray-600">{memberDetail.email}</p>
                          <p className="text-xs text-gray-500">
                            Joined {new Date(memberDetail.createdAt).toLocaleDateString()}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleApproveMember(member.uid)}
                      disabled={isActionLoading === member.uid}
                      isLoading={isActionLoading === member.uid}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Member Overview */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Member Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allMembers.slice(0, 9).map((member) => {
            const memberDetail = memberDetails[member.uid]
            return (
              <div key={member.uid} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-orange-600">
                      {member.displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {member.displayName}
                    </p>
                    {memberDetail && (
                      <>
                        <p className="text-xs text-gray-600 truncate">{memberDetail.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(memberDetail.status)}`}>
                            {memberDetail.status}
                          </span>
                          {memberDetail.status === 'approved' && member.uid !== user?.uid && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSuspendMember(member.uid)}
                              disabled={isActionLoading === member.uid}
                              isLoading={isActionLoading === member.uid}
                              className="text-red-600 hover:text-red-800"
                            >
                              Suspend
                            </Button>
                          )}
                          {memberDetail.status === 'suspended' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReactivateMember(member.uid)}
                              disabled={isActionLoading === member.uid}
                              isLoading={isActionLoading === member.uid}
                              className="text-green-600 hover:text-green-800"
                            >
                              Reactivate
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        {allMembers.length > 9 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Showing 9 of {allMembers.length} members
            </p>
          </div>
        )}
      </Card>

      {/* Recent Events */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Events</h2>
        <div className="space-y-3">
          {events.slice(0, 5).map((event) => (
            <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">{event.title}</h3>
                <p className="text-sm text-gray-600">
                  {event.location.name} • {event.attendeeCount} attendees
                </p>
              </div>
              <div className="text-right">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  event.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {event.status}
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(event.dateTime).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
        {events.length === 0 && (
          <p className="text-center text-gray-500 py-8">No events created yet</p>
        )}
      </Card>
    </div>
  )
}

export default AdminDashboardPage