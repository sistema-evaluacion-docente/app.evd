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

  it('navigates to an intermediate segment when clicked', async () => {
    const user = userEvent.setup()

    const { history } = renderAt('/docentes/evaluaciones')

    await user.click(screen.getByText('Docentes'))

    expect(history.at(-1)).toBe('/docentes')
  })
})
