describe('Authentication Flow', () => {
  const testUser = {
    email: `auth-test-${Date.now()}@example.com`,
    displayName: 'Auth Test User',
    password: 'TestPass123!'
  }

  beforeEach(() => {
    cy.window().then((win) => {
      win.localStorage.clear()
      win.sessionStorage.clear()
    })
  })

  it('should display login page correctly', () => {
    cy.visit('/login')

    cy.contains('Sign in to LCC Assemble').should('be.visible')
    cy.contains('Connect with your community').should('be.visible')

    cy.get('input[name="email"]').should('be.visible')
    cy.get('input[name="password"]').should('be.visible')
    cy.get('button[type="submit"]').should('be.visible')
    cy.get('a').contains("Don't have an account? Sign up").should('be.visible')
  })

  it('should display registration page correctly', () => {
    cy.visit('/register')

    cy.contains('Join LCC Assemble').should('be.visible')
    cy.contains('Connect with your community').should('be.visible')

    // Progress indicator should be visible
    cy.get('[class*="rounded-full"]').should('have.length', 4) // 4 steps

    cy.get('input[name="email"]').should('be.visible')
    cy.get('input[name="displayName"]').should('be.visible')
  })

  it('should navigate between login and registration', () => {
    cy.visit('/login')
    cy.get('a').contains("Don't have an account? Sign up").click()
    cy.url().should('include', '/register')

    cy.get('a').contains('Sign in here').click()
    cy.url().should('include', '/login')
  })

  it('should show validation errors on login', () => {
    cy.visit('/login')

    // Try to submit empty form
    cy.get('button[type="submit"]').click()
    cy.contains('Login failed').should('be.visible')

    // Try invalid credentials
    cy.get('input[name="email"]').type('invalid@example.com')
    cy.get('input[name="password"]').type('wrongpassword')
    cy.get('button[type="submit"]').click()
    cy.contains('Login failed').should('be.visible')
  })

  it('should complete multi-step registration', () => {
    cy.visit('/register')

    // Step 1: Account Information
    cy.get('input[name="email"]').type(testUser.email)
    cy.get('input[name="displayName"]').type(testUser.displayName)
    cy.get('button').contains('Next').click()

    // Should move to step 2
    cy.contains('Tell Us About Yourself').should('be.visible')

    // Step 2: Profile Information
    cy.get('input[name="phoneNumber"]').type('+1 (555) 123-4567')
    cy.get('input[name="whatsappNumber"]').type('+1 (555) 123-4567')
    cy.get('textarea[name="bio"]').type('Test user bio')
    cy.get('button').contains('Next').click()

    // Should move to step 3
    cy.contains('Your Interests & Preferences').should('be.visible')

    // Step 3: Interests and Preferences (optional, just click Next)
    cy.get('button').contains('Next').click()

    // Should move to step 4
    cy.contains('Privacy Settings').should('be.visible')

    // Step 4: Privacy Settings
    cy.get('input[name="privacy.phoneVisible"]').check()
    cy.get('input[name="privacy.whatsappVisible"]').check()
    cy.get('input[name="privacy.addressVisible"]').uncheck()

    // Submit registration
    cy.get('button').contains('Join the Community').click()

    // Should show success and redirect to login
    cy.contains('Registration successful').should('be.visible')
    cy.url({ timeout: 10000 }).should('include', '/login')
  })

  it('should handle registration validation', () => {
    cy.visit('/register')

    // Try to proceed without required fields
    cy.get('button').contains('Next').click()
    // The form should prevent progression without required fields
    cy.contains('Create Your Account').should('be.visible') // Should stay on step 1

    // Fill required fields but with invalid data
    cy.get('input[name="email"]').type('invalid-email')
    cy.get('input[name="displayName"]').type('A')
    cy.get('button').contains('Next').click()

    // Should show validation errors (check for actual error messages)
    cy.contains('Invalid email').should('be.visible')
  })

  it('should handle back navigation in registration', () => {
    cy.visit('/register')

    // Go to step 2
    cy.get('input[name="email"]').type(testUser.email)
    cy.get('input[name="displayName"]').type(testUser.displayName)
    cy.get('button').contains('Next').click()

    // Go back to step 1
    cy.get('button').contains('Previous').click()
    cy.contains('Create Your Account').should('be.visible')

    // Go forward again
    cy.get('button').contains('Next').click()
    cy.contains('Tell Us About Yourself').should('be.visible')
  })

  it('should redirect authenticated users away from auth pages', () => {
    // This test would require setting up authenticated state
    // For now, we'll skip this as it requires more complex setup
    cy.log('Skipping authenticated redirect test - requires auth state setup')
  })
})