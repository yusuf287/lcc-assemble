import React from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Event } from '../../types'

interface EventCardProps {
  event: Event
  currentUserId?: string
  onViewDetails?: (event: Event) => void
  onRSVP?: (event: Event) => void
  onEdit?: (event: Event) => void
  compact?: boolean
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  currentUserId,
  onViewDetails,
  onRSVP,
  onEdit,
  compact = false
}) => {
  const isOrganizer = currentUserId === event.organizer
  const userRSVP = currentUserId ? event.attendees[currentUserId] : null
  const attendeeCount = Object.keys(event.attendees).length
  const isFull = event.capacity ? attendeeCount >= event.capacity : false

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date)
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'going': return 'bg-green-100 text-green-800'
      case 'maybe': return 'bg-yellow-100 text-yellow-800'
      case 'not_going': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getEventTypeColor = (type: string) => {
    const colors = {
      birthday: 'bg-pink-100 text-pink-800',
      potluck: 'bg-orange-100 text-orange-800',
      farewell: 'bg-blue-100 text-blue-800',
      celebration: 'bg-purple-100 text-purple-800',
      other: 'bg-gray-100 text-gray-800'
    }
    return colors[type as keyof typeof colors] || colors.other
  }

  if (compact) {
    return (
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {formatDate(event.dateTime)}
            </p>
            <p className="text-sm text-gray-500">
              {event.location.name} • {attendeeCount} attending
            </p>
          </div>
          <div className="flex gap-2 ml-4">
            {userRSVP && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(userRSVP.status)}`}>
                {userRSVP.status === 'going' && 'Going'}
                {userRSVP.status === 'maybe' && 'Maybe'}
                {userRSVP.status === 'not_going' && 'Not Going'}
              </span>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewDetails?.(event)}
            >
              View
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Event Image */}
      {event.images && event.images.length > 0 && (
        <div className="h-48 bg-gray-200 relative">
          <img
            src={event.images[0]}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEventTypeColor(event.type)}`}>
              {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
            </span>
          </div>
          {event.visibility === 'private' && (
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-900 text-white">
                Private
              </span>
            </div>
          )}
        </div>
      )}

      <div className="p-6">
        {/* Event Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatDate(event.dateTime)}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {event.location.name}
            </div>
          </div>

          {isOrganizer && onEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(event)}
            >
              Edit
            </Button>
          )}
        </div>

        {/* Event Description */}
        <p className="text-gray-700 mb-4 line-clamp-3">
          {event.description}
        </p>

        {/* Event Stats */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              {attendeeCount}
              {event.capacity && ` / ${event.capacity}`}
            </span>

            {event.bringList.enabled && (
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Bring List
              </span>
            )}
          </div>

          {userRSVP && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(userRSVP.status)}`}>
              {userRSVP.status === 'going' && 'Going'}
              {userRSVP.status === 'maybe' && 'Maybe'}
              {userRSVP.status === 'not_going' && 'Not Going'}
            </span>
          )}
        </div>

        {/* Capacity Warning */}
        {isFull && !userRSVP && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              This event is currently full. You can still join the waitlist.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={() => onViewDetails?.(event)}
            className="flex-1"
          >
            View Details
          </Button>

          {onRSVP && (
            <Button
              variant={userRSVP ? "outline" : "primary"}
              onClick={() => onRSVP(event)}
              disabled={isFull && !userRSVP && !isOrganizer}
              className="flex-1"
            >
              {userRSVP ? 'Update RSVP' : 'RSVP'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}