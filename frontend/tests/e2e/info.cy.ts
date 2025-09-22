describe('Info Page', () => {
  beforeEach(() => {
    cy.visit('/info')
  })

  it('should display the info page correctly', () => {
    // Check main heading
    cy.contains('Lakeshore Cultural Committee').should('be.visible')
    cy.contains('LCC - Building Community Together').should('be.visible')

    // Check About section
    cy.contains('About LCC').should('be.visible')
    cy.contains('close-knit group of friends and families').should('be.visible')

    // Check What We Do section
    cy.contains('What We Do').should('be.visible')
    cy.contains('Cultural Festivals').should('be.visible')
    cy.contains('Sports Tournaments').should('be.visible')

    // Check Get In Touch section
    cy.contains('Get In Touch').should('be.visible')
    cy.contains('lakeshoreculturalcommittee@gmail.com').should('be.visible')
    cy.contains('+1 647 973 5359').should('be.visible')

    // Check call to action
    cy.contains('Ready to Join Us?').should('be.visible')
    cy.contains('Join the Community').should('be.visible')
    cy.contains('Sign In').should('be.visible')
  })

  it('should have working contact links', () => {
    // Test email link
    cy.contains('lakeshoreculturalcommittee@gmail.com').should('be.visible')

    // Test phone link
    cy.contains('+1 647 973 5359').should('be.visible')

    // Test WhatsApp link
    cy.contains('Message Us').should('be.visible')
  })

  it('should have navigation links', () => {
    // Check that Join the Community links to registration
    cy.contains('Join the Community').should('have.attr', 'href', '/register')

    // Check that Sign In links to login
    cy.contains('Sign In').should('have.attr', 'href', '/login')
  })

  it('should be mobile responsive', () => {
    // Test mobile viewport
    cy.viewport('iphone-6')
    cy.contains('Lakeshore Cultural Committee').should('be.visible')
    cy.contains('About LCC').should('be.visible')
  })
})