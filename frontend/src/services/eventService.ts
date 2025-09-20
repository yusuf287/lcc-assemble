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
  startAfter,
  getDocs,
  onSnapshot,
  QueryDocumentSnapshot,
  Timestamp
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from './firebase'
import {
  Event,
  EventSummary,
  EventDetail,
  EventCreationForm,
  EventUpdateForm,
  RSVPRequest,
  RSVPResponse,
  EventFilters,
  EventSearchResult,
  AttendeeInfo,
  BringListItem
} from '../types'

// Collection name
const EVENTS_COLLECTION = 'events'

// Convert Firestore timestamp to Date
const timestampToDate = (timestamp: Timestamp): Date => timestamp.toDate()

// Convert Date to Firestore timestamp
const dateToTimestamp = (date: Date): Timestamp => Timestamp.fromDate(date)

// Get event by ID
export const getEvent = async (eventId: string): Promise<Event | null> => {
  try {
    const eventDocRef = doc(db, EVENTS_COLLECTION, eventId)
    const eventDoc = await getDoc(eventDocRef)

    if (eventDoc.exists()) {
      const data = eventDoc.data()
      return {
        ...data,
        id: eventDoc.id,
        dateTime: timestampToDate(data.dateTime),
        createdAt: timestampToDate(data.createdAt),
        updatedAt: timestampToDate(data.updatedAt),
        // Convert attendee timestamps
        attendees: Object.fromEntries(
          Object.entries(data.attendees || {}).map(([uid, attendee]: [string, any]) => [
            uid,
            {
              status: attendee.status,
              guestCount: attendee.guestCount,
              rsvpAt: timestampToDate(attendee.rsvpAt),
              bringItems: attendee.bringItems || []
            }
          ])
        )
      } as Event
    }

    return null
  } catch (error) {
    console.error('Error getting event:', error)
    throw new Error('Failed to get event')
  }
}

// Get event summary (for listings)
export const getEventSummary = async (eventId: string): Promise<EventSummary | null> => {
  try {
    const event = await getEvent(eventId)
    if (!event) return null

    return {
      id: event.id,
      title: event.title,
      type: event.type,
      visibility: event.visibility,
      organizer: event.organizer,
      dateTime: event.dateTime.toISOString(),
      location: event.location,
      capacity: event.capacity || 0,
      attendeeCount: Object.keys(event.attendees).length,
      coverImage: event.coverImage || '',
      status: event.status
    }
  } catch (error) {
    console.error('Error getting event summary:', error)
    throw new Error('Failed to get event summary')
  }
}

// Get event detail (for event page)
export const getEventDetail = async (eventId: string): Promise<EventDetail | null> => {
  try {
    const event = await getEvent(eventId)
    if (!event) return null

    return {
      id: event.id,
      title: event.title,
      description: event.description,
      type: event.type,
      visibility: event.visibility,
      organizer: event.organizer,
      dateTime: event.dateTime.toISOString(),
      duration: event.duration,
      location: event.location,
      capacity: event.capacity,
      coverImage: event.coverImage,
      images: event.images,
      bringList: event.bringList,
      attendees: Object.fromEntries(
        Object.entries(event.attendees).map(([uid, attendee]: [string, any]) => [
          uid,
          {
            status: attendee.status,
            guestCount: attendee.guestCount,
            rsvpAt: attendee.rsvpAt.toISOString(),
            bringItems: attendee.bringItems || [],
            profile: {
              uid,
              displayName: 'Loading...' // Would be fetched separately
            }
          }
        ])
      ) as any,
      waitlist: event.waitlist,
      status: event.status,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
      organizerProfile: {
        uid: event.organizer,
        displayName: 'Loading...', // Would be fetched separately
        profileImage: undefined
      }
    }
  } catch (error) {
    console.error('Error getting event detail:', error)
    throw new Error('Failed to get event detail')
  }
}

// Create new event
export const createEvent = async (
  organizerId: string,
  eventData: EventCreationForm
): Promise<string> => {
  try {
    const eventDocRef = doc(collection(db, EVENTS_COLLECTION))
    const now = new Date()

    // Convert form data to event data
    const event: Omit<Event, 'id'> = {
      title: eventData.title,
      description: eventData.description,
      type: eventData.type,
      visibility: eventData.visibility,
      organizer: organizerId,
      dateTime: eventData.dateTime,
      duration: eventData.duration,
      location: eventData.location,
      capacity: eventData.capacity,
      coverImage: undefined, // Will be uploaded separately
      images: [],
      bringList: {
        enabled: eventData.bringList.enabled,
        items: eventData.bringList.items.map((item, index) => ({
          id: `item_${index}`,
          item: item.item,
          quantity: item.quantity,
          assignedTo: undefined,
          fulfilled: false
        }))
      },
      attendees: {},
      waitlist: [],
      status: 'draft',
      createdAt: now,
      updatedAt: now
    }

    await setDoc(eventDocRef, {
      ...event,
      dateTime: dateToTimestamp(event.dateTime),
      createdAt: dateToTimestamp(event.createdAt),
      updatedAt: dateToTimestamp(event.updatedAt)
    })

    return eventDocRef.id
  } catch (error) {
    console.error('Error creating event:', error)
    throw new Error('Failed to create event')
  }
}

