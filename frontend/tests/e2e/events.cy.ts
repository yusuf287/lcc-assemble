describe('Event Management', () => {
  const testUser = {
    email: 'event-test@example.com',
    password: 'TestPass123!'
  }

  const testEvent = {
    title: 'E2E Test Community Event',
    description: 'This is a test event created during E2E testing to verify event functionality.',
    type: 'celebration',
    location: {
      name: 'Test Community Center',
      address: '123 Test Street, Test City, ON'
    },
    dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    duration: 120,
    capacity: 10,
    bringList: true
  }

  beforeEach(() => {
    cy.login(testUser.email, testUser.password)
  })

  it('should display events page correctly', () => {
    cy.visit('/events')

    cy.contains('Events').should('be.visible')
    cy.contains('Discover and join community events').should('be.visible')

    // Should have filters and search
    cy.get('input[placeholder*="Search events"]').should('be.visible')
    cy.get('select').should('have.length.at.least', 2) // Type and status filters

    // Should have view toggle buttons
    cy.get('button').contains('Grid').should('be.visible')
    cy.get('button').contains('List').should('be.visible')

    // Should have create event button
    cy.get('button').contains('Create Event').should('be.visible')
  })

  it('should create a new event successfully', () => {
    cy.visit('/create-event')

    // Verify page loads
    cy.contains('Create New Event').should('be.visible')
    cy.contains('Bring your community together').should('be.visible')

    // Progress indicator should show step 1
    cy.get('[class*="bg-orange-500"]').should('contain', '1')

    // Step 1: Basic Info
    cy.get('input[name="title"]').type(testEvent.title)
    cy.get('textarea[name="description"]').type(testEvent.description)
    cy.contains(testEvent.type).click()
    cy.get('button').contains('Next').click()

    // Step 2: Details
    cy.get('input[name="location.name"]').type(testEvent.location.name)
    cy.get('input[name="location.address"]').type(testEvent.location.address)
    cy.get('input[name="dateTime"]').type(testEvent.dateTime)
    cy.get('input[name="duration"]').clear().type(testEvent.duration.toString())
    cy.get('button').contains('Next').click()

    // Step 3: Settings
    cy.get('input[name="capacity"]').type(testEvent.capacity.toString())
    cy.get('input[type="checkbox"]').check() // Enable bring list
    cy.get('button').contains('Next').click()

    // Step 4: Review
    cy.contains('Event Summary').should('be.visible')
    cy.contains(testEvent.title).should('be.visible')
    cy.contains(testEvent.description).should('be.visible')

    // Create event
    cy.get('button[type="submit"]').contains('Create Event').click()

    // Should redirect to event details
    cy.url({ timeout: 10000 }).should('include', '/events/')
    cy.contains(testEvent.title).should('be.visible')
    cy.contains('Event created successfully').should('be.visible')
  })

  it('should validate event creation form', () => {
    cy.visit('/create-event')

    // Try to proceed without required fields
    cy.get('button').contains('Next').click()
    cy.contains('Title is required').should('be.visible')
    cy.contains('Description is required').should('be.visible')

    // Fill title but not description
    cy.get('input[name="title"]').type('Test Event')
    cy.get('button').contains('Next').click()
    cy.contains('Description is required').should('be.visible')

    // Fill required fields and go to step 2
    cy.get('textarea[name="description"]').type('Test description')
    cy.get('button').contains('Next').click()

    // Step 2 validation
    cy.get('button').contains('Next').click()
    cy.contains('Location name is required').should('be.visible')
    cy.contains('Address is required').should('be.visible')

    // Test date validation (past date)
    cy.get('input[name="location.name"]').type('Test Location')
    cy.get('input[name="location.address"]').type('Test Address')
    cy.get('input[name="dateTime"]').type('2020-01-01T10:00') // Past date
    cy.get('button').contains('Next').click()
    cy.contains('Event must be in the future').should('be.visible')
  })

  it('should display event details correctly', () => {
    // Create an event first, then visit its details
    cy.createEvent(testEvent).then((eventId) => {
      cy.visit(`/events/${eventId}`)

      // Verify event details are displayed
      cy.contains(testEvent.title).should('be.visible')
      cy.contains(testEvent.description).should('be.visible')
      cy.contains(testEvent.location.name).should('be.visible')
      cy.contains(testEvent.location.address).should('be.visible')

      // Should show event stats
      cy.contains('Event Details').should('be.visible')
      cy.contains('Attendees').should('be.visible')

      // Should have RSVP button
      cy.get('button').contains(/RSVP|Update RSVP/).should('be.visible')

      // Should show bring list if enabled
      cy.contains('Bring List').should('be.visible')
    })
  })

  it('should handle RSVP functionality', () => {
    cy.createEvent(testEvent).then((eventId) => {
      cy.visit(`/events/${eventId}`)

      // RSVP as going
      cy.get('button').contains('RSVP').click()
      cy.get('input[value="going"]').check()
      cy.get('input[name="guestCount"]').type('1')
      cy.get('button').contains('Send RSVP').click()

      // Should show success message
      cy.contains('RSVP updated successfully').should('be.visible')

      // Should show user's RSVP status
      cy.contains('Going').should('be.visible')

      // Update RSVP
      cy.get('button').contains('Update RSVP').click()
      cy.get('input[value="maybe"]').check()
      cy.get('button').contains('Update RSVP').click()
      cy.contains('Maybe').should('be.visible')
    })
  })

  it('should handle bring list functionality', () => {
    cy.createEvent(testEvent).then((eventId) => {
      cy.visit(`/events/${eventId}`)

      // Should show bring list section
      cy.contains('Bring List').should('be.visible')

      // Should have claim buttons for available items
      cy.get('button').contains("I'll Bring It").should('exist')

      // Claim an item
      cy.get('button').contains("I'll Bring It").first().click()
      cy.contains('Item claimed successfully').should('be.visible')

      // Item should now show as claimed
      cy.contains('You are bringing this').should('be.visible')
    })
  })

  it('should handle event capacity limits', () => {
    const fullEvent = { ...testEvent, capacity: 1, title: 'Full Event Test' }

    cy.createEvent(fullEvent).then((eventId) => {
      // Create another user and RSVP to fill the event
      cy.log('Event capacity test would require multiple user accounts')
      // This test would need additional setup for multiple users
    })
  })

  it('should allow event organizer to edit event', () => {
    cy.createEvent(testEvent).then((eventId) => {
      cy.visit(`/events/${eventId}`)

      // Should show Edit Event button for organizer
      cy.get('button').contains('Edit Event').should('be.visible')

      // Click edit and verify navigation
      cy.get('button').contains('Edit Event').click()
      cy.url().should('include', '/edit')
    })
  })

  it('should filter events correctly', () => {
    cy.visit('/events')

    // Test type filter
    cy.get('select').first().select('potluck')
    cy.url().should('include', 'type=potluck')

    // Test status filter
    cy.get('select').last().select('published')
    cy.url().should('include', 'status=published')

    // Test search
    cy.get('input[placeholder*="Search events"]').type('test')
    cy.url().should('include', 'search=test')
  })

  it('should handle empty events state', () => {
    // This would require clearing all events or using a test database
    cy.log('Empty state test requires test database setup')
  })
})