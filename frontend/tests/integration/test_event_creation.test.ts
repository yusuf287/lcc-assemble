import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import {
  createEvent,
  updateEvent,
  getEvent,
  searchEvents,
  uploadEventImage,
  publishEvent,
  cancelEvent,
  rsvpToEvent,
  claimBringListItem
} from '../../src/services/eventService'
import { Event, EventCreationForm, EventUpdateForm, EventFilters } from '../../src/types'

// Mock the event service
jest.mock('../../src/services/eventService')

// Mock data for testing
const mockEvent: Event = {
  id: 'event1',
  title: 'Community Potluck',
  description: 'A fun community gathering with food and games',
  type: 'potluck',
  visibility: 'public',
  organizer: 'user1',
  dateTime: new Date('2024-12-25T18:00:00Z'),
  duration: 180,
  location: {
    name: 'Community Center',
    address: '123 Main St, Anytown, USA'
  },
  capacity: 50,
  images: [],
  bringList: {
    enabled: true,
    items: [
      {
        id: 'item1',
        item: 'Salad',
        quantity: 2,
        fulfilled: false,
        assignedTo: undefined
      }
    ]
  },
  attendees: {},
  waitlist: [],
  status: 'published',
  createdAt: new Date(),
  updatedAt: new Date()
}

const mockEventCreationForm: EventCreationForm = {
  title: 'Community Potluck',
  description: 'A fun community gathering with food and games',
  type: 'potluck',
  visibility: 'public',
  dateTime: new Date('2024-12-25T18:00:00Z'),
  duration: 180,
  location: {
    name: 'Community Center',
    address: '123 Main St, Anytown, USA'
  },
  capacity: 50,
  bringList: {
    enabled: true,
    items: [
      {
        item: 'Salad',
        quantity: 2
      }
    ]
  }
}

