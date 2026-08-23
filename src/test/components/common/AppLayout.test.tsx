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
  const { hook, history } = memoryLocation({ path, record: true })

  const result = render(
    <Router hook={hook}>
      <AppLayout>
        <p>Contenido protegido</p>
      </AppLayout>
    </Router>,
  )

  return { ...result, history }
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

  it('sends someone with no session to the login page, carrying where they were headed', () => {
    // Not the same as being unauthorised: nothing was refused, they simply have
    // not signed in — which is how a teacher arrives from the link in the
    // "tienes un plan de mejoramiento" email.
    mockAuth({ loggedIn: false, selectedRole: null, user: null })

    const { history } = renderAt('/mis-planes/42')

    expect(history.at(-1)).toBe('/login?next=%2Fmis-planes%2F42')
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument()
    expect(screen.queryByText('No autenticado')).not.toBeInTheDocument()
  })

  it('keeps the explanation for a session the API turned down', () => {
    // Inactive, or not registered as a teacher. Bouncing this one to the login
    // page would only loop, so it is told why instead.
    // Solo hace falta que exista: lo que decide la rama es haber sesión o no.
    mockAuth({
      loggedIn: false,
      selectedRole: null,
      user: { active: false } as ReturnType<typeof useAuth>['user'],
    })

    const { history } = renderAt('/mis-planes/42')

    expect(screen.getByText('No autenticado')).toBeInTheDocument()
    expect(history.at(-1)).toBe('/mis-planes/42')
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

  it('keeps a director with a department on the improvement plans', () => {
    mockAuth({
      selectedRole: 'DIRECTOR DE DEPARTAMENTO',
      user: { department_id: 3 } as ReturnType<typeof useAuth>['user'],
    })

    renderAt('/planes')

    expect(screen.getByText('Contenido protegido')).toBeInTheDocument()
  })

  it('keeps a director with no department out of the improvement plans', () => {
    mockAuth({
      selectedRole: 'DIRECTOR DE DEPARTAMENTO',
      user: { department_id: null } as ReturnType<typeof useAuth>['user'],
    })

    renderAt('/planes')

    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument()
  })

  it('blames the missing department, not the permissions', () => {
    // The role is right; what is missing is the department every plan is
    // scoped to. "Acceso no autorizado" would send them to argue with the
    // wrong person.
    mockAuth({
      selectedRole: 'DIRECTOR DE DEPARTAMENTO',
      user: { department_id: null } as ReturnType<typeof useAuth>['user'],
    })

    renderAt('/planes')

    expect(screen.getByText('Sin departamento asignado')).toBeInTheDocument()
    expect(screen.queryByText('Acceso no autorizado')).not.toBeInTheDocument()
  })

  it('covers the pages nested under the plans as well', () => {
    mockAuth({
      selectedRole: 'DIRECTOR DE DEPARTAMENTO',
      user: { department_id: null } as ReturnType<typeof useAuth>['user'],
    })

    renderAt('/planes/nuevo')

    expect(screen.getByText('Sin departamento asignado')).toBeInTheDocument()
  })

  it('leaves the rest of the director pages alone without a department', () => {
    // Only the improvement plans are gated on it for now.
    mockAuth({
      selectedRole: 'DIRECTOR DE DEPARTAMENTO',
      user: { department_id: null } as ReturnType<typeof useAuth>['user'],
    })

    renderAt('/docentes')

    expect(screen.getByText('Contenido protegido')).toBeInTheDocument()
  })

  it('renders the app chrome once authenticated', () => {
    mockAuth({ selectedRole: 'ADMIN' })

    renderAt('/')

    expect(screen.getByText('Evaluación Docente')).toBeInTheDocument()
    expect(screen.getByTestId('avatar')).toBeInTheDocument()
    expect(screen.getByTestId('notifications-bell')).toBeInTheDocument()
  })
})
