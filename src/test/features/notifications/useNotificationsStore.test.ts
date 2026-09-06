import { act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Notification } from '@/features/notifications/types/Notification'

const api = vi.hoisted(() => ({
  getMyNotifications: vi.fn(),
  getUnreadCount: vi.fn(),
  markAllAsReadApi: vi.fn(),
  markAsReadApi: vi.fn(),
}))

const auth = vi.hoisted(() => ({ token: 'firebase-token' as string | null }))

vi.mock('@/features/notifications/api', () => api)

vi.mock('@/features/auth', () => ({
  getToken: vi.fn().mockImplementation(() => Promise.resolve(auth.token)),
  useAuthStore: { getState: () => ({ token: auth.token }) },
}))

const { useNotificationsStore } = await import('@/features/notifications/store/useNotificationsStore')

/** Stand-in for the browser WebSocket, controllable from the test. */
class FakeWebSocket {
  static instances: FakeWebSocket[] = []
  url: string
  onopen: (() => void) | null = null
  onmessage: ((event: { data: string }) => void) | null = null
  onerror: ((event: unknown) => void) | null = null
  onclose: (() => void) | null = null

  constructor(url: string) {
    this.url = url
    FakeWebSocket.instances.push(this)
  }

  // A real socket fires `close` asynchronously, whether the app closed it or
  // the connection just dropped. Left as a no-op spy target here — tests that
  // want the reconnect flow fire `onclose` themselves instead.
  close() {}
}

const notification: Notification = {
  id: 1,
  user_id: 1,
  title: 'Hola',
  message: 'Tienes una novedad',
  type: 'info',
  read: false,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
}

beforeEach(() => {
  vi.clearAllMocks()
  auth.token = 'firebase-token'
  FakeWebSocket.instances = []
  vi.stubGlobal('WebSocket', FakeWebSocket)
  useNotificationsStore.setState({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
  })
})

