# Quickstart: Add Delete Option for Events

## Overview
This feature adds the ability for event organizers to cancel/delete events through the event editing interface. The implementation uses soft delete (status change to 'cancelled') to preserve community history and RSVP transparency.

## User Journey: Cancel an Event

### Prerequisites
- User is logged in and is an event organizer
- Event exists and is in 'published' or 'draft' status
- Event is not already 'completed' or 'cancelled'

### Steps

#### 1. Navigate to Event Edit Page
```
Given: User is logged in and owns an event
When: User navigates to /events/{eventId}/edit
Then: Edit event page loads with all form fields populated
```

#### 2. Locate Delete Option
```
Given: Edit event page is loaded (any step)
When: User looks at bottom navigation section
Then: Delete button is visible alongside Cancel/Save buttons on all steps
And: Delete button is styled with red/destructive appearance
```

#### 3. Initiate Delete Action
```
Given: Delete button is visible
When: User clicks the Delete button
Then: Confirmation dialog appears with title "Cancel Event"
And: Dialog shows event title and warning message
And: Dialog has "Cancel Event" and "Keep Event" buttons
```

#### 4. Confirm Deletion
```
Given: Confirmation dialog is shown
When: User clicks "Cancel Event" button
Then: Secondary confirmation dialog appears
And: Secondary dialog shows impact warning: "This will notify all attendees"
And: Secondary dialog has "Yes, Cancel Event" and "No, Keep Event" buttons
```

#### 5. Complete Cancellation
```
Given: Secondary confirmation dialog is shown
When: User clicks "Yes, Cancel Event"
Then: Loading spinner appears
And: cancelEvent API call is made
And: Event status changes to 'cancelled' in database
And: Success toast notification appears: "Event cancelled successfully"
And: User is redirected to /events page
```

### Alternative Flows

#### Cancel Action in Dialog
```
Given: Either confirmation dialog is shown
When: User clicks "Keep Event" or "No, Keep Event"
Then: Dialog closes
And: User remains on edit page
And: No changes made to event
```

#### Permission Error
```
Given: User attempts to delete event they don't own
When: Delete action is initiated
Then: Error toast appears: "You do not have permission to cancel this event"
And: User remains on edit page
```

#### Event Already Cancelled
```
Given: Event is already cancelled
When: User attempts to access edit page
Then: Error toast appears: "Cannot edit a cancelled event"
And: User is redirected to event details page (read-only view)
```

## Test Scenarios

### Happy Path Tests
1. **Successful Event Cancellation**
   - Create published event with RSVPs
   - Navigate to edit page as organizer
   - Click delete, confirm both dialogs
   - Verify event status changes to 'cancelled'
   - Verify RSVPs are preserved
   - Verify redirect to events list

2. **Draft Event Cancellation**
   - Create draft event
   - Cancel through edit interface
   - Verify status changes appropriately

### Edge Case Tests
1. **No RSVPs**
   - Event with no attendees
   - Cancel successfully
   - Verify clean cancellation

2. **Multiple RSVPs**
   - Event with many attendees and waitlist
   - Cancel event
   - Verify all RSVP data preserved

3. **Permission Denied**
   - Non-organizer attempts to cancel
   - Verify 403 error and appropriate messaging

4. **Already Cancelled**
   - Attempt to cancel already cancelled event
   - Verify appropriate error handling

5. **Completed Event**
   - Attempt to cancel completed event
   - Verify operation blocked

### Error Handling Tests
1. **Network Failure**
   - Simulate network disconnection during cancel
   - Verify appropriate error messaging
   - Verify event status unchanged

2. **Concurrent Modification**
   - Two users attempt to cancel same event
   - Verify proper handling of conflicts

## API Testing

### Contract Test: Cancel Event
```typescript
// Test successful cancellation
const result = await cancelEvent('event-123')
expect(result.success).toBe(true)
expect(result.message).toBe('Event cancelled successfully')

// Verify database state
const event = await getEvent('event-123')
expect(event.status).toBe('cancelled')
expect(event.attendees).toBeDefined() // RSVPs preserved
```

### Integration Test: Full User Flow
```typescript
// Simulate complete user journey
- Login as event organizer
- Navigate to edit page
- Click delete button
- Confirm in dialogs
- Verify redirect and success message
- Verify event status in database
```

## Validation Checklist

### Functional Validation
- [ ] Delete button appears on edit page for organizers
- [ ] Confirmation dialogs work correctly
- [ ] Event status changes to 'cancelled'
- [ ] RSVPs and event data preserved
- [ ] Redirect to events list after successful cancellation
- [ ] Appropriate error messages for edge cases

### UI/UX Validation
- [ ] Delete button styling indicates destructive action
- [ ] Confirmation dialogs are clear and unambiguous
- [ ] Loading states provide appropriate feedback
- [ ] Success/error messages are user-friendly
- [ ] Mobile responsive design maintained

### Data Integrity Validation
- [ ] No data loss during cancellation
- [ ] Event history preserved
- [ ] RSVP records maintained
- [ ] Audit trail (updatedAt timestamp) updated

### Performance Validation
- [ ] Cancellation completes within 2 seconds
- [ ] No performance impact on other operations
- [ ] Database operations are efficient (single update)

## Troubleshooting

### Common Issues
1. **Delete button not visible**
   - Check user is event organizer
   - Verify event is not completed/cancelled
   - Check browser console for JavaScript errors

2. **Confirmation dialogs not appearing**
   - Verify modal library is loaded
   - Check for z-index conflicts
   - Test on different browsers

3. **API call fails**
   - Check network connectivity
   - Verify Firebase configuration
   - Check browser developer tools network tab

4. **Event status not updating**
   - Verify Firestore security rules
   - Check user authentication
   - Review server-side error logs

### Debug Commands
```bash
# Check event status in database
firebase firestore:query "events" --where "id == 'event-123'"

# Test API endpoint directly
curl -X POST /api/events/event-123/cancel \
  -H "Authorization: Bearer {token}"

# Check application logs
firebase functions:log