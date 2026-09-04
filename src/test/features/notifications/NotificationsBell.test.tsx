import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { NotificationsBell } from '@/features/notifications/components/NotificationsBell'
import type { Notification } from '@/features/notifications/types/Notification'
import { renderRouted, screen } from '@/test/render'

const state = vi.hoisted(() => ({
  notifications: [] as Notification[],
  unreadCount: 0,
  isLoading: false,
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
}))

vi.mock('@/features/notifications/hooks/useNotifications', () => ({
  useNotifications: () => state,
}))

vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
)

function notification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: 1,
    user_id: 1,
    title: 'Nueva evaluación',
    message: 'Se cargó una evaluación',
    type: 'info',
    read: false,
    created_at: '2028-01-01T00:00:00Z',
    updated_at: '2028-01-01T00:00:00Z',
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  state.notifications = []
  state.unreadCount = 0
  state.isLoading = false
})

describe('NotificationsBell', () => {
  it('shows no badge without unread notifications', () => {
    renderRouted(<NotificationsBell />)

    expect(screen.queryByText(/^\d+\+?$/)).not.toBeInTheDocument()
  })

  it('badges the unread count, capping the display at 99+', () => {
    state.unreadCount = 250
    renderRouted(<NotificationsBell />)

    expect(screen.getByText('99+')).toBeInTheDocument()
  })

  it('shows the loading skeleton while notifications are on their way', async () => {
    state.isLoading = true
    const user = userEvent.setup()
    renderRouted(<NotificationsBell />)

    await user.click(screen.getByRole('button', { name: 'Notificaciones' }))

    await vi.waitFor(() =>
      expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0),
    )
  })

  it('shows the empty state with none', async () => {
    const user = userEvent.setup()
    renderRouted(<NotificationsBell />)

    await user.click(screen.getByRole('button', { name: 'Notificaciones' }))

    expect(await screen.findByText('No tienes notificaciones')).toBeInTheDocument()
  })

  it('lists notifications and marks one as read', async () => {
    state.notifications = [notification({ id: 3 })]
    state.unreadCount = 1
    const user = userEvent.setup()
    renderRouted(<NotificationsBell />)

    await user.click(screen.getByRole('button', { name: 'Notificaciones' }))
    await screen.findByText('Nueva evaluación')
    await user.click(screen.getByRole('button', { name: 'Marcar como leída' }))

    expect(state.markAsRead).toHaveBeenCalledWith([3])
  })

  it('marks every notification read from the header action', async () => {
    state.notifications = [notification()]
    state.unreadCount = 1
    const user = userEvent.setup()
    renderRouted(<NotificationsBell />)

    await user.click(screen.getByRole('button', { name: 'Notificaciones' }))
    await user.click(await screen.findByRole('button', { name: 'Marcar todas como leídas' }))

    expect(state.markAllAsRead).toHaveBeenCalled()
  })

  it('links to the full notifications page', async () => {
    const user = userEvent.setup()
    renderRouted(<NotificationsBell />)

    await user.click(screen.getByRole('button', { name: 'Notificaciones' }))

    expect(
      await screen.findByRole('link', { name: 'Ver todas las notificaciones' }),
    ).toHaveAttribute('href', '/notificaciones')
  })
})
