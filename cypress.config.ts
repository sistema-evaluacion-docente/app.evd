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

        /**
         * Uploads an evaluation PDF and, the instant the `202` comes back,
         * opens the real progress WebSocket channel (`GET /ws/evaluations`)
         * to record every event pushed while the background task runs.
         * There is no replay: a client that connects late misses whatever
         * already fired, so this races the WS handshake against the upload
         * response from Node — a Cypress command round-trips through the
         * browser and loses that race. Node 20's global `WebSocket` (undici)
         * is enough; no need for the `ws` package.
         */
        async uploadAndWatchProgress({
          url,
          wsBase,
          token,
          files,
          maxWaitMs = 5000,
        }: {
          url: string
          wsBase: string
          token: string
          files: Array<{ filename: string; path: string }>
          maxWaitMs?: number
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

          const status = response.status
          const body = await response.json()
          const events: unknown[] = []

          if (status !== 202) return { status, body, events }

          await new Promise<void>((resolve) => {
            const socket = new WebSocket(`${wsBase}/${body.data.id}?token=${token}`)
            let settled = false

            const finish = () => {
              if (settled) return
              settled = true
              clearTimeout(timer)
              socket.close()
              resolve()
            }

            const timer = setTimeout(finish, maxWaitMs)

            socket.onmessage = (event) => {
              const data = JSON.parse(event.data as string)

              events.push(data)

              if (
                data.type === 'evaluation_progress' &&
                data.stage === 'UPLOADING' &&
                (data.status === 'COMPLETED' || data.status === 'FAILED')
              ) {
                finish()
              }
            }

            socket.onerror = finish
            socket.onclose = finish
          })

          return { status, body, events }
        },
      })
    },
  },
})
