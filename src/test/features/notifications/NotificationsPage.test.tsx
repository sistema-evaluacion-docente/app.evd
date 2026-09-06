import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useGetMyNotifications } from '@/features/notifications/api'
import { useNotifications } from '@/features/notifications/hooks'
import NotificationsPage from '@/features/notifications/pages/NotificationsPage'
import type { Notification } from '@/features/notifications/types/Notification'
import { renderRouted, screen, waitFor } from '@/test/render'

vi.mock('@/features/notifications/api', () => ({ useGetMyNotifications: vi.fn() }))
vi.mock('@/features/notifications/hooks', () => ({ useNotifications: vi.fn() }))

const markAsRead = vi.fn()
const markAllAsRead = vi.fn()
const refetch = vi.fn()

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

function mockList(
  data: { data: Notification[]; pagination: { pages: number } } | undefined,
  overrides: Partial<ReturnType<typeof useGetMyNotifications>> = {},
) {
  vi.mocked(useGetMyNotifications).mockReturnValue({
    data,
    isPending: false,
    isFetching: false,
    error: null,
    refetch,
    ...overrides,
  } as unknown as ReturnType<typeof useGetMyNotifications>)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useNotifications).mockReturnValue({
    unreadCount: 0,
    markAsRead,
    markAllAsRead,
  } as unknown as ReturnType<typeof useNotifications>)
})

describe('NotificationsPage', () => {
  it('shows the skeleton while loading', () => {
    mockList(undefined, { isPending: true })

    const { container } = renderRouted(<NotificationsPage />)

    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
  })

  it('shows the error message when the list fails to load', () => {
    mockList(undefined, { error: new Error('Servidor caído') })

    renderRouted(<NotificationsPage />)

    expect(screen.getByText('Servidor caído')).toBeInTheDocument()
  })

  it('shows the empty state', () => {
    mockList({ data: [], pagination: { pages: 1 } })

    renderRouted(<NotificationsPage />)

    expect(
      screen.getByText('No tienes notificaciones que coincidan con los filtros aplicados.'),
    ).toBeInTheDocument()
  })

  it('lists notifications and refetches after marking one read', async () => {
    mockList({ data: [notification({ id: 5 })], pagination: { pages: 1 } })
    const user = userEvent.setup()
    renderRouted(<NotificationsPage />)

    expect(screen.getByText('Nueva evaluación')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Marcar como leída' }))

    expect(markAsRead).toHaveBeenCalledWith([5])
    await waitFor(() => expect(refetch).toHaveBeenCalled())
  })

  it('offers to mark every notification read only when there is an unread one', () => {
    vi.mocked(useNotifications).mockReturnValue({
      unreadCount: 3,
      markAsRead,
      markAllAsRead,
    } as unknown as ReturnType<typeof useNotifications>)
    mockList({ data: [notification()], pagination: { pages: 1 } })

    renderRouted(<NotificationsPage />)

    expect(screen.getByRole('button', { name: 'Marcar todas como leídas' })).toBeInTheDocument()
  })

  it('marks every notification as read and refetches', async () => {
    vi.mocked(useNotifications).mockReturnValue({
      unreadCount: 3,
      markAsRead,
      markAllAsRead,
    } as unknown as ReturnType<typeof useNotifications>)
    mockList({ data: [notification()], pagination: { pages: 1 } })
    const user = userEvent.setup()
    renderRouted(<NotificationsPage />)

    await user.click(screen.getByRole('button', { name: 'Marcar todas como leídas' }))

    expect(markAllAsRead).toHaveBeenCalled()
    await waitFor(() => expect(refetch).toHaveBeenCalled())
  })

  it('paginates through the results', async () => {
    mockList({ data: [notification()], pagination: { pages: 2 } })
    const user = userEvent.setup()
    renderRouted(<NotificationsPage />)

    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument()
    const prev = screen.getByRole('button', { name: 'Página anterior' })
    expect(prev).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Página siguiente' }))

    await waitFor(() =>
      expect(useGetMyNotifications).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2 }),
      ),
    )
  })

  it('searches on the server as the query is typed', async () => {
    mockList({ data: [notification()], pagination: { pages: 1 } })
    const user = userEvent.setup()
    renderRouted(<NotificationsPage />)

    await user.type(
      screen.getByRole('textbox', { name: 'Buscar en las notificaciones' }),
      'evaluación',
    )

    await waitFor(() =>
      expect(useGetMyNotifications).toHaveBeenLastCalledWith(
        expect.objectContaining({ filters: expect.objectContaining({ search: 'evaluación' }) }),
      ),
    )
  })
})