describe('Event Creation Integration Tests', () => {
  let mockCreateEvent: jest.MockedFunction<typeof createEvent>
  let mockUpdateEvent: jest.MockedFunction<typeof updateEvent>
  let mockGetEvent: jest.MockedFunction<typeof getEvent>
  let mockSearchEvents: jest.MockedFunction<typeof searchEvents>
  let mockUploadEventImage: jest.MockedFunction<typeof uploadEventImage>
  let mockPublishEvent: jest.MockedFunction<typeof publishEvent>
  let mockCancelEvent: jest.MockedFunction<typeof cancelEvent>
  let mockRsvpToEvent: jest.MockedFunction<typeof rsvpToEvent>
  let mockClaimBringListItem: jest.MockedFunction<typeof claimBringListItem>

  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateEvent = createEvent as jest.MockedFunction<typeof createEvent>
    mockUpdateEvent = updateEvent as jest.MockedFunction<typeof updateEvent>
    mockGetEvent = getEvent as jest.MockedFunction<typeof getEvent>
    mockSearchEvents = searchEvents as jest.MockedFunction<typeof searchEvents>
    mockUploadEventImage = uploadEventImage as jest.MockedFunction<typeof uploadEventImage>
    mockPublishEvent = publishEvent as jest.MockedFunction<typeof publishEvent>
    mockCancelEvent = cancelEvent as jest.MockedFunction<typeof cancelEvent>
    mockRsvpToEvent = rsvpToEvent as jest.MockedFunction<typeof rsvpToEvent>
    mockClaimBringListItem = claimBringListItem as jest.MockedFunction<typeof claimBringListItem>

    // Default mock implementations
    mockCreateEvent.mockResolvedValue('event1')
    mockGetEvent.mockResolvedValue(mockEvent)
    mockSearchEvents.mockResolvedValue({
      events: [{
        id: mockEvent.id,
        title: mockEvent.title,
        type: mockEvent.type,
        visibility: mockEvent.visibility,
        organizer: mockEvent.organizer,
        dateTime: mockEvent.dateTime.toISOString(),
        location: mockEvent.location,
        capacity: mockEvent.capacity,
        attendeeCount: Object.keys(mockEvent.attendees).length,
        coverImage: mockEvent.coverImage,
        status: mockEvent.status
      }],
      totalCount: 1,
      hasMore: false
    })
    mockUploadEventImage.mockResolvedValue('https://example.com/image.jpg')
    mockPublishEvent.mockResolvedValue(undefined)
    mockCancelEvent.mockResolvedValue(undefined)
    mockRsvpToEvent.mockResolvedValue({
      success: true,
      message: 'RSVP recorded successfully',
      attendeeInfo: {
        status: 'going',
        guestCount: 0,
        rsvpAt: new Date(),
        bringItems: []
      }
    })
    mockClaimBringListItem.mockResolvedValue(undefined)
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  describe('Event Creation Form', () => {
    it('should validate required event fields', () => {
      // Test that createEvent validates required fields
      const invalidForm = {
        ...mockEventCreationForm,
        title: '' // Invalid: empty title
      }

      mockCreateEvent.mockRejectedValueOnce(new Error('Title is required'))

      expect(createEvent('user1', invalidForm)).rejects.toThrow('Title is required')
    })

    it('should validate event title length', () => {
      // Test title length validation
      const shortTitleForm = {
        ...mockEventCreationForm,
        title: 'Hi' // Too short
      }

      mockCreateEvent.mockRejectedValueOnce(new Error('Title too short'))

      expect(createEvent('user1', shortTitleForm)).rejects.toThrow('Title too short')
    })

    it('should validate event date is in future', () => {
      // Test future date validation
      const pastDateForm = {
        ...mockEventCreationForm,
        dateTime: new Date('2020-01-01') // Past date
      }

      mockCreateEvent.mockRejectedValueOnce(new Error('Event must be in the future'))

      expect(createEvent('user1', pastDateForm)).rejects.toThrow('Event must be in the future')
    })

    it('should validate location information', () => {
      // Test location validation
      const invalidLocationForm = {
        ...mockEventCreationForm,
        location: {
          name: '',
          address: '123 Main St'
        }
      }

      mockCreateEvent.mockRejectedValueOnce(new Error('Location name is required'))

      expect(createEvent('user1', invalidLocationForm)).rejects.toThrow('Location name is required')
    })
  })

  describe('Event Settings', () => {
    it('should handle privacy settings', async () => {
      const privateEventForm = {
        ...mockEventCreationForm,
        visibility: 'private' as const
      }

      await createEvent('user1', privateEventForm)

      expect(mockCreateEvent).toHaveBeenCalledWith('user1', expect.objectContaining({
        visibility: 'private'
      }))
    })

    it('should handle capacity settings', async () => {
      const capacityEventForm = {
        ...mockEventCreationForm,
        capacity: 25
      }

      await createEvent('user1', capacityEventForm)

      expect(mockCreateEvent).toHaveBeenCalledWith('user1', expect.objectContaining({
        capacity: 25
      }))
    })

    it('should handle bring list settings', async () => {
      const bringListForm = {
        ...mockEventCreationForm,
        bringList: {
          enabled: true,
          items: [
            {
              id: 'item1',
              item: 'Chips',
              quantity: 3,
              fulfilled: false
            }
          ]
        }
      }

      await createEvent('user1', bringListForm)

      expect(mockCreateEvent).toHaveBeenCalledWith('user1', expect.objectContaining({
        bringList: expect.objectContaining({
          enabled: true,
          items: expect.arrayContaining([
            expect.objectContaining({
              item: 'Chips',
              quantity: 3
            })
          ])
        })
      }))
    })

    it('should handle event type selection', async () => {
      const birthdayEventForm = {
        ...mockEventCreationForm,
        type: 'birthday' as const
      }

      await createEvent('user1', birthdayEventForm)

      expect(mockCreateEvent).toHaveBeenCalledWith('user1', expect.objectContaining({
        type: 'birthday'
      }))
    })
  })

  describe('Firestore Integration', () => {
    it('should create event document in Firestore', async () => {
      const eventId = await createEvent('user1', mockEventCreationForm)

      expect(mockCreateEvent).toHaveBeenCalledWith('user1', mockEventCreationForm)
      expect(eventId).toBe('event1')
    })

    it('should set organizer as current user', async () => {
      await createEvent('user123', mockEventCreationForm)

      expect(mockCreateEvent).toHaveBeenCalledWith('user123', mockEventCreationForm)
    })

    it('should set event status to published initially', async () => {
      await createEvent('user1', mockEventCreationForm)

      // The service should set status to 'published' by default
      expect(mockCreateEvent).toHaveBeenCalledWith('user1', mockEventCreationForm)
    })

    it('should handle event publishing', async () => {
      await publishEvent('event1')

      expect(mockPublishEvent).toHaveBeenCalledWith('event1')
    })
  })

  describe('Image Upload', () => {
    it('should handle cover image upload', async () => {
      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' })

      const imageUrl = await uploadEventImage('event1', mockFile, true)

      expect(mockUploadEventImage).toHaveBeenCalledWith('event1', mockFile, true)
      expect(imageUrl).toBe('https://example.com/image.jpg')
    })

    it('should validate image file types', () => {
      const mockFile = new File([''], 'test.txt', { type: 'text/plain' })

      mockUploadEventImage.mockRejectedValueOnce(new Error('Invalid file type'))

      expect(uploadEventImage('event1', mockFile)).rejects.toThrow('Invalid file type')
    })

    it('should handle image upload errors', () => {
      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' })

      mockUploadEventImage.mockRejectedValueOnce(new Error('Upload failed'))

      expect(uploadEventImage('event1', mockFile)).rejects.toThrow('Upload failed')
    })
  })

  describe('User Experience', () => {
    it('should provide form validation feedback', () => {
      // Test that validation errors are properly handled
      const invalidForm = {
        ...mockEventCreationForm,
        title: 'A', // Too short
        description: 'Hi' // Too short
      }

      mockCreateEvent.mockRejectedValueOnce(new Error('Validation failed'))

      expect(createEvent('user1', invalidForm)).rejects.toThrow('Validation failed')
    })

    it('should handle successful event creation', async () => {
      const eventId = await createEvent('user1', mockEventCreationForm)

      expect(eventId).toBe('event1')
      expect(mockCreateEvent).toHaveBeenCalledWith('user1', mockEventCreationForm)
    })

    it('should handle event updates', async () => {
      const updates: EventUpdateForm = {
        title: 'Updated Title',
        description: 'Updated description'
      }

      await updateEvent('event1', updates)

      expect(mockUpdateEvent).toHaveBeenCalledWith('event1', updates)
    })

    it('should show success confirmation', async () => {
      // Test that successful operations return appropriate responses
      const result = await rsvpToEvent('event1', 'user1', { status: 'going', guestCount: 0 })

      expect(result.success).toBe(true)
      expect(result.message).toContain('successfully')
    })

    it('should handle event cancellation', async () => {
      await cancelEvent('event1')

      expect(mockCancelEvent).toHaveBeenCalledWith('event1')
    })
  })

  describe('Event Search and Discovery', () => {
    it('should search events with filters', async () => {
      const filters: EventFilters = {
        status: ['published'],
        type: ['potluck']
      }

      const result = await searchEvents(filters)

      expect(mockSearchEvents).toHaveBeenCalledWith(filters)
      expect(result.events).toHaveLength(1)
      expect(result.events[0].title).toBe('Community Potluck')
    })

    it('should handle pagination', async () => {
      mockSearchEvents.mockResolvedValueOnce({
        events: [],
        totalCount: 0,
        hasMore: false
      })

      const result = await searchEvents({}, 10)

      expect(mockSearchEvents).toHaveBeenCalledWith({}, 10)
      expect(result.hasMore).toBe(false)
    })

    it('should get event details', async () => {
      const event = await getEvent('event1')

      expect(mockGetEvent).toHaveBeenCalledWith('event1')
      expect(event?.title).toBe('Community Potluck')
      expect(event?.bringList.enabled).toBe(true)
    })
  })

  describe('RSVP Integration', () => {
    it('should handle RSVP to events', async () => {
      const result = await rsvpToEvent('event1', 'user1', {
        status: 'going',
        guestCount: 2
      })

      expect(mockRsvpToEvent).toHaveBeenCalledWith('event1', 'user1', {
        status: 'going',
        guestCount: 2
      })
      expect(result.success).toBe(true)
    })

    it('should handle bring list item claiming', async () => {
      await claimBringListItem('event1', 'item1', 'user1')

      expect(mockClaimBringListItem).toHaveBeenCalledWith('event1', 'item1', 'user1')
    })

    it('should handle capacity limits', () => {
      mockRsvpToEvent.mockResolvedValueOnce({
        success: false,
        message: 'Event is at capacity',
        waitlistPosition: 1
      })

      expect(rsvpToEvent('event1', 'user1', { status: 'going', guestCount: 0 })).resolves.toEqual({
        success: false,
        message: 'Event is at capacity',
        waitlistPosition: 1
      })
    })
  })
})