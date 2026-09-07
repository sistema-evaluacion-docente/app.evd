import { defineConfig } from 'cypress'
import { loadEnv } from 'vite'

const env = loadEnv('development', process.cwd(), 'VITE_')

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    video: false,
    viewportWidth: 1280,
    viewportHeight: 800,
    expose: {
      apiUrl: env.VITE_API_URL || 'http://localhost:8000',
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    },
  },
})
