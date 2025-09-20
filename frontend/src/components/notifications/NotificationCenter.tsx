import React, { useState } from 'react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Notification } from '../../types'

interface NotificationCenterProps {
  notifications: Notification[]
  onMarkAsRead: (notificationId: string) => Promise<void>
  onMarkAllAsRead: () => Promise<void>
  onDeleteNotification: (notificationId: string) => Promise<void>
  onNotificationClick?: (notification: Notification) => void
  isLoading?: boolean
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onNotificationClick,
  isLoading = false
}) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null)

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread': return !notification.read
      case 'read': return notification.read
      default: return true
    }
  })

  const unreadCount = notifications.filter(n => !n.read).length

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      setIsSubmitting(notificationId)
      await onMarkAsRead(notificationId)
    } catch (error) {
      console.error('Error marking notification as read:', error)
    } finally {
      setIsSubmitting(null)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      setIsSubmitting('all')
      await onMarkAllAsRead()
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    } finally {
      setIsSubmitting(null)
    }
  }

  const handleDelete = async (notificationId: string) => {
    try {
      setIsSubmitting(notificationId)
      await onDeleteNotification(notificationId)
    } catch (error) {
      console.error('Error deleting notification:', error)
    } finally {
      setIsSubmitting(null)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'event_invite': return '📅'
      case 'event_update': return '🔄'
      case 'event_reminder': return '⏰'
      case 'member_joined': return '👋'
      default: return '🔔'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'event_invite': return 'bg-blue-100 text-blue-800'
      case 'event_update': return 'bg-yellow-100 text-yellow-800'
      case 'event_reminder': return 'bg-orange-100 text-orange-800'
      case 'member_joined': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`

    return date.toLocaleDateString()
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading notifications...</span>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-600">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={isSubmitting === 'all'}
              isLoading={isSubmitting === 'all'}
            >
              Mark All Read
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mt-4">
          {(['all', 'unread', 'read'] as const).map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`px-3 py-1 text-sm rounded-full capitalize transition-colors ${
                filter === filterOption
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filterOption}
              {filterOption === 'unread' && unreadCount > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </Card>

      {/* Notifications List */}
      <div className="space-y-2">
        {filteredNotifications.length === 0 ? (
          <Card className="p-8">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-4">🔔</div>
              <h4 className="text-lg font-medium mb-2">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
              </h4>
              <p className="text-sm">
                {filter === 'unread'
                  ? 'You\'re all caught up!'
                  : 'Notifications will appear here when you have activity.'
                }
              </p>
            </div>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                !notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50' : ''
              }`}
            >
              <div
                className="flex items-start space-x-3"
                onClick={() => onNotificationClick?.(notification)}
              >
                {/* Notification Icon */}
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${getNotificationColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                </div>

                {/* Notification Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                        {notification.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatTimeAgo(notification.createdAt)}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 ml-4">
                      {!notification.read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMarkAsRead(notification.id)
                          }}
                          disabled={isSubmitting === notification.id}
                          isLoading={isSubmitting === notification.id}
                        >
                          Mark Read
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(notification.id)
                        }}
                        disabled={isSubmitting === notification.id}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Load More (if needed) */}
      {filteredNotifications.length > 0 && filteredNotifications.length % 20 === 0 && (
        <div className="text-center py-4">
          <Button variant="outline">
            Load More Notifications
          </Button>
        </div>
      )}
    </div>
  )
}