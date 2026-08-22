import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { lazy, Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RouteError } from '@/components/common/RouteError'
import { RouteFallback } from '@/components/common/RouteFallback'

/**
 * The boundary logs the error it caught, which is noise here: every one of
 * these tests throws on purpose.
 */
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

/** A page whose chunk never arrives — a redeploy, or a dropped connection. */
const MissingChunk = lazy(() =>
  Promise.reject(new Error('Failed to fetch dynamically imported module: /assets/Plan-a1b2.js')),
)

function Boom(): never {
  throw new Error('No se pudo leer el plan')
}

/** The layout: chrome outside the boundary, page inside it. */
function Layout({
  children,
  resetKey = '/planes',
}: {
  children: React.ReactNode
  resetKey?: string
}) {
  return (
    <div>
      <nav>
        <a href="/docentes">Docentes</a>
      </nav>

      <ErrorBoundary FallbackComponent={RouteError} resetKeys={[resetKey]}>
        <Suspense fallback={<RouteFallback />}>{children}</Suspense>
      </ErrorBoundary>
    </div>
  )
}

describe('RouteError', () => {
  it('a chunk que no llega lo trata como versión nueva, y ofrece recargar', async () => {
    render(
      <Layout>
        <MissingChunk />
      </Layout>,
    )

    await waitFor(() =>
      expect(screen.getByText(/versión nueva de la aplicación/i)).toBeInTheDocument(),
    )

    // Reintentar volvería a pedir el mismo archivo que no está: la única salida
    // es traer el index.html nuevo.
    expect(screen.getByRole('button', { name: /Recargar/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Intentar de nuevo/ })).not.toBeInTheDocument()
  })

  it('deja en pie el resto de la página, que es por donde el usuario sale', async () => {
    render(
      <Layout>
        <MissingChunk />
      </Layout>,
    )

    await waitFor(() =>
      expect(screen.getByText(/versión nueva de la aplicación/i)).toBeInTheDocument(),
    )

    // Sin boundary esto desaparecía: React desmontaba el árbol entero y la
    // pantalla quedaba en blanco.
    expect(screen.getByRole('link', { name: 'Docentes' })).toBeInTheDocument()
  })

  it('un error de render corriente sí se reintenta en el sitio', async () => {
    render(
      <Layout>
        <Boom />
      </Layout>,
    )

    expect(screen.getByText(/No pudimos mostrar esta página/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Intentar de nuevo/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Recargar/ })).not.toBeInTheDocument()
  })

  it('dice qué falló, para quien tenga que reportarlo', () => {
    render(
      <Layout>
        <Boom />
      </Layout>,
    )

    expect(screen.getByText('No se pudo leer el plan')).toBeInTheDocument()
  })

  it('se anuncia como alerta', () => {
    render(
      <Layout>
        <Boom />
      </Layout>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(/No pudimos mostrar esta página/i)
  })

  it('navegar a otra ruta limpia el error sin tener que recargar', async () => {
    const { rerender } = render(
      <Layout resetKey="/planes/nuevo">
        <Boom />
      </Layout>,
    )

    expect(screen.getByText(/No pudimos mostrar esta página/i)).toBeInTheDocument()

    // Lo que hace `resetKeys`: el usuario hace clic en el sidebar y sigue
    // trabajando, en vez de quedarse atrapado en el fallback.
    rerender(
      <Layout resetKey="/docentes">
        <p>Listado de docentes</p>
      </Layout>,
    )

    expect(screen.queryByText(/No pudimos mostrar esta página/i)).not.toBeInTheDocument()
    expect(screen.getByText('Listado de docentes')).toBeInTheDocument()
  })

  it('reintentar vuelve a montar la página cuando la causa ya pasó', async () => {
    const user = userEvent.setup()
    let shouldFail = true

    function Flaky() {
      if (shouldFail) throw new Error('fallo pasajero')
      return <p>El plan</p>
    }

    render(
      <Layout>
        <Flaky />
      </Layout>,
    )

    expect(screen.getByText(/No pudimos mostrar esta página/i)).toBeInTheDocument()

    shouldFail = false
    await user.click(screen.getByRole('button', { name: /Intentar de nuevo/ }))

    expect(screen.getByText('El plan')).toBeInTheDocument()
  })
})