afterEach(() => {
  useNotificationsStore.getState().disconnectWebSocket()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('fetchNotifications', () => {
  it('does nothing without a token', async () => {
    auth.token = null

    await useNotificationsStore.getState().fetchNotifications()

    expect(api.getMyNotifications).not.toHaveBeenCalled()
  })

  it('loads the list and the unread count', async () => {
    api.getMyNotifications.mockResolvedValue({ data: [notification] })
    api.getUnreadCount.mockResolvedValue({ data: { unread_count: 3 } })

    await useNotificationsStore.getState().fetchNotifications()

    const state = useNotificationsStore.getState()
    expect(state.notifications).toEqual([notification])
    expect(state.unreadCount).toBe(3)
    expect(state.isLoading).toBe(false)
  })

  it('records the error message on failure', async () => {
    api.getMyNotifications.mockRejectedValue(new Error('caído'))
    api.getUnreadCount.mockResolvedValue({ data: { unread_count: 0 } })

    await useNotificationsStore.getState().fetchNotifications()

    expect(useNotificationsStore.getState().error).toBe('caído')
  })
})

describe('markAsRead', () => {
  it('marks only the given ids read and decrements the unread count', async () => {
    api.markAsReadApi.mockResolvedValue({})
    useNotificationsStore.setState({
      notifications: [notification, { ...notification, id: 2 }],
      unreadCount: 2,
    })

    await useNotificationsStore.getState().markAsRead([1])

    const state = useNotificationsStore.getState()
    expect(state.notifications.find((n) => n.id === 1)?.read).toBe(true)
    expect(state.notifications.find((n) => n.id === 2)?.read).toBe(false)
    expect(state.unreadCount).toBe(1)
  })

  it('swallows an API failure', async () => {
    api.markAsReadApi.mockRejectedValue(new Error('boom'))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(useNotificationsStore.getState().markAsRead([1])).resolves.toBeUndefined()
  })
})

describe('markAllAsRead', () => {
  it('marks every notification read and zeroes the unread count', async () => {
    api.markAllAsReadApi.mockResolvedValue({})
    useNotificationsStore.setState({ notifications: [notification], unreadCount: 1 })

    await useNotificationsStore.getState().markAllAsRead()

    const state = useNotificationsStore.getState()
    expect(state.notifications.every((n) => n.read)).toBe(true)
    expect(state.unreadCount).toBe(0)
  })

  it('swallows an API failure', async () => {
    api.markAllAsReadApi.mockRejectedValue(new Error('boom'))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(useNotificationsStore.getState().markAllAsRead()).resolves.toBeUndefined()
  })
})

describe('connectWebSocket', () => {
  it('fetches notifications and opens a socket once a token is available', async () => {
    api.getMyNotifications.mockResolvedValue({ data: [] })
    api.getUnreadCount.mockResolvedValue({ data: { unread_count: 0 } })

    await useNotificationsStore.getState().connectWebSocket()

    expect(FakeWebSocket.instances).toHaveLength(1)
    expect(FakeWebSocket.instances[0].url).toContain('/ws/notifications?token=firebase-token')
  })

  it('does not open a socket when there is no firebase token', async () => {
    auth.token = null
    api.getMyNotifications.mockResolvedValue({ data: [] })
    api.getUnreadCount.mockResolvedValue({ data: { unread_count: 0 } })

    await useNotificationsStore.getState().connectWebSocket()

    expect(FakeWebSocket.instances).toHaveLength(0)
  })

  it('does not open a second socket while one is already connecting', async () => {
    api.getMyNotifications.mockResolvedValue({ data: [] })
    api.getUnreadCount.mockResolvedValue({ data: { unread_count: 0 } })

    await Promise.all([
      useNotificationsStore.getState().connectWebSocket(),
      useNotificationsStore.getState().connectWebSocket(),
    ])

    expect(FakeWebSocket.instances).toHaveLength(1)
  })

  it('prepends a new notification pushed over the socket', async () => {
    api.getMyNotifications.mockResolvedValue({ data: [] })
    api.getUnreadCount.mockResolvedValue({ data: { unread_count: 0 } })
    await useNotificationsStore.getState().connectWebSocket()
    const ws = FakeWebSocket.instances[0]

    act(() => {
      ws.onopen?.()
      ws.onmessage?.({
        data: JSON.stringify({
          type: 'notification',
          timestamp: '2026-01-01',
          notification_id: 42,
          user_id: 1,
          title: 'Nueva',
          message: 'Llegó algo',
          notification_type: 'success',
        }),
      })
    })

    const state = useNotificationsStore.getState()
    expect(state.notifications[0].id).toBe(42)
    expect(state.unreadCount).toBe(1)
  })

  it('ignores a duplicate notification id from the socket', async () => {
    api.getMyNotifications.mockResolvedValue({ data: [notification] })
    api.getUnreadCount.mockResolvedValue({ data: { unread_count: 1 } })
    await useNotificationsStore.getState().connectWebSocket()
    const ws = FakeWebSocket.instances[0]

    act(() => {
      ws.onmessage?.({
        data: JSON.stringify({
          type: 'notification',
          timestamp: '2026-01-01',
          notification_id: notification.id,
          user_id: 1,
          title: 'Repetida',
          message: 'x',
          notification_type: 'info',
        }),
      })
    })

    expect(useNotificationsStore.getState().notifications).toHaveLength(1)
  })

  it('swallows a message that is not valid JSON', async () => {
    api.getMyNotifications.mockResolvedValue({ data: [] })
    api.getUnreadCount.mockResolvedValue({ data: { unread_count: 0 } })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    await useNotificationsStore.getState().connectWebSocket()
    const ws = FakeWebSocket.instances[0]

    expect(() => ws.onmessage?.({ data: 'not json' })).not.toThrow()
  })

  it('logs a socket error without throwing', async () => {
    api.getMyNotifications.mockResolvedValue({ data: [] })
    api.getUnreadCount.mockResolvedValue({ data: { unread_count: 0 } })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    await useNotificationsStore.getState().connectWebSocket()

    expect(() => FakeWebSocket.instances[0].onerror?.(new Event('error'))).not.toThrow()
  })

  it('reconnects after the socket closes, and stops once the retry limit is hit', async () => {
    vi.useFakeTimers()
    api.getMyNotifications.mockResolvedValue({ data: [] })
    api.getUnreadCount.mockResolvedValue({ data: { unread_count: 0 } })
    vi.spyOn(console, 'log').mockImplementation(() => {})

    await useNotificationsStore.getState().connectWebSocket()
    FakeWebSocket.instances[0].onclose?.()

    expect(FakeWebSocket.instances).toHaveLength(1)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000)
    })

    expect(FakeWebSocket.instances).toHaveLength(2)

    vi.useRealTimers()
  })
})

describe('disconnectWebSocket', () => {
  it('closes an open socket', async () => {
    api.getMyNotifications.mockResolvedValue({ data: [] })
    api.getUnreadCount.mockResolvedValue({ data: { unread_count: 0 } })
    await useNotificationsStore.getState().connectWebSocket()
    const closeSpy = vi.spyOn(FakeWebSocket.instances[0], 'close')

    useNotificationsStore.getState().disconnectWebSocket()

    expect(closeSpy).toHaveBeenCalled()
  })

  it('is a no-op when nothing is connected', () => {
    expect(() => useNotificationsStore.getState().disconnectWebSocket()).not.toThrow()
  })
})
