# Data Model: LCC Assemble

## Overview
LCC Assemble uses Firebase Firestore as the primary data store with a document-based structure optimized for real-time community features. All data models include timestamps and follow Firestore best practices for scalability.

## Core Entities

### User Collection
**Path**: `/users/{userId}`
**Purpose**: Store community member profiles and preferences

**Fields**:
- `uid` (string, required): Firebase Auth UID
- `email` (string, required): User's email address
- `displayName` (string, required): Display name for the community
- `phoneNumber` (string, optional): Phone number with privacy controls
- `whatsappNumber` (string, optional): WhatsApp number for messaging
- `bio` (string, optional): Short biography
- `interests` (array of strings): Community interests/hobbies
- `dietaryPreferences` (array of strings): Dietary restrictions/preferences
- `profileImage` (string, optional): Firebase Storage URL
- `address` (object, optional): 
  - `street` (string)
  - `city` (string)
  - `postalCode` (string)
- `privacy` (object):
  - `phoneVisible` (boolean): Default false
  - `whatsappVisible` (boolean): Default false
  - `addressVisible` (boolean): Default false
- `role` ('admin' | 'member'): User role, default 'member'
- `status` ('pending' | 'approved' | 'suspended'): Account status
- `defaultAvailability` (object):
  - `weekdays` (boolean)
  - `evenings` (boolean)
  - `weekends` (boolean)
- `createdAt` (timestamp): Account creation date
- `updatedAt` (timestamp): Last profile update

**Validation Rules**:
- Email must be valid format
- Display name 2-50 characters
- Bio max 500 characters
- Interests max 10 items
- Profile image must be valid Firebase Storage URL

**Relationships**:
- Organizer of events (references in Event collection)
- Attendee of events (references in Event collection)
- Recipient of notifications (references in Notification collection)

### Event Collection
**Path**: `/events/{eventId}`
**Purpose**: Store community event details and coordination data

**Fields**:
- `id` (string, required): Auto-generated document ID
- `title` (string, required): Event title
- `description` (string, required): Detailed event description
- `type` ('birthday' | 'potluck' | 'farewell' | 'celebration' | 'other'): Event category
- `visibility` ('public' | 'private'): Event visibility setting
- `organizer` (string, required): User UID of event creator
- `dateTime` (timestamp, required): Event start date and time
- `duration` (number, required): Duration in minutes
- `location` (object, required):
  - `name` (string): Location name
  - `address` (string): Full address
  - `coordinates` (object, optional): {lat: number, lng: number}
- `capacity` (number, optional): Maximum attendees
- `coverImage` (string, optional): Firebase Storage URL
- `images` (array of strings): Additional event photos
- `bringList` (object):
  - `enabled` (boolean): Whether bring list is active
  - `items` (array of objects):
    - `id` (string): Item ID
    - `item` (string): Item name
    - `quantity` (number): Required quantity
    - `assignedTo` (string, optional): User UID
    - `fulfilled` (boolean): Completion status
- `attendees` (map): User ID → attendance details
  - `status` ('going' | 'maybe' | 'not_going')
  - `guestCount` (number): Additional guests
  - `rsvpAt` (timestamp): RSVP timestamp
  - `bringItems` (array of strings): Assigned bring item IDs
- `waitlist` (array of strings): User UIDs on waitlist
- `status` ('draft' | 'published' | 'cancelled' | 'completed'): Event status
- `createdAt` (timestamp): Event creation date
- `updatedAt` (timestamp): Last event update

**Validation Rules**:
- Title 3-100 characters
- Description max 2000 characters
- Date must be in future for new events
- Capacity must be positive if set
- Max 20 bring items per event

**Relationships**:
- Belongs to organizer (User)
- Has many attendees (Users)
- Has many notifications (Notifications)
- Contains bring items (BringItem subcollection)

### Notification Collection
**Path**: `/notifications/{notificationId}`
**Purpose**: Store user notifications and communications

**Fields**:
- `id` (string, required): Auto-generated document ID
- `recipientId` (string, required): User UID recipient
- `type` ('event_invite' | 'event_update' | 'event_reminder' | 'member_joined'): Notification type
- `title` (string, required): Notification title
- `message` (string, required): Notification content
- `eventId` (string, optional): Related event ID
- `read` (boolean): Read status, default false
- `createdAt` (timestamp): Notification creation date

**Validation Rules**:
- Title max 100 characters
- Message max 500 characters
- Must have eventId for event-related notifications

**Relationships**:
- Belongs to recipient (User)
- References event (Event, optional)

## Data Flow Patterns

### User Registration Flow
1. User submits registration form
2. Account created with 'pending' status
3. Admin approval changes to 'approved'
4. User can complete profile setup
5. Profile data stored in User collection

### Event Creation Flow
1. Organizer creates event with details
2. Event stored with 'draft' status
3. Organizer publishes event
4. Notifications sent to community members
5. Attendees can RSVP and claim bring items

### RSVP and Attendance Flow
1. User views event details
2. User submits RSVP with status and guest count
3. Attendance data stored in event's attendees map
4. If capacity reached, user added to waitlist
5. Notifications sent for status changes

## Security Considerations

### Access Patterns
- Users can read/write their own profile data
- All authenticated users can read public events
- Event organizers can modify their events
- Admins can read all data and modify member status
- Privacy settings control visibility of contact information

### Data Validation
- All user inputs validated on client and server
- File uploads restricted to images with size limits
- Rate limiting on API calls to prevent abuse
- Input sanitization to prevent XSS attacks

## Performance Optimizations

### Indexing Strategy
- Compound indexes on frequently queried fields
- Event queries by date, type, and organizer
- User queries by status and role
- Notification queries by recipient and read status

### Caching Strategy
- Firebase CDN for static assets
- Browser caching for images and data
- Real-time listeners for dynamic content
- Offline support for critical features

### Query Optimization
- Pagination for large result sets
- Selective field retrieval
- Batch operations for bulk updates
- Efficient subcollection queries