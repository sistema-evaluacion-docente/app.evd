import { describe, expect, it, vi } from 'vitest'

import AboutPage from '@/features/about/pages/AboutPage'
import { renderRouted, screen } from '@/test/render'

/**
 * The public landing page: no data, no auth, just a long static document with
 * KaTeX formulas and reveal-on-scroll sections. It is the one screen an
 * unauthenticated visitor sees, so the check that earns its place is that it
 * renders at all — every section, without the observer or the theme provider
 * it expects at runtime.
 */

// jsdom has no IntersectionObserver, and every section of the page is wrapped
// in one. Reported as "never intersecting", which is the pre-scroll state.
vi.stubGlobal(
  'IntersectionObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
)

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn(), resolvedTheme: 'light' }),
}))

describe('AboutPage', () => {
  it('renders the whole document without a scroll observer or a theme provider', () => {
    renderRouted(<AboutPage />)

    expect(screen.getByText('Objetivo general')).toBeInTheDocument()
    expect(screen.getByText('Dos modelos ajustados, ninguno generativo')).toBeInTheDocument()
    expect(
      screen.getByText('Los datos no salen del servidor de la universidad'),
    ).toBeInTheDocument()
    expect(screen.getByText('Autores y dirección')).toBeInTheDocument()
  })

  it('states the privacy claim the page is built around', () => {
    renderRouted(<AboutPage />)

    expect(screen.getByText('Anonimización antes de procesar')).toBeInTheDocument()
    expect(
      screen.getByText('Dónde estuvo el modelo generativo y dónde no está'),
    ).toBeInTheDocument()
  })

  it('renders its images with alt text, since this is the one public page', () => {
    renderRouted(<AboutPage />)

    expect(screen.getByAltText('Logo de la UFPS')).toBeInTheDocument()
  })

  it('offers the way in', () => {
    renderRouted(<AboutPage />)

    // The page's only job beyond explaining itself is getting a visitor to the app.
    expect(screen.getAllByRole('link').length).toBeGreaterThan(0)
  })
})
