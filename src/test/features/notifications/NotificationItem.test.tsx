import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { NotificationItem } from '@/features/notifications/components/NotificationItem'
import type { Notification } from '@/features/notifications/types/Notification'
import { renderRouted, screen } from '@/test/render'

function notification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: 1,
    user_id: 1,
    title: 'Nueva evaluación',
    message: 'Se cargó una evaluación para tu departamento',
    type: 'info',
    read: false,
    created_at: '2028-01-01T00:00:00Z',
    updated_at: '2028-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('NotificationItem', () => {
  it('shows the title, message and date', () => {
    renderRouted(<NotificationItem notification={notification()} onMarkAsRead={vi.fn()} />)

    expect(screen.getByText('Nueva evaluación')).toBeInTheDocument()
    expect(screen.getByText('Se cargó una evaluación para tu departamento')).toBeInTheDocument()
  })

  it('offers a mark-as-read action only while unread', () => {
    const { rerender } = renderRouted(
      <NotificationItem notification={notification({ read: false })} onMarkAsRead={vi.fn()} />,
    )
    expect(screen.getByRole('button', { name: 'Marcar como leída' })).toBeInTheDocument()

    rerender(<NotificationItem notification={notification({ read: true })} onMarkAsRead={vi.fn()} />)
    expect(screen.queryByRole('button', { name: 'Marcar como leída' })).not.toBeInTheDocument()
  })

  it('marks itself as read on click, without navigating', async () => {
    const onMarkAsRead = vi.fn()
    const user = userEvent.setup()
    renderRouted(<NotificationItem notification={notification({ id: 7 })} onMarkAsRead={onMarkAsRead} />)

    await user.click(screen.getByRole('button', { name: 'Marcar como leída' }))

    expect(onMarkAsRead).toHaveBeenCalledWith(7)
  })

  it('wraps itself in a link and calls onNavigate when it carries one', async () => {
    const onNavigate = vi.fn()
    const user = userEvent.setup()
    renderRouted(
      <NotificationItem
        notification={notification({ link: '/planes/9' })}
        onMarkAsRead={vi.fn()}
        onNavigate={onNavigate}
      />,
    )

    expect(screen.getByRole('link')).toHaveAttribute('href', '/planes/9')

    await user.click(screen.getByRole('link'))

    expect(onNavigate).toHaveBeenCalled()
  })

  it('renders without a link when the notification carries none', () => {
    renderRouted(<NotificationItem notification={notification({ link: undefined })} onMarkAsRead={vi.fn()} />)

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('shows a distinct icon per notification type', () => {
    for (const type of ['info', 'warning', 'error', 'success'] as const) {
      const { container, unmount } = renderRouted(
        <NotificationItem notification={notification({ type })} onMarkAsRead={vi.fn()} />,
      )
      expect(container.querySelector('svg')).toBeInTheDocument()
      unmount()
    }
  })
})
