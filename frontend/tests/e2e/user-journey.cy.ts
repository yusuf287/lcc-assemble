describe('LCC Assemble - Complete User Journey', () => {
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    displayName: 'Test Community Member',
    password: 'TestPass123!'
  }

  const testEvent = {
    title: 'Community Potluck Test Event',
    description: 'A test event for our community gathering with delicious food and great conversations.',
    type: 'potluck',
    location: {
      name: 'Community Center',
      address: '123 Main Street, Anytown, ON'
    },
    dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // 1 week from now
    duration: 180, // 3 hours
    capacity: 20,
    bringList: true
  }

  beforeEach(() => {
    // Clear any existing auth state
    cy.window().then((win) => {
      win.localStorage.clear()
      win.sessionStorage.clear()
    })
  })

  it('should complete full user registration and login flow', () => {
    // Visit registration page
    cy.visit('/register')

    // Verify page loads
    cy.contains('Join LCC Assemble').should('be.visible')
    cy.contains('Connect with your community').should('be.visible')

    // Step 1: Account Information
    cy.get('input[name="email"]').type(testUser.email)
    cy.get('input[name="displayName"]').type(testUser.displayName)
    cy.get('button').contains('Next').click()

    // Step 2: Profile Information
    cy.get('input[name="phoneNumber"]').type('+1 (555) 123-4567')
    cy.get('input[name="whatsappNumber"]').type('+1 (555) 123-4567')
    cy.get('textarea[name="bio"]').type('I love community events and meeting new people!')
    cy.get('input[name="address.street"]').type('456 Oak Street')
    cy.get('input[name="address.city"]').type('Test City')
    cy.get('input[name="address.postalCode"]').type('A1A 1A1')
    cy.get('button').contains('Next').click()

    // Step 3: Interests and Preferences
    cy.contains('Your Interests & Preferences').should('be.visible')
    cy.get('input[placeholder="Add an interest..."]').type('Cooking')
    cy.get('button').contains('Add').click()
    cy.get('input[placeholder="Add a dietary preference..."]').type('Vegetarian')
    cy.get('button').contains('Add').click()
    cy.get('button').contains('Next').click()

    // Step 4: Privacy Settings
    cy.contains('Privacy Settings').should('be.visible')
    cy.get('input[name="privacy.phoneVisible"]').check()
    cy.get('input[name="privacy.whatsappVisible"]').check()
    cy.get('input[name="privacy.addressVisible"]').uncheck()
    cy.get('button').contains('Join the Community').click()

    // Should redirect to login with success message
    cy.url().should('include', '/login')
    cy.contains('Registration successful').should('be.visible')

    // Login with the temporary password shown
    cy.get('input[name="email"]').type(testUser.email)
    cy.get('input[name="password"]').type('temporary') // This would be the actual temp password
    cy.get('button[type="submit"]').click()

    // Should redirect to dashboard
    cy.url({ timeout: 10000 }).should('include', '/dashboard')
    cy.contains(`Welcome, ${testUser.displayName}`).should('be.visible')
  })

  it('should allow user to create and manage an event', () => {
    // Assume user is logged in from previous test
    cy.login(testUser.email, testUser.password)

    // Navigate to create event
    cy.visit('/create-event')

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

    // Step 4: Review and Create
    cy.contains('Event Summary').should('be.visible')
    cy.get('button[type="submit"]').contains('Create Event').click()

    // Should redirect to event details
    cy.url({ timeout: 10000 }).should('include', '/events/')
    cy.contains(testEvent.title).should('be.visible')
    cy.contains('Event created successfully').should('be.visible')
  })

  it('should allow RSVP and bring list management', () => {
    // Assume user is logged in and event exists
    cy.login(testUser.email, testUser.password)

    // Visit the created event
    cy.visit('/events') // Would need to find the event ID
    cy.contains(testEvent.title).click()

    // RSVP to event
    cy.get('button').contains('RSVP').click()
    cy.get('input[value="going"]').check()
    cy.get('input[name="guestCount"]').type('2')
    cy.get('button').contains('Send RSVP').click()
    cy.contains('RSVP updated successfully').should('be.visible')

    // Claim a bring list item
    cy.contains('Bring List').should('be.visible')
    cy.get('button').contains("I'll Bring It").first().click()
    cy.contains('Item claimed successfully').should('be.visible')
  })

  it('should allow profile management', () => {
    cy.login(testUser.email, testUser.password)

    // Navigate to profile
    cy.visit('/profile')

    // Edit profile
    cy.contains('Edit Profile').should('be.visible')
    cy.get('input[name="displayName"]').clear().type('Updated Test Member')
    cy.get('textarea[name="bio"]').clear().type('Updated bio for testing')
    cy.get('button').contains('Save Profile').click()

    // Verify changes
    cy.contains('Profile updated successfully').should('be.visible')
    cy.contains('Updated Test Member').should('be.visible')
  })

  it('should display member directory correctly', () => {
    cy.login(testUser.email, testUser.password)

    // Visit members page
    cy.visit('/members')

    // Should show member cards
    cy.contains('Community Members').should('be.visible')
    cy.get('[data-testid="member-card"]').should('have.length.greaterThan', 0)

    // Should show contact options
    cy.get('button').contains('WhatsApp').should('be.visible')
    cy.get('button').contains('Email').should('be.visible')
  })

  it('should provide admin functionality', () => {
    // Login as admin (would need admin credentials)
    cy.login('admin@lccassemble.com', 'adminpassword')

    // Visit admin dashboard
    cy.visit('/admin')

    // Should show admin stats
    cy.contains('Admin Dashboard').should('be.visible')
    cy.contains('Total Members').should('be.visible')
    cy.contains('Pending Approval').should('be.visible')

    // Should show member management options
    cy.get('button').contains('Approve').should('exist')
    cy.get('button').contains('Suspend').should('exist')
  })

  it('should handle error states gracefully', () => {
    // Test invalid login
    cy.visit('/login')
    cy.get('input[name="email"]').type('invalid@example.com')
    cy.get('input[name="password"]').type('wrongpassword')
    cy.get('button[type="submit"]').click()
    cy.contains('Login failed').should('be.visible')

    // Test event creation validation
    cy.login(testUser.email, testUser.password)
    cy.visit('/create-event')
    cy.get('button').contains('Next').click()
    cy.contains('Title is required').should('be.visible')
  })

  it('should be mobile responsive', () => {
    cy.viewport('iphone-x')
    cy.login(testUser.email, testUser.password)
    cy.visit('/dashboard')

    // Should work on mobile
    cy.contains('Dashboard').should('be.visible')
    cy.get('[data-testid="mobile-menu"]').should('be.visible')
  })
})