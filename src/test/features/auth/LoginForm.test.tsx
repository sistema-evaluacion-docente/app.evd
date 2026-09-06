import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LoginForm } from '@/features/auth/components/LoginForm'
import { render, screen, waitFor } from '@/test/render'

const store = vi.hoisted(() => ({
  loginWithEmail: vi.fn(),
  loginWithGoogle: vi.fn(),
}))

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))

vi.mock('sonner', () => ({ toast }))

vi.mock('@/features/auth/store/useAuthStore', () => ({
  useAuthStore: (selector: (s: typeof store) => unknown) => selector(store),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('LoginForm', () => {
  it('rejects a blank submission without calling the api', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

    expect(toast.error).toHaveBeenCalledWith('Ingrese su correo y contraseña')
    expect(store.loginWithEmail).not.toHaveBeenCalled()
  })

  it('logs in with email/password and greets the user', async () => {
    const user = userEvent.setup()
    store.loginWithEmail.mockResolvedValue({ status: 200 })
    render(<LoginForm />)

    await user.type(screen.getByLabelText('Correo institucional'), 'ada@ufps.edu.co')
    await user.type(screen.getByLabelText('Contraseña'), 'secreta')
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

    expect(store.loginWithEmail).toHaveBeenCalledWith('ada@ufps.edu.co', 'secreta')
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Bienvenido'))
  })

  it('shows the backend error message on a failed login', async () => {
    const user = userEvent.setup()
    store.loginWithEmail.mockResolvedValue({ status: 401, error: 'Credenciales inválidas' })
    render(<LoginForm />)

    await user.type(screen.getByLabelText('Correo institucional'), 'ada@ufps.edu.co')
    await user.type(screen.getByLabelText('Contraseña'), 'mala')
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Credenciales inválidas'))
  })

  it('toggles the password visibility', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const password = screen.getByLabelText('Contraseña')
    expect(password).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: 'Mostrar contraseña' }))
    expect(password).toHaveAttribute('type', 'text')

    await user.click(screen.getByRole('button', { name: 'Ocultar contraseña' }))
    expect(password).toHaveAttribute('type', 'password')
  })

  it('logs in with Google and greets the user by name', async () => {
    const user = userEvent.setup()
    store.loginWithGoogle.mockResolvedValue({ status: 200, data: { user: { displayName: 'Ada' } } })
    render(<LoginForm />)

    await user.click(screen.getByRole('button', { name: /Continuar con Google/ }))

    expect(store.loginWithGoogle).toHaveBeenCalled()
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Bienvenido, Ada'))
  })

  it('shows a generic error when the Google login fails', async () => {
    const user = userEvent.setup()
    store.loginWithGoogle.mockResolvedValue({ status: 401 })
    render(<LoginForm />)

    await user.click(screen.getByRole('button', { name: /Continuar con Google/ }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Ocurrió un error al iniciar sesión'),
    )
  })
})
