import React, { useState } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card } from '../ui/Card'
import { Alert } from '../ui/Alert'
import { Event, RSVPStatus } from '../../types'

interface RSVPFormProps {
  event: Event
  currentUserId: string
  onRSVP: (status: RSVPStatus, guestCount: number) => Promise<void>
  onCancel?: () => void
}

export const RSVPForm: React.FC<RSVPFormProps> = ({
  event,
  currentUserId,
  onRSVP,
  onCancel
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<RSVPStatus>('going')
  const [guestCount, setGuestCount] = useState(0)

  // Get current RSVP status
  const currentRSVP = event.attendees[currentUserId]
  const hasRSVP = !!currentRSVP

  // Check if event is full
  const isEventFull = event.capacity && Object.keys(event.attendees).length >= event.capacity
  const isOnWaitlist = hasRSVP && currentRSVP.status === 'going' && isEventFull

  const handleStatusChange = (status: RSVPStatus) => {
    setSelectedStatus(status)
    // Reset guest count if not going
    if (status !== 'going') {
      setGuestCount(0)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsSubmitting(true)
      setError(null)

      await onRSVP(selectedStatus, guestCount)
    } catch (err) {
      console.error('RSVP error:', err)
      setError(err instanceof Error ? err.message : 'Failed to update RSVP')
    } finally {
      setIsSubmitting(false)
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

  const getStatusColor = (status: RSVPStatus) => {
    switch (status) {
      case 'going': return 'text-green-600 bg-green-100'
      case 'maybe': return 'text-yellow-600 bg-yellow-100'
      case 'not_going': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const attendeeCount = getAttendeeCount()
  const spotsLeft = event.capacity ? Math.max(0, event.capacity - attendeeCount) : null

  return (
    <Card className="w-full max-w-md mx-auto">
      <div className="p-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">RSVP to Event</h3>
          <p className="text-sm text-gray-600 mt-1">{event.title}</p>
        </div>

        {/* Event Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Attendees:</span>
            <span className="text-sm text-gray-900">{attendeeCount}</span>
          </div>
          {event.capacity && (
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Capacity:</span>
              <span className="text-sm text-gray-900">{event.capacity}</span>
            </div>
          )}
          {spotsLeft !== null && spotsLeft > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Spots Left:</span>
              <span className="text-sm text-green-600">{spotsLeft}</span>
            </div>
          )}
          {spotsLeft === 0 && !isOnWaitlist && (
            <div className="text-center">
              <span className="text-sm text-red-600 font-medium">Event is full</span>
            </div>
          )}
        </div>

        {/* Current RSVP Status */}
        {hasRSVP && (
          <div className="mb-6">
            <div className="text-center">
              <span className="text-sm text-gray-600">Your current response:</span>
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ml-2 ${getStatusColor(currentRSVP.status)}`}>
                {currentRSVP.status === 'going' && 'Going'}
                {currentRSVP.status === 'maybe' && 'Maybe'}
                {currentRSVP.status === 'not_going' && 'Not Going'}
                {isOnWaitlist && ' (Waitlist)'}
              </div>
            </div>
            {currentRSVP.guestCount > 0 && (
              <p className="text-center text-sm text-gray-600 mt-2">
                +{currentRSVP.guestCount} guest{currentRSVP.guestCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert type="error" message={error} />
          )}

          {/* RSVP Status Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Your Response
            </label>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="rsvp-status"
                  value="going"
                  checked={selectedStatus === 'going'}
                  onChange={() => handleStatusChange('going')}
                  disabled={isSubmitting}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Going</span>
              </label>

              <label className="flex items-center">
                <input
                  type="radio"
                  name="rsvp-status"
                  value="maybe"
                  checked={selectedStatus === 'maybe'}
                  onChange={() => handleStatusChange('maybe')}
                  disabled={isSubmitting}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Maybe</span>
              </label>

              <label className="flex items-center">
                <input
                  type="radio"
                  name="rsvp-status"
                  value="not_going"
                  checked={selectedStatus === 'not_going'}
                  onChange={() => handleStatusChange('not_going')}
                  disabled={isSubmitting}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Not Going</span>
              </label>
            </div>
          </div>

          {/* Guest Count */}
          {selectedStatus === 'going' && (
            <Input
              type="number"
              label="Number of Additional Guests"
              value={guestCount.toString()}
              onChange={(e) => setGuestCount(Math.max(0, Number(e.target.value)))}
              placeholder="0"
              min="0"
              max="10"
              disabled={isSubmitting}
              helperText="How many guests are you bringing?"
            />
          )}

          {/* Waitlist Notice */}
          {selectedStatus === 'going' && isEventFull && !isOnWaitlist && (
            <Alert
              type="warning"
              message="This event is currently full. You'll be added to the waitlist."
            />
          )}

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Updating...' : hasRSVP ? 'Update RSVP' : 'Send RSVP'}
            </Button>
          </div>
        </form>

        {/* Event Details Reminder */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Event Details</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p><strong>Date:</strong> {new Date(event.dateTime).toLocaleDateString()}</p>
            <p><strong>Time:</strong> {new Date(event.dateTime).toLocaleTimeString()}</p>
            <p><strong>Location:</strong> {event.location.name}</p>
            {event.bringList.enabled && (
              <p><strong>Bring List:</strong> Available</p>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}