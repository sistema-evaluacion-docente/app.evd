import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { Router } from 'wouter'
import { memoryLocation } from 'wouter/memory-location'

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  })
}

function AllProviders({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
}

export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: AllProviders, ...options })
}

/**
 * Same, inside a memory router, for anything that links or navigates. Each call
 * owns its own URL and its own query cache, so one test's data can never answer
 * the next one's request.
 *
 * The recorded `history` is handed back for the cases that assert where a click
 * took the user.
 */
export function renderRouted(
  ui: ReactElement,
  { path = '/', ...options }: Omit<RenderOptions, 'wrapper'> & { path?: string } = {},
) {
  const { hook, history } = memoryLocation({ path, record: true })
  const client = createTestQueryClient()

  return {
    history,
    ...render(ui, {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>
          <Router hook={hook}>{children}</Router>
        </QueryClientProvider>
      ),
      ...options,
    }),
  }
}

export * from '@testing-library/react'
