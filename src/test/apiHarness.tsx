import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { expect } from 'vitest'

/**
 * Harness for the `features/*\/api` modules — the TanStack hooks that wrap
 * `@/config/axios`.
 *
 * Every other test in the suite mocks these hooks away to drive a component;
 * these are the ones that exercise the hooks themselves, so what they mock is
 * axios instead. What is being checked is the contract with the backend: the
 * verb, the URL and the params each hook sends.
 */

/** Config object an axios call carries, as a test reads it back. */
interface ApiCallConfig {
  params?: Record<string, unknown>
  [key: string]: unknown
}

/** One recorded axios call: the URL it hit and the config it carried. */
export type ApiCall = [url: string, config: ApiCallConfig]

/** The mocked axios method a test asserts against (`mockApi.get`, …). */
type MockedMethod = { mock: { calls: unknown[][] } }

/**
 * A fresh client per render. A shared cache would let one test's response
 * answer the next test's query, and the request under assertion would silently
 * never be made.
 */
function freshWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

export function renderApiHook<T>(hook: () => T) {
  return renderHook(hook, { wrapper: freshWrapper() })
}

/**
 * Waits until the query has stopped fetching — either because it resolved, or
 * because it was disabled and never started. Both are states a test wants to
 * assert against, and neither is observable without waiting first.
 */
export async function settled(result: { current: { fetchStatus: string } }) {
  await waitFor(() => expect(result.current.fetchStatus).toBe('idle'))
}

/** Renders a query hook and hands back the axios calls it produced. */
async function callsFrom<T extends { fetchStatus: string }>(
  hook: () => T,
  method: MockedMethod,
): Promise<unknown[][]> {
  const before = method.mock.calls.length
  const { result } = renderApiHook(hook)

  await settled(result)

  return method.mock.calls.slice(before)
}

/**
 * The request a query hook made, for asserting the URL and params on. Fails the
 * test when the hook asked for nothing — a disabled query is `askedNothing`.
 */
export async function requestOf<T extends { fetchStatus: string }>(
  hook: () => T,
  method: MockedMethod,
): Promise<ApiCall> {
  const calls = await callsFrom(hook, method)

  expect(calls, 'the hook was expected to make a request, but made none').not.toHaveLength(0)

  return calls[0] as ApiCall
}

/**
 * Whether a query hook stayed quiet — the `enabled: false` path every one of
 * these modules uses to hold a request back until its inputs are known.
 */
export async function askedNothing<T extends { fetchStatus: string }>(
  hook: () => T,
  method: MockedMethod,
): Promise<boolean> {
  return (await callsFrom(hook, method)).length === 0
}
