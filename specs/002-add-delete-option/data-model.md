# Data Model: Add Delete Option for Events

## Primary Entity: Event

### Core Fields (for Delete Feature)
```typescript
interface Event {
  id: string                    // Unique identifier
  title: string                // Event title (for confirmation messages)
  organizer: string            // User UID (permission validation)
  status: EventStatus          // 'draft' | 'published' | 'cancelled' | 'completed'
  attendees: Record<string, AttendeeInfo>  // RSVP data to preserve
  updatedAt: Date              // Track cancellation timestamp
}
```

### Event Status Transitions
- **Current States**: `draft`, `published`, `cancelled`, `completed`
- **Valid Transitions for Delete**:
  - `published` → `cancelled` (soft delete/cancel)
- **Invalid Transitions**: Cannot cancel already `completed` or `cancelled` events
- **Note**: New events are created with `published` status by default

### Permission Model
```typescript
// Delete permission validation
canDeleteEvent(event: Event, userId: string): boolean {
  return event.organizer === userId && event.status !== 'completed'
}
```

### Data Preservation Requirements
- **Preserved on Cancellation**: All event data, RSVPs, bring list, images
- **Updated Fields**: `status`, `updatedAt`
- **Cascade Effects**: None (soft delete preserves all relationships)

## Secondary Entities

### AttendeeInfo (RSVP Data)
```typescript
interface AttendeeInfo {
  status: RSVPStatus          // 'going' | 'maybe' | 'not_going'
  guestCount: number          // Number of guests
  rsvpAt: Date               // When RSVP was made
  bringItems: string[]       // Bring list item IDs
}
```

**Preservation**: All RSVP data maintained for transparency and record-keeping.

## Validation Rules

### Pre-Delete Validation
1. **Organizer Check**: `event.organizer === currentUser.uid`
2. **Status Check**: `event.status !== 'completed' && event.status !== 'cancelled'`
3. **Existence Check**: Event must exist in database

### Post-Delete Validation
1. **Status Updated**: `event.status === 'cancelled'`
2. **Data Integrity**: All fields preserved except status and updatedAt
3. **Timestamps**: `updatedAt` reflects cancellation time

## Database Schema (Firestore)

### Collection: `events`
```javascript
// Document structure
{
  id: "event_123",
  title: "Community Potluck",
  organizer: "user_456",
  status: "cancelled",        // Changed from "published"
  attendees: {
    "user_789": {
      status: "going",
      guestCount: 2,
      rsvpAt: Timestamp,
      bringItems: ["item_1"]
    }
  },
  // ... all other fields preserved
  updatedAt: Timestamp        // Updated to cancellation time
}
```

### Indexes Required
- Existing indexes sufficient (no new indexes needed for status updates)
- Query patterns unchanged (status filtering already supported)

## API Contract

### Cancel Event Endpoint
```typescript
// Request
POST /api/events/{eventId}/cancel
Authorization: Bearer {userToken}

// Response
200 OK
{
  "success": true,
  "message": "Event cancelled successfully",
  "event": {
    "id": "event_123",
    "status": "cancelled",
    "updatedAt": "2025-09-22T04:00:00Z"
  }
}

// Error Responses
403 Forbidden - Not event organizer
404 Not Found - Event doesn't exist
409 Conflict - Event already cancelled or completed
500 Internal Server Error - Database error
```

## Migration Considerations

### Backwards Compatibility
- **Existing Events**: No changes required
- **Existing API**: New endpoint added, no breaking changes
- **Client Code**: New UI components, existing components unchanged

### Data Migration
- **Required**: None (soft delete uses existing schema)
- **Future Cleanup**: Hard delete of old cancelled events could be added later if needed

## Performance Impact

### Write Operations
- **Single Document Update**: Minimal performance impact
- **No Batch Operations**: Simple atomic update
- **Index Updates**: Status field already indexed

### Read Operations
- **Existing Queries**: No performance changes
- **New Filtering**: Can filter cancelled events using existing indexes

## Security Considerations

### Authorization
- **User-Level**: Only event organizer can cancel
- **Data-Level**: Firestore security rules must enforce organizer check
- **Audit Trail**: Cancellation timestamp provides audit capability

### Data Privacy
- **RSVP Visibility**: Cancelled events maintain existing privacy settings
- **Attendee Data**: All RSVP information preserved per privacy policies
- **Image Access**: Cancelled event images remain accessible (soft delete)