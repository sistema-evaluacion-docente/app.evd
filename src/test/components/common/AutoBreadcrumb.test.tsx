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

    expect(history.at(-1)).toBe('/')
  })

  it('navigates to an intermediate segment when clicked', async () => {
    const user = userEvent.setup()

    const { history } = renderAt('/docentes/evaluaciones')

    await user.click(screen.getByText('Docentes'))

    expect(history.at(-1)).toBe('/docentes')
  })
})
