import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { RSVPForm } from './RSVPForm'
import { Event, RSVPStatus } from '../../types'
import { rsvpToEvent } from '../../services/eventService'
import toast from 'react-hot-toast'

interface RSVPComponentProps {
  event: Event
  onRSVPUpdate?: () => void
}

export const RSVPComponent: React.FC<RSVPComponentProps> = ({
  event,
  onRSVPUpdate
}) => {
  const { user } = useAuth()
  const [showRSVPForm, setShowRSVPForm] = useState(false)
  const [isRSVPing, setIsRSVPing] = useState(false)

  if (!user) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please log in to RSVP to this event.</p>
          <Button onClick={() => window.location.href = '/login'}>
            Log In
          </Button>
        </div>
      </Card>
    )
  }

  const currentUserId = user.uid
  const currentRSVP = event.attendees[currentUserId]
  const hasRSVP = !!currentRSVP

  // Check if event is in the past
  const isPastEvent = new Date(event.dateTime) < new Date()

  const handleRSVP = async (status: RSVPStatus, guestCount: number) => {
    try {
      setIsRSVPing(true)
      await rsvpToEvent(event.id, currentUserId, { status, guestCount })
      toast.success('RSVP updated successfully!')
      setShowRSVPForm(false)
      onRSVPUpdate?.()
    } catch (error: any) {
      console.error('RSVP error:', error)
      toast.error(error.message || 'Failed to update RSVP')
      throw error
    } finally {
      setIsRSVPing(false)
    }
  }

  const getRSVPStatusText = () => {
    if (!hasRSVP) return 'Not responded yet'
    switch (currentRSVP.status) {
      case 'going': return 'Going'
      case 'maybe': return 'Maybe'
      case 'not_going': return 'Not going'
      default: return 'Unknown'
    }
  }

  const getRSVPStatusColor = () => {
    if (!hasRSVP) return 'bg-gray-100 text-gray-800'
    switch (currentRSVP.status) {
      case 'going': return 'bg-green-100 text-green-800'
      case 'maybe': return 'bg-yellow-100 text-yellow-800'
      case 'not_going': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAttendeeCount = () => {
    return Object.values(event.attendees).reduce((total, attendee) => {
      if (attendee.status === 'going') {
        return total + 1 + attendee.guestCount
      }
      return total
    }, 0)
  }

  const attendeeCount = getAttendeeCount()
  const isEventFull = event.capacity && attendeeCount >= event.capacity
  const isOnWaitlist = hasRSVP && currentRSVP.status === 'going' && isEventFull

  if (showRSVPForm) {
    return (
      <RSVPForm
        event={event}
        currentUserId={currentUserId}
        onRSVP={handleRSVP}
        onCancel={() => setShowRSVPForm(false)}
      />
    )
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Your RSVP</h3>
          {hasRSVP && !isPastEvent && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRSVPForm(true)}
              disabled={isRSVPing}
            >
              Change Response
            </Button>
          )}
        </div>

        {/* Current RSVP Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">Status:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRSVPStatusColor()}`}>
              {getRSVPStatusText()}
              {isOnWaitlist && ' (Waitlist)'}
            </span>
          </div>
          {hasRSVP && currentRSVP.guestCount > 0 && (
            <span className="text-sm text-gray-600">
              +{currentRSVP.guestCount} guest{currentRSVP.guestCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Event Capacity Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Attendees:</span>
              <span className="ml-2 font-medium">{attendeeCount}</span>
            </div>
            {event.capacity && (
              <div>
                <span className="text-gray-600">Capacity:</span>
                <span className="ml-2 font-medium">{event.capacity}</span>
              </div>
            )}
          </div>
          {event.capacity && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min((attendeeCount / event.capacity) * 100, 100)}%`
                  }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {event.capacity - attendeeCount > 0
                  ? `${event.capacity - attendeeCount} spots left`
                  : 'Event is full'
                }
              </p>
            </div>
          )}
        </div>

        {/* RSVP Button */}
        {!isPastEvent && (
          <div className="pt-2">
            {!hasRSVP ? (
              <Button
                onClick={() => setShowRSVPForm(true)}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isRSVPing}
              >
                RSVP to Event
              </Button>
            ) : (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  RSVP last updated: {new Date(currentRSVP.rsvpAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        )}

        {isPastEvent && (
          <div className="text-center py-2">
            <p className="text-sm text-gray-500">This event has already occurred</p>
          </div>
        )}
      </div>
    </Card>
  )
}