import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { searchEvents } from '../services/eventService'
import { EventSummary, EventFilters } from '../types'
import toast from 'react-hot-toast'

const EventsPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [events, setEvents] = useState<EventSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [hasMore, setHasMore] = useState(false)

  // Set default filter based on user login status
  useEffect(() => {
    if (user) {
      setSelectedStatus('all') // Show all events for logged-in users so they can see their drafts
    } else {
      setSelectedStatus('published') // Show only published events for anonymous users
    }
  }, [user])

  const eventTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'birthday', label: 'Birthday' },
    { value: 'potluck', label: 'Potluck' },
    { value: 'farewell', label: 'Farewell' },
    { value: 'celebration', label: 'Celebration' },
    { value: 'other', label: 'Other' }
  ]

  useEffect(() => {
    loadEvents()
  }, [searchQuery, selectedType, selectedStatus, user])

  const loadEvents = async () => {
    try {
      setIsLoading(true)
      console.log('🔍 Loading events with filters:', { selectedStatus, selectedType, searchQuery })

      const filters: EventFilters = {}

      // Apply status filter
      if (selectedStatus !== 'all') {
        filters.status = [selectedStatus as any]
        console.log('📋 Applying status filter:', filters.status)
      } else {
        console.log('📋 No status filter applied (showing all events)')
      }

      if (selectedType !== 'all') {
        filters.type = [selectedType as any]
      }

      if (searchQuery.trim()) {
        filters.location = searchQuery // Simplified search - could be enhanced
      }

      console.log('🔍 Final filters:', filters)
      const result = await searchEvents(filters, 20)
      console.log('✅ Search result:', { eventsCount: result.events.length, hasMore: result.hasMore, events: result.events })

      setEvents(result.events)
      setHasMore(result.hasMore)
    } catch (error) {
      console.error('❌ Error loading events:', error)
      toast.error('Failed to load events')
    } finally {
      setIsLoading(false)
    }
  }

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return 'Today'
    } else if (diffDays === 1) {
      return 'Tomorrow'
    } else if (diffDays < 7) {
      return `In ${diffDays} days`
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      })
    }
  }

  const getAttendeeStatus = (event: EventSummary) => {
    const capacity = event.capacity || 0
    const attendees = event.attendeeCount

    if (capacity === 0) return null
    if (attendees >= capacity) return 'Full'
    if (attendees >= capacity * 0.8) return 'Almost Full'

    return `${attendees}/${capacity} attending`
  }

  const EventCard = ({ event }: { event: EventSummary }) => (
    <div
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => navigate(`/events/${event.id}`)}
    >
      <Card className="h-full">
        {event.coverImage && (
          <div className="h-48 bg-gray-200 relative">
            <img
              src={event.coverImage}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                event.visibility === 'public'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {event.visibility}
              </span>
            </div>
          </div>
        )}

        <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {event.title}
          </h3>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ml-2 flex-shrink-0 ${
            event.type === 'birthday' ? 'bg-pink-100 text-pink-800' :
            event.type === 'potluck' ? 'bg-orange-100 text-orange-800' :
            event.type === 'farewell' ? 'bg-blue-100 text-blue-800' :
            event.type === 'celebration' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {event.type}
          </span>
        </div>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center">
            <span className="mr-2">📅</span>
            <span>{formatEventDate(event.dateTime)}</span>
          </div>

          <div className="flex items-center">
            <span className="mr-2">📍</span>
            <span className="truncate">{event.location.name}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="mr-2">👥</span>
              <span>{getAttendeeStatus(event) || `${event.attendeeCount} attending`}</span>
            </div>
            {event.status === 'published' && (
              <Button size="sm" variant="outline" className="text-xs">
                View Details
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  </div>
  )

  const EventListItem = ({ event }: { event: EventSummary }) => (
    <div
      className="cursor-pointer"
      onClick={() => navigate(`/events/${event.id}`)}
    >
      <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-4">
        {event.coverImage ? (
          <img
            src={event.coverImage}
            alt={event.title}
            className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
          />
        ) : (
          <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center">
            📅
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {event.title}
            </h3>
            <div className="flex items-center space-x-2 ml-4">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                event.type === 'birthday' ? 'bg-pink-100 text-pink-800' :
                event.type === 'potluck' ? 'bg-orange-100 text-orange-800' :
                event.type === 'farewell' ? 'bg-blue-100 text-blue-800' :
                event.type === 'celebration' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {event.type}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                event.visibility === 'public'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {event.visibility}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
            <span>📅 {formatEventDate(event.dateTime)}</span>
            <span>📍 {event.location.name}</span>
            <span>👥 {getAttendeeStatus(event) || `${event.attendeeCount} attending`}</span>
          </div>
        </div>

        <div className="flex-shrink-0">
          <Button size="sm" variant="outline">
            View Details
          </Button>
        </div>
      </div>
    </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600">Discover and join community events</p>
        </div>
        <Button onClick={() => navigate('/events/create')} className="bg-orange-500 hover:bg-orange-600">
          📅 Create Event
        </Button>
      </div>

      {/* Filters and Search */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search events by location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
            >
              {eventTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="published">Published Events</option>
              <option value="all">All Events</option>
            </select>

            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant={viewMode === 'grid' ? 'primary' : 'outline'}
                onClick={() => setViewMode('grid')}
              >
                Grid
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'primary' : 'outline'}
                onClick={() => setViewMode('list')}
              >
                List
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Events Display */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : events.length > 0 ? (
        <>
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              Showing {events.length} event{events.length !== 1 ? 's' : ''}
              {hasMore && ' (more available)'}
            </p>
          </div>

          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }>
            {events.map(event => (
              viewMode === 'grid'
                ? <EventCard key={event.id} event={event} />
                : <EventListItem key={event.id} event={event} />
            ))}
          </div>

          {hasMore && (
            <div className="text-center py-8">
              <Button variant="outline" onClick={loadEvents}>
                Load More Events
              </Button>
            </div>
          )}
        </>
      ) : (
        <Card className="p-12">
          <div className="text-center">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No events found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || selectedType !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'Be the first to create an event for the community!'}
            </p>
            <Button onClick={() => navigate('/events/create')} className="bg-orange-500 hover:bg-orange-600">
              Create First Event
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}

export default EventsPage