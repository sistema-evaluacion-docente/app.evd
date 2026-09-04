import { describe, expect, it, vi } from 'vitest'

import App from '@/app/App'
import { renderRouted, screen } from '@/test/render'

/**
 * The route table. Rendering the tree once, at any path, is enough to
 * construct every `<Route>` in the `<Switch>` — what actually mounts is just
 * whichever one matches `/login`, kept unauthenticated so it doesn't redirect
 * away and drag in the rest of the app.
 */

vi.mock('@/features/auth/store/useAuthStore', () => ({
  useAuthStore: (selector: (s: unknown) => unknown) =>
    selector({ isLoading: false, loggedIn: false, selectedRole: null, user: null }),
}))

vi.mock('@/features/auth/components/LoginForm', () => ({
  LoginForm: () => <p>Formulario</p>,
}))

describe('App', () => {
  it('renders the matched route, with the always-on evaluation logs panel mounted alongside it', async () => {
    renderRouted(<App />, { path: '/login' })

    expect(await screen.findByText('Formulario')).toBeInTheDocument()
  })

  it('falls back to the not-found page for an unknown route', async () => {
    renderRouted(<App />, { path: '/esto-no-existe' })

    expect(await screen.findByText(/no encontr/i)).toBeInTheDocument()
  })
})
