import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  Timestamp
} from 'firebase/firestore'
import { db } from './firebase'
import {
  Notification,
  NotificationType,
  NotificationSummary,
  NotificationFilters,
  NotificationQueryResult
} from '../types'

// Collection name
const NOTIFICATIONS_COLLECTION = 'notifications'

// Convert Firestore timestamp to Date
const timestampToDate = (timestamp: Timestamp): Date => timestamp.toDate()

// Convert Date to Firestore timestamp
const dateToTimestamp = (date: Date): Timestamp => Timestamp.fromDate(date)

// Get notification by ID
export const getNotification = async (notificationId: string): Promise<Notification | null> => {
  try {
    const notificationDocRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId)
    const notificationDoc = await getDoc(notificationDocRef)

    if (notificationDoc.exists()) {
      const data = notificationDoc.data()
      return {
        ...data,
        id: notificationDoc.id,
        createdAt: timestampToDate(data.createdAt)
      } as Notification
    }

    return null
  } catch (error) {
    console.error('Error getting notification:', error)
    throw new Error('Failed to get notification')
  }
}

// Get user's notifications
export const getUserNotifications = async (
  userId: string,
  pageSize: number = 20,
  startAfterDoc?: any
): Promise<NotificationQueryResult> => {
  try {
    let q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('recipientId', '==', userId),
      orderBy('createdAt', 'desc')
    )

    if (startAfterDoc) {
      q = query(q, startAfterDoc)
    }

    q = query(q, limit(pageSize))

    const querySnapshot = await getDocs(q)
    const notifications: NotificationSummary[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      notifications.push({
        id: doc.id,
        type: data.type,
        title: data.title,
        read: data.read,
        createdAt: timestampToDate(data.createdAt).toISOString(),
        eventId: data.eventId
      })
    })

    return {
      notifications,
      totalCount: notifications.length, // Simplified - would need aggregation for total count
      unreadCount: notifications.filter(n => !n.read).length,
      hasMore: querySnapshot.size === pageSize
    }
  } catch (error) {
    console.error('Error getting user notifications:', error)
    throw new Error('Failed to get user notifications')
  }
}

// Create notification
export const createNotification = async (
  recipientId: string,
  type: NotificationType,
  title: string,
  message: string,
  eventId?: string
): Promise<string> => {
  try {
    const notificationDocRef = doc(collection(db, NOTIFICATIONS_COLLECTION))
    const notification: Omit<Notification, 'id'> = {
      recipientId,
      type,
      title,
      message,
      eventId,
      read: false,
      createdAt: new Date()
    }

    await setDoc(notificationDocRef, {
      ...notification,
      createdAt: dateToTimestamp(notification.createdAt)
    })

    return notificationDocRef.id
  } catch (error) {
    console.error('Error creating notification:', error)
    throw new Error('Failed to create notification')
  }
}

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationId), {
      read: true
    })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    throw new Error('Failed to mark notification as read')
  }
}

// Mark all user notifications as read
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('recipientId', '==', userId),
      where('read', '==', false)
    )

    const querySnapshot = await getDocs(q)
    const updatePromises = querySnapshot.docs.map(doc =>
      updateDoc(doc.ref, { read: true })
    )

    await Promise.all(updatePromises)
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    throw new Error('Failed to mark all notifications as read')
  }
}

// Delete notification
export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationId))
  } catch (error) {
    console.error('Error deleting notification:', error)
    throw new Error('Failed to delete notification')
  }
}

// Get unread notification count
export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('recipientId', '==', userId),
      where('read', '==', false)
    )

    const querySnapshot = await getDocs(q)
    return querySnapshot.size
  } catch (error) {
    console.error('Error getting unread notification count:', error)
    return 0
  }
}

// Create event-related notifications
export const createEventNotification = async (
  eventId: string,
  eventTitle: string,
  organizerId: string,
  attendeeIds: string[],
  notificationType: 'event_invite' | 'event_update' | 'event_reminder',
  customMessage?: string
): Promise<void> => {
  try {
    const title = getEventNotificationTitle(notificationType, eventTitle)
    const message = customMessage || getEventNotificationMessage(notificationType, eventTitle)

    const notificationPromises = attendeeIds.map(attendeeId =>
      createNotification(attendeeId, notificationType, title, message, eventId)
    )

    await Promise.all(notificationPromises)
  } catch (error) {
    console.error('Error creating event notifications:', error)
    throw new Error('Failed to create event notifications')
  }
}

// Helper functions for event notifications
const getEventNotificationTitle = (type: NotificationType, eventTitle: string): string => {
  switch (type) {
    case 'event_invite':
      return `You're invited to ${eventTitle}`
    case 'event_update':
      return `${eventTitle} has been updated`
    case 'event_reminder':
      return `Reminder: ${eventTitle} is coming up`
    case 'member_approved':
      return `New member joined ${eventTitle}`
    default:
      return eventTitle
  }
}

const getEventNotificationMessage = (type: NotificationType, eventTitle: string): string => {
  switch (type) {
    case 'event_invite':
      return `You've been invited to join ${eventTitle}. Check your RSVP status and let the organizer know if you can make it!`
    case 'event_update':
      return `The details for ${eventTitle} have been updated. Please review the changes and update your RSVP if needed.`
    case 'event_reminder':
      return `Just a friendly reminder that ${eventTitle} is happening soon. Don't forget to RSVP and bring your assigned items!`
    case 'member_approved':
      return `A new member has joined ${eventTitle}. Welcome them to the community!`
    default:
      return `Update regarding ${eventTitle}`
  }
}

// Real-time notification listener
export const onUserNotificationsChange = (
  userId: string,
  callback: (notifications: NotificationSummary[]) => void
): (() => void) => {
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where('recipientId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50)
  )

  return onSnapshot(q, (querySnapshot) => {
    const notifications: NotificationSummary[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      notifications.push({
        id: doc.id,
        type: data.type,
        title: data.title,
        read: data.read,
        createdAt: timestampToDate(data.createdAt).toISOString(),
        eventId: data.eventId
      })
    })
    callback(notifications)
  }, (error) => {
    console.error('Notification listener error:', error)
    callback([])
  })
}

// Bulk notification operations for admin
export const createBulkNotifications = async (
  recipientIds: string[],
  type: NotificationType,
  title: string,
  message: string,
  eventId?: string
): Promise<void> => {
  try {
    const notificationPromises = recipientIds.map(recipientId =>
      createNotification(recipientId, type, title, message, eventId)
    )

    await Promise.all(notificationPromises)
  } catch (error) {
    console.error('Error creating bulk notifications:', error)
    throw new Error('Failed to create bulk notifications')
  }
}

// Clean up old notifications (admin function)
export const cleanupOldNotifications = async (daysOld: number = 90): Promise<number> => {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('createdAt', '<', dateToTimestamp(cutoffDate)),
      where('read', '==', true)
    )

    const querySnapshot = await getDocs(q)
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref))

    await Promise.all(deletePromises)
    return querySnapshot.size
  } catch (error) {
    console.error('Error cleaning up old notifications:', error)
    throw new Error('Failed to cleanup old notifications')
  }
}