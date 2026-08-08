import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { InlineError } from '@/components/common/InlineError'

describe('InlineError', () => {
  it('renders nothing when there is no message', () => {
    const { container } = render(<InlineError />)

    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when the message is null', () => {
    const { container } = render(<InlineError message={null} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('shows the message inside an alert region', () => {
    render(<InlineError message="El archivo supera los 10 MB" />)

    expect(screen.getByRole('alert')).toHaveTextContent('El archivo supera los 10 MB')
  })

  it('uses the given id instead of a generated one', () => {
    render(<InlineError message="Campo requerido" id="file-error" />)

    expect(screen.getByRole('alert')).toHaveAttribute('id', 'file-error')
  })
})
