# Quickstart Guide: LCC Assemble

## Overview
This quickstart guide validates the core user journey from registration to event participation. It ensures all critical features work together seamlessly.

## Prerequisites
- Firebase project configured with authentication, Firestore, and Storage
- Security rules deployed
- Application deployed to Firebase Hosting
- Test user accounts created

## Test User Setup
Create the following test accounts in Firebase Auth:
1. **Admin User**: admin@lccassemble.test
2. **Regular User 1**: member1@lccassemble.test
3. **Regular User 2**: member2@lccassemble.test
4. **Regular User 3**: member3@lccassemble.test

Set admin@lccassemble.test as admin in Firestore users collection.

## Core User Journey Test

### Step 1: User Registration
**Actor**: New community member
**Goal**: Create account and get approved

1. Navigate to application URL
2. Click "Join Community" or "Register"
3. Fill registration form:
   - Email: member1@lccassemble.test
   - Display Name: "Test Member 1"
   - Basic profile information
4. Submit registration
5. **Expected**: Account created with "pending" status, confirmation email sent

### Step 2: Admin Approval
**Actor**: Admin user
**Goal**: Approve new member registration

1. Login as admin@lccassemble.test
2. Navigate to Admin Dashboard
3. Find pending member in member management
4. Approve the registration
5. **Expected**: Member status changes to "approved", member receives notification

### Step 3: Profile Setup
**Actor**: Approved member
**Goal**: Complete profile with preferences

1. Login as member1@lccassemble.test
2. Navigate to Profile page
3. Complete profile information:
   - Bio and interests
   - Dietary preferences
   - Contact information with privacy settings
   - Profile photo upload
4. Save profile
5. **Expected**: Profile saved successfully, privacy settings respected

### Step 4: Event Creation
**Actor**: Community member
**Goal**: Create a community event

1. Login as member1@lccassemble.test
2. Navigate to Events page
3. Click "Create Event"
4. Fill event details:
   - Title: "LCC Community Potluck"
   - Description: "Monthly community gathering"
   - Date/Time: Next Saturday 6 PM
   - Location: Community Center
   - Type: "potluck"
   - Capacity: 20
   - Enable bring list
5. Add bring items: "Salad", "Dessert", "Drinks"
6. Upload cover image
7. Publish event
8. **Expected**: Event created and visible to community, notifications sent

### Step 5: Event Discovery and RSVP
**Actor**: Community member
**Goal**: Find and join community event

1. Login as member2@lccassemble.test
2. Navigate to Events page
3. View event list and filter by date/type
4. Click on "LCC Community Potluck"
5. View event details, photos, and bring list
6. RSVP as "Going" with 1 guest
7. Claim a bring item (e.g., "Salad")
8. **Expected**: RSVP recorded, guest count updated, bring item assigned

### Step 6: Member Directory
**Actor**: Community member
**Goal**: Connect with other members

1. Login as member2@lccassemble.test
2. Navigate to Members page
3. Search for "Test Member 1"
4. View member profile
5. Check privacy settings for contact info
6. Send WhatsApp message (if visible)
7. **Expected**: Profile viewable, privacy respected, contact options work

### Step 7: Event Management
**Actor**: Event organizer
**Goal**: Manage event and attendees

1. Login as member1@lccassemble.test
2. Navigate to "My Events"
3. Open "LCC Community Potluck"
4. View attendee list and RSVPs
5. Check bring list status
6. Add reminder notification
7. **Expected**: All attendee data visible, bring items tracked, notifications sent

### Step 8: Admin Oversight
**Actor**: Admin user
**Goal**: Monitor community activity

1. Login as admin@lccassemble.test
2. Navigate to Admin Dashboard
3. View community statistics
4. Review recent events
5. Check member activity
6. Moderate content if needed
7. **Expected**: Full visibility into community data, moderation tools functional

## Performance Validation

### Load Time Test
1. Clear browser cache
2. Navigate to application
3. Measure time to:
   - First contentful paint
   - Time to interactive
   - Full page load
4. **Expected**: <3s load time, <5s TTI

### Mobile Responsiveness Test
1. Use browser dev tools mobile view
2. Test all user flows on mobile
3. Verify touch interactions
4. **Expected**: Seamless mobile experience

### Offline Functionality Test
1. Enable offline mode in browser
2. Attempt core actions
3. Restore connection
4. **Expected**: Graceful degradation, data sync on reconnect

## Security Validation

### Authentication Test
1. Attempt access without login
2. Try invalid login credentials
3. Test password reset flow
4. **Expected**: Proper redirects and error messages

### Data Privacy Test
1. Login as different users
2. Check visibility of private information
3. Test privacy setting changes
4. **Expected**: Privacy controls enforced

### Input Validation Test
1. Submit forms with invalid data
2. Try XSS injection attempts
3. Upload invalid file types
4. **Expected**: Proper validation and sanitization

## Success Criteria
- [ ] All 8 steps of user journey complete successfully
- [ ] Performance metrics meet requirements
- [ ] Security validations pass
- [ ] Mobile experience seamless
- [ ] No critical bugs or errors
- [ ] All features work as specified

## Troubleshooting
- **Registration fails**: Check Firebase Auth configuration
- **Event not visible**: Verify Firestore security rules
- **Images not uploading**: Check Storage rules and permissions
- **RSVP not working**: Verify Firestore write permissions
- **Slow performance**: Check bundle size and optimization

## Next Steps
After successful quickstart validation:
1. Conduct community beta testing
2. Gather user feedback
3. Iterate on improvements
4. Plan production deployment