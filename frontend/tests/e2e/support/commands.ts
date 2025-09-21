// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

/// <reference types="cypress" />

// Custom commands for LCC Assemble E2E testing

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
      register(email: string, displayName: string): Chainable<void>
      logout(): Chainable<void>
      createEvent(eventData: any): Chainable<string>
      visitEventDetails(eventId: string): Chainable<void>
      rsvpToEvent(status: 'going' | 'maybe' | 'not_going', guestCount?: number): Chainable<void>
      claimBringListItem(itemName: string): Chainable<void>
    }
  }
}

// Login command
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login')
  cy.get('input[name="email"]').type(email)
  cy.get('input[name="password"]').type(password)
  cy.get('button[type="submit"]').click()
  cy.url({ timeout: 10000 }).should('include', '/dashboard')
})

// Register command
Cypress.Commands.add('register', (email: string, displayName: string) => {
  cy.visit('/register')

  // Step 1: Account Info
  cy.get('input[name="email"]').type(email).blur() // Add blur to trigger validation
  cy.get('input[name="displayName"]').type(displayName).blur()
  cy.get('button').contains('Next').click()

  // Step 2: Profile Info (optional, skip with Next)
  cy.get('button').contains('Next').click()

  // Step 3: Interests (optional, skip with Next)
  cy.get('button').contains('Next').click()

  // Step 4: Privacy Settings (required checkboxes)
  cy.get('input[name="privacy.phoneVisible"]').check().blur()
  cy.get('input[name="privacy.whatsappVisible"]').check().blur()
  cy.get('input[name="privacy.addressVisible"]').check().blur()
  cy.get('button[type="submit"]').contains('Join the Community').click()

  // Should redirect to login after successful registration
  cy.url({ timeout: 15000 }).should('include', '/login')
})

// Logout command
Cypress.Commands.add('logout', () => {
  cy.get('button').contains('Logout').click()
  cy.url().should('include', '/login')
})

// Create event command
Cypress.Commands.add('createEvent', (eventData: any) => {
  cy.visit('/events/create')

  // Step 1: Basic Info
  cy.get('input[name="title"]').type(eventData.title)
  cy.get('textarea').type(eventData.description) // Use textarea selector
  if (eventData.type) {
    cy.contains(eventData.type).click()
  }
  cy.get('button').contains('Next').click()

  // Step 2: Details
  cy.get('input[placeholder="e.g., Community Center"]').type(eventData.location.name)
  cy.get('input[placeholder="Full address for directions"]').type(eventData.location.address)
  // Set future date for dateTime
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + 7) // 7 days from now
  const dateTimeString = futureDate.toISOString().slice(0, 16)
  cy.get('input[type="datetime-local"]').type(dateTimeString)
  cy.get('input[placeholder="120"]').clear().type(eventData.duration.toString())
  cy.get('button').contains('Next').click()

  // Step 3: Settings (skip optional fields)
  cy.get('button').contains('Next').click()

  // Step 4: Review and Create
  cy.get('button[type="submit"]').contains('Create Event').click()

  // Wait for redirect and extract event ID from URL
  cy.url({ timeout: 10000 }).should('include', '/events/').then((url) => {
    const eventId = url.split('/events/')[1]
    return cy.wrap(eventId)
  })
})

// Visit event details
Cypress.Commands.add('visitEventDetails', (eventId: string) => {
  cy.visit(`/events/${eventId}`)
  cy.contains('Event Details').should('be.visible')
})

// RSVP to event
Cypress.Commands.add('rsvpToEvent', (status: 'going' | 'maybe' | 'not_going', guestCount = 0) => {
  // Click RSVP to Event button
  cy.get('button').contains('RSVP to Event').click()

  // Select status (radio buttons in RSVPForm)
  cy.get(`input[value="${status}"]`).check()

  // Add guest count if going (assuming there's a guest count input)
  if (status === 'going' && guestCount > 0) {
    cy.get('input[type="number"]').clear().type(guestCount.toString())
  }

  // Submit RSVP
  cy.get('button[type="submit"]').contains('RSVP').click()

  // Verify success
  cy.contains('RSVP updated successfully').should('be.visible')
})

// Claim bring list item
Cypress.Commands.add('claimBringListItem', (itemName: string) => {
  cy.contains(itemName).parent().within(() => {
    cy.get('button').contains("I'll Bring It").click()
  })
  cy.contains('Item claimed successfully').should('be.visible')
})

export {}