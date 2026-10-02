import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Route, Router, Switch } from 'wouter'
import { memoryLocation } from 'wouter/memory-location'
import { toast } from 'sonner'

import LoginPage from '@/features/auth/pages/LoginPage'

let state: {
  isLoading: boolean
  loggedIn: boolean
  selectedRole: string | null
  user?: { email: string; department_id: number | null }
} = { isLoading: false, loggedIn: true, selectedRole: 'DOCENTE' }

vi.mock('@/features/auth/store/useAuthStore', () => ({
  useAuthStore: (selector: (s: unknown) => unknown) => selector(state),
}))

vi.mock('sonner', () => ({ toast: { error: vi.fn(), dismiss: vi.fn() } }))

vi.mock('@/features/auth/components/LoginForm', () => ({
  LoginForm: () => <p>Formulario</p>,
}))

beforeEach(() => {
  vi.clearAllMocks()
  state = { isLoading: false, loggedIn: true, selectedRole: 'DOCENTE' }
})

function renderAt(path: string) {
  const { hook, history } = memoryLocation({ path, record: true })

  // Como en `App.tsx`: la página vive tras su ruta, así que al navegar se
  // desmonta. Renderizarla suelta la dejaría redirigiendo en bucle.
  render(
    <Router hook={hook}>
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route>
          <p>Destino</p>
        </Route>
      </Switch>
    </Router>,
  )

  return history
}

describe('LoginPage · a dónde manda tras entrar', () => {
  it('al plan del correo, no al inicio', async () => {
    const history = renderAt('/login?next=%2Fmis-planes%2F42')

    await waitFor(() => expect(history.at(-1)).toBe('/mis-planes/42'))
  })

  it('al inicio cuando el usuario simplemente vino a entrar', async () => {
    const history = renderAt('/login')

    await waitFor(() => expect(history.at(-1)).toBe('/home'))
  })

  it('al inicio si el destino no es para su rol', async () => {
    const history = renderAt('/login?next=%2Fplanes%2F42')

    await waitFor(() => expect(history.at(-1)).toBe('/home'))
  })

  it('al inicio si el destino apunta fuera del sitio', async () => {
    const history = renderAt('/login?next=%2F%2Fevil.com')

    await waitFor(() => expect(history.at(-1)).toBe('/home'))
  })
})

describe('LoginPage · cuenta no registrada', () => {
  it('avisa con un toast que dura más que los demás, y deja el formulario', () => {
    state = {
      isLoading: false,
      loggedIn: false,
      selectedRole: null,
      user: { email: 'nadie@gmail.com', department_id: null },
    }

    renderAt('/login')

    expect(toast.error).toHaveBeenCalledWith(
      'No se pudo ingresar',
      expect.objectContaining({
        description: expect.stringContaining('nadie@gmail.com'),
        duration: 10000,
      }),
    )
    expect(screen.getByText('Formulario')).toBeInTheDocument()
  })

  it('no avisa nada a quien simplemente viene a entrar', () => {
    state = { isLoading: false, loggedIn: false, selectedRole: null }

    renderAt('/login')

    expect(toast.error).not.toHaveBeenCalled()
  })
})
