import { render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Route, Router, Switch } from 'wouter'
import { memoryLocation } from 'wouter/memory-location'

import LoginPage from '@/features/auth/pages/LoginPage'

let state = { isLoading: false, loggedIn: true, selectedRole: 'DOCENTE' as string | null }

vi.mock('@/features/auth/store/useAuthStore', () => ({
  useAuthStore: (selector: (s: unknown) => unknown) => selector(state),
}))

vi.mock('@/features/auth/components/LoginForm', () => ({
  LoginForm: () => <p>Formulario</p>,
}))

beforeEach(() => {
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
