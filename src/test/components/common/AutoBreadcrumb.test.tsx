import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Router } from 'wouter'
import { memoryLocation } from 'wouter/memory-location'

import { AutoBreadcrumb } from '@/components/common/AutoBreadcrumb'

function renderAt(path: string) {
  const { hook, history } = memoryLocation({ path, record: true })

  return {
    history,
    ...render(
      <Router hook={hook}>
        <AutoBreadcrumb />
      </Router>,
    ),
  }
}

describe('AutoBreadcrumb', () => {
  it('renders nothing at the root path', () => {
    const { container } = renderAt('/')

    expect(container).toBeEmptyDOMElement()
  })

  it('builds a trail from the route segments', () => {
    renderAt('/docentes/evaluaciones')

    expect(screen.getByText('Docentes')).toBeInTheDocument()
    expect(screen.getByText('Evaluaciones')).toBeInTheDocument()
  })

  it('skips numeric id segments', () => {
    renderAt('/docentes/42')

    expect(screen.getByText('Docentes')).toBeInTheDocument()
    expect(screen.queryByText('42')).not.toBeInTheDocument()
  })

  it('marks the last non-numeric segment as the current page', () => {
    renderAt('/docentes/evaluaciones')

    expect(screen.getByRole('link', { name: 'Evaluaciones' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('title-cases an unknown segment', () => {
    renderAt('/unknown-section')

    expect(screen.getByText('Unknown-section')).toBeInTheDocument()
  })

  it('navigates home when Inicio is clicked', async () => {
    const user = userEvent.setup()

    const { history } = renderAt('/docentes')

    await user.click(screen.getByText('Inicio'))

    expect(history.at(-1)).toBe('/home')
  })

  it('links every crumb when no role is given', () => {
    renderAt('/evaluaciones/12/pdf')

    expect(screen.getByText('Evaluaciones')).toHaveClass('cursor-pointer')
  })

  it('prints a crumb the role cannot open as plain text', () => {
    const { hook } = memoryLocation({ path: '/evaluaciones/12/pdf', record: true })

    render(
      <Router hook={hook}>
        <AutoBreadcrumb role="DOCENTE" />
      </Router>,
    )

    // The teacher reaches their own PDF, but not the evaluations section
    // above it — that crumb must not offer a link into a page they can't open.
    expect(screen.getByText('Evaluaciones')).not.toHaveClass('cursor-pointer')
    expect(screen.getByText('Documento')).toBeInTheDocument()
  })

  it('keeps linking the crumbs the role can open', () => {
    const { hook } = memoryLocation({ path: '/evaluaciones/12/pdf', record: true })

    render(
      <Router hook={hook}>
        <AutoBreadcrumb role="DIRECTOR DE DEPARTAMENTO" />
      </Router>,
    )

    expect(screen.getByText('Evaluaciones')).toHaveClass('cursor-pointer')
  })

  it('renders nothing on the home route', () => {
    // You are already at the root, so there is no trail to draw — and the
    // segment used to add an English "Home" crumb under "Inicio".
    const { container } = renderAt('/home')

    expect(container).toBeEmptyDOMElement()
  })

  it('spells out the Spanish segments instead of capitalising them', () => {
    renderAt('/mis-planes')

    expect(screen.getByText('Mis planes')).toBeInTheDocument()
    expect(screen.queryByText('Mis-planes')).not.toBeInTheDocument()
  })

  it('accents the segments the URL cannot carry', () => {
    renderAt('/admin/configuracion')

    expect(screen.getByText('Administración')).toBeInTheDocument()
    expect(screen.getByText('Configuración')).toBeInTheDocument()
  })

  it('calls the audit page Historial', () => {
    renderAt('/admin/historial')

    expect(screen.getByText('Historial')).toBeInTheDocument()
    expect(screen.queryByText('Logs')).not.toBeInTheDocument()
  })

  it('collapses a subject browsed from a period into one crumb', () => {
    renderAt('/periodos/2025-1/materias/SIS101/A')

    expect(screen.getByText('Periodos')).toBeInTheDocument()
    expect(screen.getByText('2025-1')).toBeInTheDocument()
    expect(screen.getByText('SIS101 · Grupo A')).toBeInTheDocument()
  })

  it("does not read a director's subject route as a group", () => {
    // The collapse above used to fire on any "materias" followed by two
    // segments, turning this route into "1155304 · Grupo docentes".
    renderAt('/materias/1155304/docentes/12')

    expect(screen.getByText('Materias')).toBeInTheDocument()
    expect(screen.getByText('1155304')).toBeInTheDocument()
    expect(screen.queryByText(/Grupo/)).not.toBeInTheDocument()
    expect(screen.queryByText('Docentes')).not.toBeInTheDocument()
  })

  it('keeps the crumbs after the subject code', () => {
    renderAt('/materias/1155304/comparar')

    expect(screen.getByText('Materias')).toBeInTheDocument()
    expect(screen.getByText('1155304')).toBeInTheDocument()
    expect(screen.getByText('Comparar')).toBeInTheDocument()
    expect(screen.queryByText(/Grupo/)).not.toBeInTheDocument()
  })

  it('does not link the subject code, which has no page of its own', () => {
    renderAt('/materias/1155304/comparar')

    expect(screen.getByText('1155304')).not.toHaveClass('cursor-pointer')
    expect(screen.getByText('Materias')).toHaveClass('cursor-pointer')
  })

  it('marks only the last crumb as the current page', () => {
    renderAt('/materias/1155304/comparar')

    expect(screen.getByText('Comparar')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByText('1155304')).not.toHaveAttribute('aria-current')
  })

  it('navigates to an intermediate segment when clicked', async () => {
    const user = userEvent.setup()

    const { history } = renderAt('/docentes/evaluaciones')

    await user.click(screen.getByText('Docentes'))

    expect(history.at(-1)).toBe('/docentes')
  })
})
