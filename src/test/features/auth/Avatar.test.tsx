import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Avatar } from '@/features/auth/components/Avatar'
import { fireEvent, renderRouted, screen, waitFor } from '@/test/render'

vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
)

const store = vi.hoisted(() => ({
  user: {
    name: 'Ada Lovelace',
    avatar_url: '',
    department_name: 'Sistemas',
    roles: ['DOCENTE', 'ADMIN'],
  } as { name: string; avatar_url: string; department_name: string | null; roles: string[] } | null,
  isLoading: false,
  handleLogout: vi.fn(),
  selectedRole: 'DOCENTE' as string | null,
  setSelectedRole: vi.fn(),
}))

vi.mock('@/features/auth/store/useAuthStore', () => ({
  useAuthStore: (selector: (s: typeof store) => unknown) => selector(store),
}))

beforeEach(() => {
  vi.clearAllMocks()
  store.user = {
    name: 'Ada Lovelace',
    avatar_url: '',
    department_name: 'Sistemas',
    roles: ['DOCENTE', 'ADMIN'],
  }
  store.isLoading = false
  store.selectedRole = 'DOCENTE'
})

describe('Avatar', () => {
  it('shows a loading skeleton while the session is resolving', () => {
    store.isLoading = true
    const { container } = renderRouted(<Avatar />)

    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
    expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument()
  })

  it('shows the user name and their current role', () => {
    renderRouted(<Avatar />)

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByText('Docente')).toBeInTheDocument()
  })

  it('falls back to the first role when none is selected', () => {
    store.selectedRole = null
    renderRouted(<Avatar />)

    expect(screen.getByText('Docente')).toBeInTheDocument()
  })

  it('opens the menu, shows the department, and navigates to notifications', async () => {
    const user = userEvent.setup()
    const { history } = renderRouted(<Avatar />)

    await user.click(screen.getByRole('button'))
    await user.click(await screen.findByRole('menuitem', { name: /Notificaciones/ }))

    await waitFor(() => expect(history.at(-1)).toBe('/notificaciones'))
  })

  it('changes the role from the submenu, and lands on /home', async () => {
    const user = userEvent.setup()
    const { history } = renderRouted(<Avatar />)

    await user.click(screen.getByRole('button'))
    await user.hover(await screen.findByRole('menuitem', { name: /Cambiar de rol/ }))
    fireEvent.click(await screen.findByRole('menuitemradio', { name: 'Administrador' }))

    expect(store.setSelectedRole).toHaveBeenCalledWith('ADMIN')
    await waitFor(() => expect(history.at(-1)).toBe('/home'))
  })

  it('logs out from the menu', async () => {
    const user = userEvent.setup()
    renderRouted(<Avatar />)

    await user.click(screen.getByRole('button'))
    await user.click(await screen.findByRole('menuitem', { name: /Cerrar sesión/ }))

    expect(store.handleLogout).toHaveBeenCalled()
  })
})
