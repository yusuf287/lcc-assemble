import React, { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'
import { Alert } from '../ui/Alert'

interface AdminStats {
  totalMembers: number
  pendingApprovals: number
  totalEvents: number
  activeEvents: number
  totalRSVPs: number
  systemHealth: 'good' | 'warning' | 'error'
}

interface MemberSummary {
  uid: string
  displayName: string
  email: string
  status: 'pending' | 'approved' | 'suspended'
  role: 'member' | 'admin'
  createdAt: Date
  lastActive?: Date
}

interface EventSummary {
  id: string
  title: string
  organizer: string
  status: 'draft' | 'published' | 'cancelled' | 'completed'
  attendeeCount: number
  createdAt: Date
}

interface AdminDashboardProps {
  onApproveMember?: (memberId: string) => Promise<void>
  onSuspendMember?: (memberId: string) => Promise<void>
  onCancelEvent?: (eventId: string) => Promise<void>
  onViewMemberDetails?: (memberId: string) => void
  onViewEventDetails?: (eventId: string) => void
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onApproveMember,
  onSuspendMember,
  onCancelEvent,
  onViewMemberDetails,
  onViewEventDetails
}) => {
  const [stats, setStats] = useState<AdminStats>({
    totalMembers: 0,
    pendingApprovals: 0,
    totalEvents: 0,
    activeEvents: 0,
    totalRSVPs: 0,
    systemHealth: 'good'
  })
  const [members, setMembers] = useState<MemberSummary[]>([])
  const [events, setEvents] = useState<EventSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'events'>('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null)

  // Mock data for demonstration
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true)

        // Mock stats
        setStats({
          totalMembers: 45,
          pendingApprovals: 3,
          totalEvents: 12,
          activeEvents: 8,
          totalRSVPs: 156,
          systemHealth: 'good'
        })

        // Mock members
        const mockMembers: MemberSummary[] = [
          {
            uid: 'user1',
            displayName: 'Alice Johnson',
            email: 'alice@example.com',
            status: 'pending',
            role: 'member',
            createdAt: new Date('2025-09-15'),
            lastActive: new Date('2025-09-18')
          },
          {
            uid: 'user2',
            displayName: 'Bob Smith',
            email: 'bob@example.com',
            status: 'approved',
            role: 'member',
            createdAt: new Date('2025-09-10'),
            lastActive: new Date('2025-09-19')
          },
          {
            uid: 'user3',
            displayName: 'Carol Davis',
            email: 'carol@example.com',
            status: 'suspended',
            role: 'member',
            createdAt: new Date('2025-09-05'),
            lastActive: new Date('2025-09-16')
          }
        ]
        setMembers(mockMembers)

        // Mock events
        const mockEvents: EventSummary[] = [
          {
            id: 'event1',
            title: 'Community Potluck',
            organizer: 'Bob Smith',
            status: 'published',
            attendeeCount: 25,
            createdAt: new Date('2025-09-17')
          },
          {
            id: 'event2',
            title: 'Book Club Meeting',
            organizer: 'Alice Johnson',
            status: 'draft',
            attendeeCount: 0,
            createdAt: new Date('2025-09-18')
          }
        ]
        setEvents(mockEvents)

      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const handleApproveMember = async (memberId: string) => {
    try {
      setIsSubmitting(memberId)
      await onApproveMember?.(memberId)
      // Update local state
      setMembers(prev => prev.map(member =>
        member.uid === memberId ? { ...member, status: 'approved' as const } : member
      ))
      setStats(prev => ({ ...prev, pendingApprovals: Math.max(0, prev.pendingApprovals - 1) }))
    } catch (error) {
      console.error('Error approving member:', error)
    } finally {
      setIsSubmitting(null)
    }
  }

  const handleSuspendMember = async (memberId: string) => {
    try {
      setIsSubmitting(memberId)
      await onSuspendMember?.(memberId)
      // Update local state
      setMembers(prev => prev.map(member =>
        member.uid === memberId ? { ...member, status: 'suspended' as const } : member
      ))
    } catch (error) {
      console.error('Error suspending member:', error)
    } finally {
      setIsSubmitting(null)
    }
  }

  const handleCancelEvent = async (eventId: string) => {
    try {
      setIsSubmitting(eventId)
      await onCancelEvent?.(eventId)
      // Update local state
      setEvents(prev => prev.map(event =>
        event.id === eventId ? { ...event, status: 'cancelled' as const } : event
      ))
    } catch (error) {
      console.error('Error cancelling event:', error)
    } finally {
      setIsSubmitting(null)
    }
  }

  const filteredMembers = members.filter(member =>
    member.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.organizer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      case 'published': return 'bg-blue-100 text-blue-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'completed': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading dashboard...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Manage community members and events</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            stats.systemHealth === 'good' ? 'bg-green-100 text-green-800' :
            stats.systemHealth === 'warning' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            System: {stats.systemHealth}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                👥
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Members</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMembers}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                ⏳
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingApprovals}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                📅
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Events</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeEvents}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                ✅
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total RSVPs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalRSVPs}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {(['overview', 'members', 'events'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Search */}
        {(activeTab === 'members' || activeTab === 'events') && (
          <div className="flex gap-4">
            <Input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">3 new member registrations pending approval</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Community Potluck event created</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">System health check completed</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  📧 Send community newsletter
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  📊 Generate monthly report
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  ⚙️ System configuration
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Member Management</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMembers.map((member) => (
                    <tr key={member.uid}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {member.displayName}
                          </div>
                          <div className="text-sm text-gray-500">{member.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(member.status)}`}>
                          {member.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.createdAt.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {member.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleApproveMember(member.uid)}
                            disabled={isSubmitting === member.uid}
                            isLoading={isSubmitting === member.uid}
                          >
                            Approve
                          </Button>
                        )}
                        {member.status === 'approved' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSuspendMember(member.uid)}
                            disabled={isSubmitting === member.uid}
                            isLoading={isSubmitting === member.uid}
                          >
                            Suspend
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onViewMemberDetails?.(member.uid)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Event Management</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Organizer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendees
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEvents.map((event) => (
                    <tr key={event.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {event.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {event.organizer}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(event.status)}`}>
                          {event.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {event.attendeeCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {(event.status === 'published' || event.status === 'draft') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelEvent(event.id)}
                            disabled={isSubmitting === event.id}
                            isLoading={isSubmitting === event.id}
                          >
                            Cancel
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onViewEventDetails?.(event.id)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}