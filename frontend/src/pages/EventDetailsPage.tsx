import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { getEvent, rsvpToEvent, claimBringListItem, onEventChange } from '../services/eventService'
import { getUserProfile } from '../services/userService'
import { Event, UserProfile, RSVPStatus } from '../types'
import toast from 'react-hot-toast'

const EventDetailsPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [event, setEvent] = useState<Event | null>(null)
  const [organizerProfile, setOrganizerProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRSVPing, setIsRSVPing] = useState(false)
  const [userRSVPStatus, setUserRSVPStatus] = useState<RSVPStatus | null>(null)
  const [userGuestCount, setUserGuestCount] = useState(0)
  const [bringListItems, setBringListItems] = useState<any[]>([])

  useEffect(() => {
    if (eventId) {
      loadEventDetails()
    }
  }, [eventId])

  useEffect(() => {
    if (event && user) {
      const userAttendee = event.attendees[user.uid]
      if (userAttendee) {
        setUserRSVPStatus(userAttendee.status)
        setUserGuestCount(userAttendee.guestCount)
      }
      setBringListItems(event.bringList.items)
    }
  }, [event, user])

  const loadEventDetails = async (): Promise<(() => void) | undefined> => {
    if (!eventId) return

    try {
      setIsLoading(true)
      const eventData = await getEvent(eventId)

      if (!eventData) {
        toast.error('Event not found')
        navigate('/events')
        return
      }

      setEvent(eventData)

      // Load organizer profile
      const organizer = await getUserProfile(eventData.organizer)
      setOrganizerProfile(organizer)

      // Set up real-time listener
      const unsubscribe = onEventChange(eventId, (updatedEvent) => {
        if (updatedEvent) {
          setEvent(updatedEvent)
        }
      })

      return unsubscribe
    } catch (error) {
      console.error('Error loading event details:', error)
      toast.error('Failed to load event details')
      navigate('/events')
      return
    } finally {
      setIsLoading(false)
    }
  }

  const handleRSVP = async (status: RSVPStatus, guestCount: number = 0) => {
    if (!event || !user) return

    try {
      setIsRSVPing(true)
      const result = await rsvpToEvent(event.id, user.uid, { status, guestCount })

      if (result.success) {
        toast.success(result.message)
        setUserRSVPStatus(status)
        setUserGuestCount(guestCount)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Error RSVPing to event:', error)
      toast.error('Failed to RSVP to event')
    } finally {
      setIsRSVPing(false)
    }
  }

  const handleClaimItem = async (itemId: string) => {
    if (!event || !user) return

    try {
      await claimBringListItem(event.id, itemId, user.uid)
      toast.success('Item claimed successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to claim item')
    }
  }

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const getRSVPButtonText = () => {
    if (!userRSVPStatus) return 'RSVP'
    switch (userRSVPStatus) {
      case 'going': return 'Going'
      case 'maybe': return 'Maybe'
      case 'not_going': return 'Not Going'
      default: return 'RSVP'
    }
  }

  const getRSVPButtonVariant = () => {
    if (!userRSVPStatus) return 'primary'
    return userRSVPStatus === 'going' ? 'primary' : 'outline'
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h2>
        <p className="text-gray-600 mb-6">The event you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => navigate('/events')}>
          Back to Events
        </Button>
      </div>
    )
  }

  const isOrganizer = user?.uid === event.organizer
  const isPastEvent = new Date(event.dateTime) < new Date()

  return (
    <div className="space-y-6">
      {/* Event Header */}
      <div className="relative">
        {event.coverImage && (
          <div className="h-64 md:h-80 bg-gray-200 relative overflow-hidden rounded-lg">
            <img
              src={event.coverImage}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-30" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <div className="flex items-center space-x-2 mb-2">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  event.type === 'birthday' ? 'bg-pink-500' :
                  event.type === 'potluck' ? 'bg-orange-500' :
                  event.type === 'farewell' ? 'bg-blue-500' :
                  event.type === 'celebration' ? 'bg-green-500' :
                  'bg-gray-500'
                }`}>
                  {event.type}
                </span>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  event.visibility === 'public' ? 'bg-green-500' : 'bg-blue-500'
                }`}>
                  {event.visibility}
                </span>
                {event.status === 'published' && (
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-500">
                    Published
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{event.title}</h1>
              <p className="text-lg opacity-90">{event.description}</p>
            </div>
          </div>
        )}

        {!event.coverImage && (
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-8 rounded-lg">
            <div className="flex items-center space-x-2 mb-4">
              <span className={`px-3 py-1 text-sm font-medium rounded-full bg-white bg-opacity-20`}>
                {event.type}
              </span>
              <span className={`px-3 py-1 text-sm font-medium rounded-full bg-white bg-opacity-20`}>
                {event.visibility}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{event.title}</h1>
            <p className="text-lg opacity-90">{event.description}</p>
          </div>
        )}
      </div>

      {/* Event Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        {!isPastEvent && user && (
          <div className="flex space-x-3">
            <Button
              onClick={() => handleRSVP('going', userGuestCount)}
              disabled={isRSVPing}
              className={userRSVPStatus === 'going' ? 'bg-green-500 hover:bg-green-600' : ''}
            >
              {isRSVPing ? 'Updating...' : 'Going'}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleRSVP('maybe', userGuestCount)}
              disabled={isRSVPing}
            >
              Maybe
            </Button>
            <Button
              variant="outline"
              onClick={() => handleRSVP('not_going', 0)}
              disabled={isRSVPing}
            >
              Can't Go
            </Button>
          </div>
        )}

        {isOrganizer && (
          <Button
            variant="outline"
            onClick={() => navigate(`/events/${event.id}/edit`)}
            className="ml-auto"
          >
            Edit Event
          </Button>
        )}
      </div>

      {/* Event Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Details</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <span className="text-2xl mr-3">📅</span>
                <div>
                  <p className="font-medium">{formatDateTime(event.dateTime)}</p>
                  <p className="text-sm text-gray-600">Duration: {event.duration} minutes</p>
                </div>
              </div>

              <div className="flex items-center">
                <span className="text-2xl mr-3">📍</span>
                <div>
                  <p className="font-medium">{event.location.name}</p>
                  <p className="text-sm text-gray-600">{event.location.address}</p>
                </div>
              </div>

              <div className="flex items-center">
                <span className="text-2xl mr-3">👥</span>
                <div>
                  <p className="font-medium">
                    {Object.keys(event.attendees).length} attending
                    {event.capacity && ` / ${event.capacity} capacity`}
                  </p>
                  {event.capacity && (
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min((Object.keys(event.attendees).length / event.capacity) * 100, 100)}%`
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Bring List */}
          {event.bringList.enabled && bringListItems.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">What to Bring</h2>
              <div className="space-y-3">
                {bringListItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{item.item}</p>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      {item.assignedTo && (
                        <p className="text-sm text-orange-600">Claimed by someone</p>
                      )}
                    </div>
                    {!item.assignedTo && user && !isPastEvent && (
                      <Button
                        size="sm"
                        onClick={() => handleClaimItem(item.id)}
                        className="bg-orange-500 hover:bg-orange-600"
                      >
                        Claim
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Photo Gallery */}
          {event.images && event.images.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Photos</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {event.images.map((imageUrl, index) => (
                  <div key={index} className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={`Event photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Organizer Info */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Organizer</h3>
            {organizerProfile && (
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-lg font-medium text-orange-600">
                    {organizerProfile.displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{organizerProfile.displayName}</p>
                  <p className="text-sm text-gray-600">Event Organizer</p>
                </div>
              </div>
            )}
          </Card>

          {/* Attendees */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Attendees ({Object.keys(event.attendees).length})
            </h3>
            <div className="space-y-2">
              {Object.entries(event.attendees).slice(0, 5).map(([uid, attendee]) => (
                <div key={uid} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">?</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Attendee</p>
                      <p className="text-xs text-gray-600">
                        {attendee.status} {attendee.guestCount > 0 && `+${attendee.guestCount}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {Object.keys(event.attendees).length > 5 && (
                <p className="text-sm text-gray-600 text-center">
                  +{Object.keys(event.attendees).length - 5} more attendees
                </p>
              )}
            </div>
          </Card>

          {/* Waitlist */}
          {event.waitlist.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Waitlist ({event.waitlist.length})
              </h3>
              <p className="text-sm text-gray-600">
                This event is at capacity. Join the waitlist for cancellations.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default EventDetailsPage