# E2E Testing with Cypress

This directory contains end-to-end tests for the LCC Assemble community platform using Cypress.

## Test Structure

### Test Files
- `user-journey.cy.ts` - Complete user journey from registration to event participation
- `auth.cy.ts` - Authentication and registration flows
- `events.cy.ts` - Event creation, management, and RSVP functionality
- `admin.cy.ts` - Admin dashboard and member management

### Support Files
- `support/commands.ts` - Custom Cypress commands for common actions
- `support/e2e.ts` - Global test configuration

### Location
All E2E tests are located in `tests/e2e/` alongside other test types (unit, integration, contract) for better organization.

## Running Tests

### Prerequisites
1. Start the development server:
   ```bash
   npm run dev
   ```

2. Ensure Firebase project is configured and accessible

### Run Tests
```bash
# Run all E2E tests headlessly
npm run test:e2e

# Open Cypress Test Runner (interactive)
npm run test:e2e:open

# Run specific test file
npx cypress run --spec "tests/e2e/user-journey.cy.ts"
```

## Test Data

Tests use dynamic test data to avoid conflicts:
- Unique email addresses with timestamps
- Test events with future dates
- Temporary user accounts

## Custom Commands

### Authentication
```typescript
cy.login(email, password)          // Login user
cy.register(email, displayName)    // Register new user
cy.logout()                        // Logout current user
```

### Events
```typescript
cy.createEvent(eventData)          // Create event and return ID
cy.visitEventDetails(eventId)      // Navigate to event details
cy.rsvpToEvent(status, guestCount) // RSVP to current event
cy.claimBringListItem(itemName)    // Claim bring list item
```

## Test Coverage

### User Journey
- ✅ User registration (multi-step)
- ✅ Email verification flow
- ✅ Profile setup and editing
- ✅ Event discovery and participation
- ✅ Community interaction

### Authentication
- ✅ Login/logout flows
- ✅ Registration validation
- ✅ Password reset (if implemented)
- ✅ Session management

### Event Management
- ✅ Event creation (all steps)
- ✅ Event editing (organizer only)
- ✅ RSVP functionality
- ✅ Bring list management
- ✅ Event capacity handling

### Admin Features
- ✅ Member approval workflow
- ✅ Member suspension/reactivation
- ✅ Community statistics
- ✅ Event monitoring

### Error Handling
- ✅ Form validation
- ✅ Network error handling
- ✅ Permission restrictions
- ✅ Edge cases

## Configuration

Tests run against `http://localhost:5173` by default. Update `cypress.config.ts` to change the base URL for different environments.

## Best Practices

1. **Test Isolation**: Each test is independent and cleans up after itself
2. **Dynamic Data**: Use timestamps and random data to avoid conflicts
3. **Realistic Scenarios**: Tests simulate actual user behavior
4. **Error Testing**: Include tests for error states and edge cases
5. **Performance**: Tests include timing assertions where appropriate

## CI/CD Integration

Add to your CI pipeline:
```yaml
- name: Run E2E Tests
  run: npm run test:e2e
  env:
    CYPRESS_BASE_URL: ${{ secrets.APP_URL }}
```

## Troubleshooting

### Common Issues
1. **Firebase Connection**: Ensure Firebase config is correct
2. **Timing Issues**: Use `cy.wait()` sparingly, prefer assertions
3. **Flaky Tests**: Add retry logic for network-dependent operations
4. **Data Conflicts**: Use unique test data to avoid conflicts

### Debug Mode
```bash
# Run with debug logging
DEBUG=cypress:* npm run test:e2e

# Run specific test file
npx cypress run --spec "cypress/e2e/auth.cy.ts"
```

## Contributing

When adding new tests:
1. Follow the existing naming conventions
2. Add appropriate data-testid attributes to components if needed
3. Include both positive and negative test cases
4. Document any new custom commands
5. Update this README with new test coverage