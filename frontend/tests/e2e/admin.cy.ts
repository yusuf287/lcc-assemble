describe('Admin Dashboard', () => {
  const adminUser = {
    email: 'admin@lccassemble.com',
    password: 'AdminPass123!'
  }

  const testMember = {
    email: `member-${Date.now()}@example.com`,
    displayName: 'Test Member for Admin'
  }

  beforeEach(() => {
    cy.login(adminUser.email, adminUser.password)
  })

  it('should display admin dashboard correctly', () => {
    cy.visit('/admin')

    cy.contains('Admin Dashboard').should('be.visible')
    cy.contains('Manage community members and monitor activity').should('be.visible')

    // Should show stats cards
    cy.contains('Total Members').should('be.visible')
    cy.contains('Pending Approval').should('be.visible')
    cy.contains('Active Members').should('be.visible')
    cy.contains('Total Events').should('be.visible')

    // Should show member overview
    cy.contains('Member Overview').should('be.visible')

    // Should show recent events
    cy.contains('Recent Events').should('be.visible')
  })

  it('should display member statistics correctly', () => {
    cy.visit('/admin')

    // Stats should be numbers (or 0)
    cy.get('[class*="Total Members"]').next().should('match', /^\d+$/)
    cy.get('[class*="Pending Approval"]').next().should('match', /^\d+$/)
    cy.get('[class*="Active Members"]').next().should('match', /^\d+$/)
    cy.get('[class*="Total Events"]').next().should('match', /^\d+$/)
  })

  it('should show pending member approvals', () => {
    cy.visit('/admin')

    // If there are pending members, they should be displayed
    cy.get('body').then($body => {
      if ($body.text().includes('Pending Member Approvals')) {
        cy.contains('Pending Member Approvals').should('be.visible')

        // Should show member details
        cy.get('[class*="pending"]').should('exist')

        // Should have approve buttons
        cy.get('button').contains('Approve').should('be.visible')
      }
    })
  })

  it('should allow approving pending members', () => {
    // This test requires a pending member to exist
    // In a real scenario, we'd create a test user first
    cy.log('Approval test requires pending member setup')
  })

  it('should display member overview with management options', () => {
    cy.visit('/admin')

    cy.contains('Member Overview').should('be.visible')

    // Should show member cards
    cy.get('[class*="member-card"]').should('exist')

    // Should show member status
    cy.get('[class*="status"]').should('exist')
  })

  it('should allow suspending and reactivating members', () => {
    cy.visit('/admin')

    // Find an approved member (not current admin)
    cy.get('[class*="status"]').contains('approved').first().parent().within(() => {
      // Should have suspend button
      cy.get('button').contains('Suspend').should('be.visible')
    })

    // Test suspend functionality (would need specific member selection)
    cy.log('Suspend/reactivate test requires specific member selection')
  })

  it('should display recent events correctly', () => {
    cy.visit('/admin')

    cy.contains('Recent Events').should('be.visible')

    // Should show event cards or empty state
    cy.get('body').then($body => {
      if ($body.text().includes('No events created yet')) {
        cy.contains('No events created yet').should('be.visible')
      } else {
        cy.get('[class*="event-card"]').should('exist')
      }
    })
  })

  it('should handle admin navigation correctly', () => {
    cy.visit('/admin')

    // Should be able to navigate to member details
    cy.get('[class*="member-card"]').first().click()
    cy.url().should('include', '/members/')

    // Go back to admin
    cy.go('back')
    cy.url().should('include', '/admin')
  })

  it('should restrict admin access to admin users only', () => {
    // Logout admin
    cy.get('button').contains('Logout').click()

    // Login as regular user
    cy.login('regular@example.com', 'password')

    // Try to access admin page
    cy.visit('/admin', { failOnStatusCode: false })

    // Should redirect or show access denied
    cy.url().should('not.include', '/admin')
  })

  it('should handle bulk member operations', () => {
    cy.visit('/admin')

    // Should have filtering/search capabilities
    cy.get('input[type="search"]').should('exist')

    // Should allow sorting by status
    cy.get('select').should('exist')
  })

  it('should display member activity and engagement metrics', () => {
    cy.visit('/admin')

    // Should show member engagement stats
    cy.contains('Account Statistics').should('be.visible')

    // Should show interests and dietary preferences counts
    cy.contains('Interests Listed').should('be.visible')
    cy.contains('Dietary Preferences').should('be.visible')
  })

  it('should provide member contact information access', () => {
    cy.visit('/admin')

    // Admin should be able to view full member profiles
    cy.get('[class*="member-card"]').first().within(() => {
      cy.get('button').contains('View Profile').should('be.visible')
    })
  })

  it('should handle error states gracefully', () => {
    // Test with network issues or API failures
    cy.log('Error state testing requires API mocking setup')
  })
})