// Update event
export const updateEvent = async (
  eventId: string,
  updates: EventUpdateForm
): Promise<void> => {
  try {
    const updateData: any = {
      ...updates,
      updatedAt: new Date()
    }

    // Convert dates to timestamps
    if (updates.dateTime) {
      updateData.dateTime = dateToTimestamp(updates.dateTime)
    }
    updateData.updatedAt = dateToTimestamp(updateData.updatedAt)

    await updateDoc(doc(db, EVENTS_COLLECTION, eventId), updateData)
  } catch (error) {
    console.error('Error updating event:', error)
    throw new Error('Failed to update event')
  }
}

// Delete event
export const deleteEvent = async (eventId: string): Promise<void> => {
  try {
    // Delete associated images from storage
    const event = await getEvent(eventId)
    if (event) {
      // Delete cover image
      if (event.coverImage) {
        try {
          const imageRef = ref(storage, event.coverImage)
          await deleteObject(imageRef)
        } catch (error) {
          console.warn('Failed to delete cover image:', error)
        }
      }

      // Delete additional images
      for (const imageUrl of event.images) {
        try {
          const imageRef = ref(storage, imageUrl)
          await deleteObject(imageRef)
        } catch (error) {
          console.warn('Failed to delete image:', error)
        }
      }
    }

    await deleteDoc(doc(db, EVENTS_COLLECTION, eventId))
  } catch (error) {
    console.error('Error deleting event:', error)
    throw new Error('Failed to delete event')
  }
}

// Search and filter events
export const searchEvents = async (
  filters: EventFilters = {},
  pageSize: number = 20,
  startAfterDoc?: QueryDocumentSnapshot
): Promise<EventSearchResult> => {
  try {
    let q = query(collection(db, EVENTS_COLLECTION))

    // Apply filters
    if (filters.status && filters.status.length > 0) {
      q = query(q, where('status', 'in', filters.status))
    }

    if (filters.visibility && filters.visibility.length > 0) {
      q = query(q, where('visibility', 'in', filters.visibility))
    }

    if (filters.type && filters.type.length > 0) {
      q = query(q, where('type', 'in', filters.type))
    }

    // Apply ordering
    q = query(q, orderBy('dateTime', 'asc'))

    // Apply pagination
    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc))
    }

    q = query(q, limit(pageSize))

    const querySnapshot = await getDocs(q)
    const events: EventSummary[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      events.push({
        id: doc.id,
        title: data.title,
        type: data.type,
        visibility: data.visibility,
        organizer: data.organizer,
        dateTime: timestampToDate(data.dateTime).toISOString(),
        location: data.location,
        capacity: data.capacity,
        attendeeCount: Object.keys(data.attendees || {}).length,
        coverImage: data.coverImage,
        status: data.status
      })
    })

    return {
      events,
      totalCount: events.length, // Simplified - would need aggregation for total count
      hasMore: querySnapshot.size === pageSize
    }
  } catch (error) {
    console.error('Error searching events:', error)
    throw new Error('Failed to search events')
  }
}

// RSVP to event
export const rsvpToEvent = async (
  eventId: string,
  userId: string,
  rsvpData: RSVPRequest
): Promise<RSVPResponse> => {
  try {
    const event = await getEvent(eventId)
    if (!event) {
      throw new Error('Event not found')
    }

    const currentAttendeeCount = Object.keys(event.attendees).length
    const isCurrentlyAttending = event.attendees[userId]

    // Check capacity
    if (rsvpData.status === 'going' && !isCurrentlyAttending) {
      if (event.capacity && currentAttendeeCount >= event.capacity) {
        // Add to waitlist
        const updatedWaitlist = [...event.waitlist]
        if (!updatedWaitlist.includes(userId)) {
          updatedWaitlist.push(userId)
        }

        await updateDoc(doc(db, EVENTS_COLLECTION, eventId), {
          waitlist: updatedWaitlist,
          updatedAt: dateToTimestamp(new Date())
        })

        return {
          success: false,
          message: 'Event is at capacity. You have been added to the waitlist.',
          waitlistPosition: updatedWaitlist.length
        }
      }
    }

    // Update RSVP
    const attendeeInfo: AttendeeInfo = {
      status: rsvpData.status,
      guestCount: rsvpData.guestCount || 0,
      rsvpAt: new Date(),
      bringItems: rsvpData.bringItems || []
    }

    const updatedAttendees = { ...event.attendees }
    if (rsvpData.status === 'not_going') {
      delete updatedAttendees[userId]
      // Remove from waitlist if present
      const updatedWaitlist = event.waitlist.filter(id => id !== userId)
      await updateDoc(doc(db, EVENTS_COLLECTION, eventId), {
        attendees: updatedAttendees,
        waitlist: updatedWaitlist,
        updatedAt: dateToTimestamp(new Date())
      })
    } else {
      updatedAttendees[userId] = attendeeInfo
      await updateDoc(doc(db, EVENTS_COLLECTION, eventId), {
        attendees: {
          ...updatedAttendees,
          [userId]: {
            ...attendeeInfo,
            rsvpAt: dateToTimestamp(attendeeInfo.rsvpAt)
          }
        },
        updatedAt: dateToTimestamp(new Date())
      })
    }

    return {
      success: true,
      message: `RSVP ${rsvpData.status} recorded successfully.`,
      attendeeInfo
    }
  } catch (error) {
    console.error('Error RSVPing to event:', error)
    throw new Error('Failed to RSVP to event')
  }
}

