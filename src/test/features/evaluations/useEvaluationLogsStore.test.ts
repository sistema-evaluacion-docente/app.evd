import { act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const auth = vi.hoisted(() => ({ token: 'firebase-token' as string | null }))

vi.mock('@/features/auth', () => ({
  getToken: vi.fn().mockImplementation(() => Promise.resolve(auth.token)),
}))

const { useEvaluationLogsStore } = await import(
  '@/features/evaluations/store/useEvaluationLogsStore'
)

/** Stand-in for the browser WebSocket, controllable from the test. */
class FakeWebSocket {
  static instances: FakeWebSocket[] = []
  url: string
  onopen: (() => void) | null = null
  onmessage: ((event: { data: string }) => void) | null = null
  onerror: ((event: unknown) => void) | null = null
  onclose: ((event: { code: number }) => void) | null = null

  constructor(url: string) {
    this.url = url
    FakeWebSocket.instances.push(this)
  }

  // Real close() fires `close` asynchronously; left a no-op spy target here so
  // a plain disconnect doesn't also trigger the reconnect flow. Tests that
  // want that flow fire `onclose` themselves.
  close() {}
}

beforeEach(() => {
  vi.clearAllMocks()
  auth.token = 'firebase-token'
  FakeWebSocket.instances = []
  vi.stubGlobal('WebSocket', FakeWebSocket)
  useEvaluationLogsStore.setState({
    logs: [],
    lastEvent: null,
    status: 'disconnected',
    evaluationId: null,
    detailsUrl: undefined,
    queryKeysToInvalidate: [],
  })
})

afterEach(() => {
  useEvaluationLogsStore.getState().disconnect()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('connect', () => {
  it('resets logs, records the evaluation and starts connecting', async () => {
    useEvaluationLogsStore.getState().connect({ evaluationId: 7, detailsUrl: '/evaluaciones/7' })

    const state = useEvaluationLogsStore.getState()
    expect(state.evaluationId).toBe(7)
    expect(state.detailsUrl).toBe('/evaluaciones/7')
    expect(state.status).toBe('connecting')
    expect(state.logs).toEqual([])

    await act(async () => {})
    expect(FakeWebSocket.instances).toHaveLength(1)
    expect(FakeWebSocket.instances[0].url).toContain('/ws/evaluations/7?token=firebase-token')
  })

  it('drops any earlier connection before starting a new one', async () => {
    useEvaluationLogsStore.getState().connect({ evaluationId: 1 })
    await act(async () => {})
    const first = FakeWebSocket.instances[0]

    useEvaluationLogsStore.getState().connect({ evaluationId: 2 })
    await act(async () => {})

    expect(useEvaluationLogsStore.getState().evaluationId).toBe(2)
    expect(FakeWebSocket.instances).toHaveLength(2)
    expect(first.onopen).not.toBeNull() // was assigned, just no longer wired to the store
  })

  it('does not open a socket when there is no firebase token', async () => {
    auth.token = null

    useEvaluationLogsStore.getState().connect({ evaluationId: 1 })
    await act(async () => {})

    expect(FakeWebSocket.instances).toHaveLength(0)
  })
})

describe('the socket lifecycle', () => {
  it('flips to connected on open', async () => {
    useEvaluationLogsStore.getState().connect({ evaluationId: 1 })
    await act(async () => {})

    act(() => FakeWebSocket.instances[0].onopen?.())

    expect(useEvaluationLogsStore.getState().status).toBe('connected')
  })

  it('records a progress event as lastEvent', async () => {
    useEvaluationLogsStore.getState().connect({ evaluationId: 1 })
    await act(async () => {})

    act(() =>
      FakeWebSocket.instances[0].onmessage?.({
        data: JSON.stringify({
          type: 'evaluation_progress',
          evaluation_id: 1,
          stage: 'ANALYZING',
          timestamp: '2026-01-01T00:00:00Z',
        }),
      }),
    )

    expect(useEvaluationLogsStore.getState().lastEvent?.stage).toBe('ANALYZING')
  })

  it('appends a log event, but not a duplicate one', async () => {
    useEvaluationLogsStore.getState().connect({ evaluationId: 1 })
    await act(async () => {})
    const logEvent = {
      type: 'evaluation_log',
      evaluation_id: 1,
      level: 'info',
      message: 'Procesando',
      timestamp: '2026-01-01T00:00:00Z',
    }

    act(() => {
      FakeWebSocket.instances[0].onmessage?.({ data: JSON.stringify(logEvent) })
      FakeWebSocket.instances[0].onmessage?.({ data: JSON.stringify(logEvent) })
    })

    expect(useEvaluationLogsStore.getState().logs).toHaveLength(1)
  })

  it('swallows a message that is not valid JSON', async () => {
    useEvaluationLogsStore.getState().connect({ evaluationId: 1 })
    await act(async () => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => FakeWebSocket.instances[0].onmessage?.({ data: 'not json' })).not.toThrow()
  })

  it('flips to error on a socket error', async () => {
    useEvaluationLogsStore.getState().connect({ evaluationId: 1 })
    await act(async () => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})

    act(() => FakeWebSocket.instances[0].onerror?.(new Event('error')))

    expect(useEvaluationLogsStore.getState().status).toBe('error')
  })

  it('flips to error, without reconnecting, on an auth-rejection close code', async () => {
    useEvaluationLogsStore.getState().connect({ evaluationId: 1 })
    await act(async () => {})

    act(() => FakeWebSocket.instances[0].onclose?.({ code: 4001 }))

    expect(useEvaluationLogsStore.getState().status).toBe('error')
    expect(FakeWebSocket.instances).toHaveLength(1)
  })

  it('reconnects with backoff after an ordinary close', async () => {
    vi.useFakeTimers()
    useEvaluationLogsStore.getState().connect({ evaluationId: 1 })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    act(() => FakeWebSocket.instances[0].onclose?.({ code: 1006 }))

    expect(useEvaluationLogsStore.getState().status).toBe('disconnected')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })

    expect(FakeWebSocket.instances).toHaveLength(2)

    vi.useRealTimers()
  })

  it('ignores events from a socket the store has already moved on from', async () => {
    useEvaluationLogsStore.getState().connect({ evaluationId: 1 })
    await act(async () => {})
    const stale = FakeWebSocket.instances[0]

    useEvaluationLogsStore.getState().connect({ evaluationId: 2 })
    await act(async () => {})

    act(() => stale.onopen?.())

    expect(useEvaluationLogsStore.getState().status).not.toBe('connected')
    expect(useEvaluationLogsStore.getState().evaluationId).toBe(2)
  })
})

describe('disconnect', () => {
  it('closes the socket and resets to disconnected', async () => {
    useEvaluationLogsStore.getState().connect({ evaluationId: 1 })
    await act(async () => {})
    const closeSpy = vi.spyOn(FakeWebSocket.instances[0], 'close')

    useEvaluationLogsStore.getState().disconnect()

    expect(closeSpy).toHaveBeenCalled()
    const state = useEvaluationLogsStore.getState()
    expect(state.status).toBe('disconnected')
    expect(state.evaluationId).toBeNull()
  })

  it('is a no-op when nothing is connected', () => {
    expect(() => useEvaluationLogsStore.getState().disconnect()).not.toThrow()
  })
})

describe('clearLogs', () => {
  it('empties the log list', () => {
    useEvaluationLogsStore.setState({
      logs: [
        {
          type: 'evaluation_log',
          evaluation_id: 1,
          level: 'info',
          message: 'x',
          timestamp: '2026-01-01',
        },
      ],
    })

    useEvaluationLogsStore.getState().clearLogs()

    expect(useEvaluationLogsStore.getState().logs).toEqual([])
  })
})
