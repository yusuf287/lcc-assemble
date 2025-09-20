export interface Notification {
  id: string
  recipientId: string // User UID
  type: NotificationType
  title: string
  message: string
  eventId?: string // Related event ID
  read: boolean
  createdAt: Date
}

export type NotificationType =
  | 'event_invite'
  | 'event_update'
  | 'event_reminder'
  | 'event_cancelled'
  | 'rsvp_confirmation'
  | 'bring_item_assigned'
  | 'bring_item_available'
  | 'member_approved'
  | 'member_rejected'
  | 'admin_action'
  | 'system_message'

// Form types for notification creation
export interface NotificationCreateRequest {
  recipientId: string
  type: NotificationType
  title: string
  message: string
  eventId?: string
}

// API response types
export interface NotificationSummary {
  id: string
  type: NotificationType
  title: string
  read: boolean
  createdAt: string
  eventId?: string
}

export interface NotificationDetail extends Omit<Notification, 'createdAt'> {
  createdAt: string
  event?: {
    id: string
    title: string
    dateTime: string
    location: {
      name: string
      address: string
    }
  }
}

// Bulk operations
export interface NotificationBulkUpdateRequest {
  notificationIds: string[]
  read: boolean
}

export interface NotificationBulkDeleteRequest {
  notificationIds: string[]
}

// Query and filter types
export interface NotificationFilters {
  read?: boolean
  type?: NotificationType[]
  eventId?: string
  dateRange?: {
    start: Date
    end: Date
  }
}

export interface NotificationQueryResult {
  notifications: NotificationSummary[]
  totalCount: number
  unreadCount: number
  hasMore: boolean
}

// Real-time subscription types
export interface NotificationSubscription {
  userId: string
  onNotification: (notification: Notification) => void
  onError?: (error: Error) => void
}

// Admin types
export interface NotificationAdminView extends Notification {
  recipientProfile: {
    uid: string
    displayName: string
    email: string
  }
  eventTitle?: string
}

// Notification preferences
export interface NotificationPreferences {
  email: {
    eventInvites: boolean
    eventUpdates: boolean
    eventReminders: boolean
    systemMessages: boolean
  }
  inApp: {
    eventInvites: boolean
    eventUpdates: boolean
    eventReminders: boolean
    systemMessages: boolean
  }
  push: {
    eventInvites: boolean
    eventUpdates: boolean
    eventReminders: boolean
    systemMessages: boolean
  }
}

// Default notification preferences
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  email: {
    eventInvites: true,
    eventUpdates: true,
    eventReminders: true,
    systemMessages: true,
  },
  inApp: {
    eventInvites: true,
    eventUpdates: true,
    eventReminders: true,
    systemMessages: true,
  },
  push: {
    eventInvites: false,
    eventUpdates: false,
    eventReminders: true,
    systemMessages: false,
  },
}

// Notification templates
export interface NotificationTemplate {
  type: NotificationType
  title: string
  message: string
  requiresEvent: boolean
}

export const NOTIFICATION_TEMPLATES: Record<NotificationType, NotificationTemplate> = {
  event_invite: {
    type: 'event_invite',
    title: 'New Event Invitation',
    message: 'You have been invited to join an event',
    requiresEvent: true,
  },
  event_update: {
    type: 'event_update',
    title: 'Event Updated',
    message: 'An event you are attending has been updated',
    requiresEvent: true,
  },
  event_reminder: {
    type: 'event_reminder',
    title: 'Event Reminder',
    message: 'Don\'t forget about your upcoming event',
    requiresEvent: true,
  },
  event_cancelled: {
    type: 'event_cancelled',
    title: 'Event Cancelled',
    message: 'An event you were attending has been cancelled',
    requiresEvent: true,
  },
  rsvp_confirmation: {
    type: 'rsvp_confirmation',
    title: 'RSVP Confirmed',
    message: 'Your RSVP has been recorded',
    requiresEvent: true,
  },
  bring_item_assigned: {
    type: 'bring_item_assigned',
    title: 'Item Assigned',
    message: 'You have been assigned to bring an item',
    requiresEvent: true,
  },
  bring_item_available: {
    type: 'bring_item_available',
    title: 'Item Available',
    message: 'A bring list item you wanted is now available',
    requiresEvent: true,
  },
  member_approved: {
    type: 'member_approved',
    title: 'Welcome to LCC Assemble!',
    message: 'Your membership has been approved',
    requiresEvent: false,
  },
  member_rejected: {
    type: 'member_rejected',
    title: 'Membership Update',
    message: 'There was an issue with your membership application',
    requiresEvent: false,
  },
  admin_action: {
    type: 'admin_action',
    title: 'Admin Action Required',
    message: 'An administrative action has been taken',
    requiresEvent: false,
  },
  system_message: {
    type: 'system_message',
    title: 'System Message',
    message: 'You have received a system message',
    requiresEvent: false,
  },
}