import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Router } from 'wouter'
import { memoryLocation } from 'wouter/memory-location'

import { AppLayout } from '@/components/common/AppLayout'
import useAuth from '@/hooks/useAuth'

vi.mock('@/hooks/useAuth')

vi.mock('@/features/auth', () => ({
  Avatar: () => <div data-testid="avatar" />,
  UserNotAuth: () => <div>No autenticado</div>,
}))

vi.mock('@/features/notifications', () => ({
  NotificationsBell: () => <div data-testid="notifications-bell" />,
}))

function mockAuth(overrides: Partial<ReturnType<typeof useAuth>>) {
  vi.mocked(useAuth).mockReturnValue({
    isLoading: false,
    loggedIn: true,
    selectedRole: 'ADMIN',
    ...overrides,
  } as ReturnType<typeof useAuth>)
}

function renderAt(path: string) {
  const { hook } = memoryLocation({ path })

  return render(
    <Router hook={hook}>
      <AppLayout>
        <p>Contenido protegido</p>
      </AppLayout>
    </Router>,
  )
}

describe('AppLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the loading skeleton while the session is resolving', () => {
    mockAuth({ isLoading: true, loggedIn: false, selectedRole: null })

    renderAt('/')

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('Cargando la aplicación…')).toBeInTheDocument()
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument()
  })

  it('shows the not-authenticated screen when there is no logged in user', () => {
    mockAuth({ loggedIn: false, selectedRole: null })

    renderAt('/')

    expect(screen.getByText('No autenticado')).toBeInTheDocument()
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument()
  })

  it('renders the children when the role is authorized for the route', () => {
    mockAuth({ selectedRole: 'ADMIN' })

    renderAt('/home')

    expect(screen.getByText('Contenido protegido')).toBeInTheDocument()
  })

  it('shows an unauthorized message when the role cannot access the route', () => {
    mockAuth({ selectedRole: 'ADMIN' })

    renderAt('/docentes')

    expect(screen.getByText('Acceso no autorizado')).toBeInTheDocument()
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument()
  })

  it('renders the app chrome once authenticated', () => {
    mockAuth({ selectedRole: 'ADMIN' })

    renderAt('/')

    expect(screen.getByText('Evaluación Docente')).toBeInTheDocument()
    expect(screen.getByTestId('avatar')).toBeInTheDocument()
    expect(screen.getByTestId('notifications-bell')).toBeInTheDocument()
  })
})
