import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Router, Route, Switch } from 'wouter'
import { memoryLocation } from 'wouter/memory-location'

import { AppLayout } from '@/components/common/AppLayout'

let auth = {
  isLoading: false,
  loggedIn: false,
  selectedRole: null as string | null,
  user: null as unknown,
}

vi.mock('@/hooks/useAuth', () => ({ default: () => auth }))

beforeEach(() => {
  auth = { isLoading: false, loggedIn: false, selectedRole: null, user: null }
})

/** Renderiza la ruta pedida y devuelve a dónde acabó el navegador. */
function renderAt(path: string) {
  const { hook, history } = memoryLocation({ path, record: true })

  render(
    <Router hook={hook}>
      <Switch>
        <Route path="/login">
          <p>Pantalla de acceso</p>
        </Route>
        <Route>
          <AppLayout>
            <p>Mi plan</p>
          </AppLayout>
        </Route>
      </Switch>
    </Router>,
  )

  return history
}

describe('AppLayout · llegar sin sesión', () => {
  it('manda al login en vez de acusar de falta de permisos', () => {
    const history = renderAt('/mis-planes/42')

    expect(screen.getByText('Pantalla de acceso')).toBeInTheDocument()
    // Lo que veía antes el docente del correo, y que era falso: no le faltaban
    // permisos, le faltaba iniciar sesión.
    expect(screen.queryByText(/Acceso no autorizado/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/No tiene permisos/i)).not.toBeInTheDocument()

    expect(history.at(-1)).toBe('/login?next=%2Fmis-planes%2F42')
  })

  it('se lleva la query del destino', () => {
    const history = renderAt('/planes?docente=7&periodo=todos')

    expect(history.at(-1)).toBe('/login?next=%2Fplanes%3Fdocente%3D7%26periodo%3Dtodos')
  })

  it('una cuenta rechazada se queda con la explicación, no entra en bucle', () => {
    // Sesión de Firebase válida pero la API la rechazó: inactiva, o no está
    // registrada como docente. Mandarla al login solo daría vueltas.
    auth = {
      isLoading: false,
      loggedIn: false,
      selectedRole: null,
      user: { active: false, teacher_id: null },
    }

    const history = renderAt('/mis-planes/42')

    // Se queda con la explicación en vez de rebotar al login.
    expect(screen.queryByText('Pantalla de acceso')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cerrar sesión/i })).toBeInTheDocument()
    expect(history.at(-1)).toBe('/mis-planes/42')
  })
})