// Claim bring list item
export const claimBringListItem = async (
  eventId: string,
  itemId: string,
  userId: string
): Promise<void> => {
  try {
    const event = await getEvent(eventId)
    if (!event || !event.bringList.enabled) {
      throw new Error('Event or bring list not found')
    }

    const item = event.bringList.items.find(item => item.id === itemId)
    if (!item) {
      throw new Error('Item not found')
    }

    if (item.assignedTo && item.assignedTo !== userId) {
      throw new Error('Item already claimed by another user')
    }

    // Update item assignment
    const updatedItems = event.bringList.items.map(item =>
      item.id === itemId
        ? { ...item, assignedTo: userId }
        : item
    )

    await updateDoc(doc(db, EVENTS_COLLECTION, eventId), {
      'bringList.items': updatedItems,
      updatedAt: dateToTimestamp(new Date())
    })
  } catch (error) {
    console.error('Error claiming bring list item:', error)
    throw new Error('Failed to claim item')
  }
}

// Upload event image
export const uploadEventImage = async (
  eventId: string,
  file: File,
  isCoverImage: boolean = false
): Promise<string> => {
  try {
    const storageRef = ref(storage, `events/${eventId}/${file.name}`)
    const snapshot = await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)

    if (isCoverImage) {
      await updateDoc(doc(db, EVENTS_COLLECTION, eventId), {
        coverImage: downloadURL,
        updatedAt: dateToTimestamp(new Date())
      })
    } else {
      // Add to images array
      const event = await getEvent(eventId)
      if (event) {
        const updatedImages = [...event.images, downloadURL]
        await updateDoc(doc(db, EVENTS_COLLECTION, eventId), {
          images: updatedImages,
          updatedAt: dateToTimestamp(new Date())
        })
      }
    }

    return downloadURL
  } catch (error) {
    console.error('Error uploading event image:', error)
    throw new Error('Failed to upload image')
  }
}

// Get user's events
export const getUserEvents = async (userId: string): Promise<EventSummary[]> => {
  try {
    const q = query(
      collection(db, EVENTS_COLLECTION),
      where('organizer', '==', userId),
      orderBy('dateTime', 'desc')
    )

    const querySnapshot = await getDocs(q)
    const events: EventSummary[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      events.push({
        id: doc.id,
        title: data.title,
        type: data.type,
        visibility: data.visibility,
        organizer: data.organizer,
        dateTime: timestampToDate(data.dateTime).toISOString(),
        location: data.location,
        capacity: data.capacity,
        attendeeCount: Object.keys(data.attendees || {}).length,
        coverImage: data.coverImage,
        status: data.status
      })
    })

    return events
  } catch (error) {
    console.error('Error getting user events:', error)
    throw new Error('Failed to get user events')
  }
}

// Real-time event listener
export const onEventChange = (
  eventId: string,
  callback: (event: Event | null) => void
): (() => void) => {
  const eventRef = doc(db, EVENTS_COLLECTION, eventId)
  return onSnapshot(eventRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data()
      const event: Event = {
        ...(data as any),
        id: doc.id,
        dateTime: timestampToDate(data.dateTime),
        createdAt: timestampToDate(data.createdAt),
        updatedAt: timestampToDate(data.updatedAt),
        attendees: Object.fromEntries(
          Object.entries(data.attendees || {}).map(([uid, attendee]: [string, any]) => [
            uid,
            {
              ...attendee,
              rsvpAt: timestampToDate(attendee.rsvpAt)
            }
          ])
        )
      }
      callback(event)
    } else {
      callback(null)
    }
  }, (error) => {
    console.error('Event listener error:', error)
    callback(null)
  })
}

// Publish draft event
export const publishEvent = async (eventId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, EVENTS_COLLECTION, eventId), {
      status: 'published',
      updatedAt: dateToTimestamp(new Date())
    })
  } catch (error) {
    console.error('Error publishing event:', error)
    throw new Error('Failed to publish event')
  }
}

// Cancel event
export const cancelEvent = async (eventId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, EVENTS_COLLECTION, eventId), {
      status: 'cancelled',
      updatedAt: dateToTimestamp(new Date())
    })
  } catch (error) {
    console.error('Error cancelling event:', error)
    throw new Error('Failed to cancel event')
  }
}