export interface Event {
  id: string
  title: string
  description: string
  type: EventType
  visibility: EventVisibility
  organizer: string // User UID
  dateTime: Date
  duration: number // minutes
  location: EventLocation
  capacity?: number
  coverImage?: string
  images: string[]
  bringList: BringList
  attendees: Record<string, AttendeeInfo> // userId -> attendee info
  waitlist: string[] // user UIDs
  status: EventStatus
  createdAt: Date
  updatedAt: Date
}

export type EventType = 'birthday' | 'potluck' | 'farewell' | 'celebration' | 'other'
export type EventVisibility = 'public' | 'private'
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed'

export interface EventLocation {
  name: string
  address: string
  coordinates?: {
    lat: number
    lng: number
  }
}

export interface BringList {
  enabled: boolean
  items: BringListItem[]
}

export interface BringListItem {
  id: string
  item: string
  quantity: number
  assignedTo?: string // User UID
  fulfilled: boolean
}

export interface AttendeeInfo {
  status: RSVPStatus
  guestCount: number
  rsvpAt: Date
  bringItems: string[] // Item IDs from bring list
}

export type RSVPStatus = 'going' | 'maybe' | 'not_going'

// Form types for event creation and updates
export interface EventCreationForm {
  title: string
  description: string
  type: EventType
  visibility: EventVisibility
  dateTime: Date
  duration: number
  location: EventLocation
  capacity?: number
  coverImage?: File
  bringList: {
    enabled: boolean
    items: Omit<BringListItem, 'id' | 'assignedTo' | 'fulfilled'>[]
  }
}

export interface EventUpdateForm extends Partial<EventCreationForm> {
  status?: EventStatus
}

// API response types
export interface EventSummary {
  id: string
  title: string
  type: EventType
  visibility: EventVisibility
  organizer: string
  dateTime: string
  location: EventLocation
  capacity?: number
  attendeeCount: number
  coverImage?: string
  status: EventStatus
}

export interface EventDetail extends Omit<Event, 'createdAt' | 'updatedAt' | 'dateTime'> {
  createdAt: string
  updatedAt: string
  dateTime: string
  organizerProfile: {
    uid: string
    displayName: string
    profileImage?: string
  }
  attendees: Record<string, AttendeeDetail>
}

export interface AttendeeDetail extends AttendeeInfo {
  profile: {
    uid: string
    displayName: string
    profileImage?: string
  }
}

// RSVP types
export interface RSVPRequest {
  status: RSVPStatus
  guestCount: number
  bringItems?: string[] // Item IDs to claim
}

export interface RSVPResponse {
  success: boolean
  message: string
  attendeeInfo?: AttendeeInfo
  waitlistPosition?: number
}

// Admin types
export interface EventAdminView extends Event {
  organizerProfile: {
    uid: string
    displayName: string
    email: string
  }
  attendeeProfiles: Record<string, {
    uid: string
    displayName: string
    email: string
    rsvpAt: Date
  }>
  statistics: {
    totalAttendees: number
    goingCount: number
    maybeCount: number
    notGoingCount: number
    waitlistCount: number
    bringListFulfillmentRate: number
  }
}

// Search and filter types
export interface EventFilters {
  type?: EventType[]
  dateRange?: {
    start: Date
    end: Date
  }
  location?: string
  organizer?: string
  status?: EventStatus[]
  visibility?: EventVisibility[]
}

export interface EventSearchResult {
  events: EventSummary[]
  totalCount: number
  hasMore: boolean
}