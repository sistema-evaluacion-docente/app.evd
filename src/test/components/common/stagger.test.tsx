import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Stagger } from '@/components/common/stagger'

describe('Stagger', () => {
  it('renders its children', () => {
    render(
      <Stagger>
        <p>Contenido</p>
      </Stagger>,
    )

    expect(screen.getByText('Contenido')).toBeInTheDocument()
  })

  it('applies the default fade-in animation class', () => {
    render(
      <Stagger>
        <p>Contenido</p>
      </Stagger>,
    )

    expect(screen.getByText('Contenido').parentElement).toHaveClass('animate-fade-in')
  })

  it('applies a custom animation class', () => {
    render(
      <Stagger animation="animate-rise">
        <p>Contenido</p>
      </Stagger>,
    )

    expect(screen.getByText('Contenido').parentElement).toHaveClass('animate-rise')
  })

  it('sets the animation delay inline', () => {
    render(
      <Stagger delay={150}>
        <p>Contenido</p>
      </Stagger>,
    )

    expect(screen.getByText('Contenido').parentElement).toHaveStyle({ animationDelay: '150ms' })
  })

  it('merges the extra className', () => {
    render(
      <Stagger className="mt-4">
        <p>Contenido</p>
      </Stagger>,
    )

    expect(screen.getByText('Contenido').parentElement).toHaveClass('mt-4')
  })
})
