import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AppHeader } from '@/components/common/AppHeader'
import { SidebarProvider } from '@/components/ui/sidebar'

vi.mock('@/features/auth', () => ({
  Avatar: () => <div data-testid="avatar" />,
}))

vi.mock('@/features/notifications', () => ({
  NotificationsBell: () => <div data-testid="notifications-bell" />,
}))

function renderHeader(props: Partial<React.ComponentProps<typeof AppHeader>> = {}) {
  return render(
    <SidebarProvider>
      <AppHeader {...props} />
    </SidebarProvider>,
  )
}

describe('AppHeader', () => {
  it('renders the notifications bell and avatar', () => {
    renderHeader()

    expect(screen.getByTestId('notifications-bell')).toBeInTheDocument()
    expect(screen.getByTestId('avatar')).toBeInTheDocument()
  })

  it('shows the menu toggle expanded by default', () => {
    renderHeader()

    expect(screen.getByRole('button', { name: 'Cerrar menú' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })

  it('toggles the menu button label when clicked', async () => {
    const user = userEvent.setup()

    renderHeader()

    await user.click(screen.getByRole('button', { name: 'Cerrar menú' }))

    expect(screen.getByRole('button', { name: 'Abrir menú' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  it('hides the breadcrumb slot by default', () => {
    renderHeader({ breadcrumb: <span>Migas</span> })

    expect(screen.queryByText('Migas')).not.toBeInTheDocument()
  })

  it('shows the breadcrumb when showBreadcrumb is true', () => {
    renderHeader({ showBreadcrumb: true, breadcrumb: <span>Migas</span> })

    expect(screen.getByText('Migas')).toBeInTheDocument()
  })

  it('does not show the search box by default', () => {
    renderHeader()

    expect(screen.queryByPlaceholderText('Buscar docente...')).not.toBeInTheDocument()
  })

  it('shows the search box when rightMode is "search"', () => {
    renderHeader({ rightMode: 'search' })

    expect(screen.getByPlaceholderText('Buscar docente...')).toBeInTheDocument()
  })
})
