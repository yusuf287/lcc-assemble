import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { searchEvents, getUserEvents } from '../services/eventService'
import { searchUsers, getUserCountByStatus } from '../services/userService'
import { EventSummary, UserSummary } from '../types'
import toast from 'react-hot-toast'

const DashboardPage: React.FC = () => {
  const { user, userProfile } = useAuth()
  const navigate = useNavigate()
  const [upcomingEvents, setUpcomingEvents] = useState<EventSummary[]>([])
  const [recentMembers, setRecentMembers] = useState<UserSummary[]>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(true)
  const [isLoadingMembers, setIsLoadingMembers] = useState(true)
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalMembers: 0,
    myEvents: 0
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Load upcoming events
      setIsLoadingEvents(true)
      const eventsResult = await searchEvents({ status: ['published'] }, 3)
      setUpcomingEvents(eventsResult.events)

      // Load recent members
      setIsLoadingMembers(true)
      const membersResult = await searchUsers({ status: 'approved' }, 5)
      setRecentMembers(membersResult.users)

      // Load stats
      const [userEvents, userStats] = await Promise.all([
        getUserEvents(user?.uid || ''),
        getUserCountByStatus()
      ])

      setStats({
        totalEvents: eventsResult.totalCount,
        totalMembers: userStats.approved + userStats.pending + userStats.suspended,
        myEvents: userEvents.length
      })

      setStats({
        totalEvents: eventsResult.totalCount,
        totalMembers: userStats.approved + userStats.pending + userStats.suspended,
        myEvents: userEvents.length
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoadingEvents(false)
      setIsLoadingMembers(false)
    }
  }

  const formatEventDate = (dateTime: any) => {
    if (!dateTime) return 'TBD'
    const date = dateTime.toDate ? dateTime.toDate() : new Date(dateTime)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getGreeting()}, {userProfile?.displayName || user?.displayName || 'Member'}! 👋
          </h1>
          <p className="text-gray-600">Welcome to your LCC Assemble dashboard</p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={() => navigate('/events/create')} className="bg-orange-500 hover:bg-orange-600">
            📅 Create Event
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{stats.totalEvents}</h3>
              <p className="text-sm text-gray-600">Total Events</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{stats.totalMembers}</h3>
              <p className="text-sm text-gray-600">Community Members</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <span className="text-2xl">📅</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{stats.myEvents}</h3>
              <p className="text-sm text-gray-600">My Events</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/events/create')}
              className="w-full justify-start bg-orange-500 hover:bg-orange-600"
            >
              📅 Create New Event
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/events')}
              className="w-full justify-start"
            >
              📋 Browse All Events
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/members')}
              className="w-full justify-start"
            >
              👥 Find Members
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/profile')}
              className="w-full justify-start"
            >
              ⚙️ Update Profile
            </Button>
          </div>
        </Card>

        {/* Upcoming Events */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
            <Link
              to="/events"
              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              View all →
            </Link>
          </div>

          {isLoadingEvents ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingEvents.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  <h4 className="font-medium text-gray-900 text-sm">{event.title}</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    {formatEventDate(event.dateTime)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {event.location?.name || 'Location TBD'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-3">No upcoming events</p>
              <Button
                size="sm"
                onClick={() => navigate('/events/create')}
                className="bg-orange-500 hover:bg-orange-600"
              >
                Create First Event
              </Button>
            </div>
          )}
        </Card>

        {/* Recent Members */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">New Members</h3>
            <Link
              to="/members"
              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              View all →
            </Link>
          </div>

          {isLoadingMembers ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : recentMembers.length > 0 ? (
            <div className="space-y-3">
              {recentMembers.slice(0, 4).map((member) => (
                <div
                  key={member.uid}
                  className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                  onClick={() => navigate(`/members/${member.uid}`)}
                >
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-orange-600">
                      {member.displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {member.displayName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {member.interests.length > 0 ? member.interests[0] : 'New member'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No recent members</p>
            </div>
          )}
        </Card>
      </div>

      {/* Community Stats */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Community Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.totalEvents}</div>
            <div className="text-sm text-gray-600">Events Created</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.totalMembers}</div>
            <div className="text-sm text-gray-600">Active Members</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.myEvents}</div>
            <div className="text-sm text-gray-600">Your Events</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {upcomingEvents.length}
            </div>
            <div className="text-sm text-gray-600">Events This Month</div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default DashboardPage