import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

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

  it('has no close button unless it can be cleared', () => {
    render(<InlineError message="Campo requerido" />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('clears itself through the caller, so the error can come back later', async () => {
    const onDismiss = vi.fn()

    render(<InlineError message="Ocurrió un error inesperado" onDismiss={onDismiss} />)

    await userEvent.click(screen.getByRole('button', { name: /cerrar el error/i }))

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})
