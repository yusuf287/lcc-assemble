import { defineConfig } from 'cypress'
import { devServer } from '@cypress/vite-dev-server'

export default defineConfig({
  component: {
    devServer,
    devServerConfig: {
      framework: 'react',
      bundler: 'vite'
    }
  },

  e2e: {
    baseUrl: 'http://localhost:5174',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    specPattern: 'tests/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'tests/e2e/support/e2e.ts'
  },

  video: false,
  screenshotOnRunFailure: true,
  defaultCommandTimeout: 10000,
  requestTimeout: 15000,
  responseTimeout: 15000,

  env: {
    // Add environment variables for testing
    TEST_USER_EMAIL: 'test@example.com',
    TEST_USER_PASSWORD: 'testpassword123'
  }
})