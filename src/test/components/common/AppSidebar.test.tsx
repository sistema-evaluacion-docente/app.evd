import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Router } from 'wouter'
import { memoryLocation } from 'wouter/memory-location'

import { AppSidebar } from '@/components/common/AppSidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import useAuth from '@/hooks/useAuth'

vi.mock('@/hooks/useAuth')

function renderAt(path = '/admin/facultades') {
  const { hook, history } = memoryLocation({ path, record: true })

  return {
    history,
    ...render(
      <Router hook={hook}>
        <SidebarProvider>
          <AppSidebar />
        </SidebarProvider>
      </Router>,
    ),
  }
}

function mockAuth(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
  vi.mocked(useAuth).mockReturnValue({
    selectedRole: 'ADMIN',
    handleLogout: vi.fn(),
    ...overrides,
  } as ReturnType<typeof useAuth>)
}

describe('AppSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing without a selected role', () => {
    mockAuth({ selectedRole: null })

    renderAt()

    expect(screen.queryByText('Evaluación Docente')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('lists only the menu items available to the selected role', () => {
    mockAuth()

    renderAt()

    expect(screen.getByRole('button', { name: /Facultades/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Departamentos/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Docentes/ })).not.toBeInTheDocument()
  })

  it('navigates when a menu item is clicked', async () => {
    const user = userEvent.setup()
    mockAuth()

    const { history } = renderAt('/admin/facultades')

    await user.click(screen.getByRole('button', { name: /Departamentos/ }))

    expect(history.at(-1)).toBe('/admin/departamentos')
  })

  it('runs handleLogout when "Cerrar Sesión" is clicked', async () => {
    const user = userEvent.setup()
    const handleLogout = vi.fn()
    mockAuth({ handleLogout })

    renderAt()

    await user.click(screen.getByRole('button', { name: 'Cerrar Sesión' }))

    expect(handleLogout).toHaveBeenCalledTimes(1)
  })
})
