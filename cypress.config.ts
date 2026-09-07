import { readFileSync } from 'node:fs'

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
      firebaseApiKey: env.VITE_FIREBASE_API_KEY,
    },
    setupNodeEvents(on) {
      on('task', {
        async uploadMultipart({
          url,
          token,
          files,
        }: {
          url: string
          token: string
          files: Array<{ filename: string; path: string }>
        }) {
          const formData = new FormData()

          for (const { filename, path } of files) {
            formData.append(
              'file',
              new Blob([readFileSync(path)], { type: 'application/pdf' }),
              filename,
            )
          }

          const response = await fetch(url, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          })

          return { status: response.status, body: await response.json() }
        },
      })
    },
  },
})
