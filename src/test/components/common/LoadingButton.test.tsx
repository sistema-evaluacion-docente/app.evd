import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { LoadingButton } from '@/components/common/LoadingButton'

describe('LoadingButton', () => {
  it('behaves like a plain button when nothing is pending', () => {
    render(<LoadingButton>Guardar</LoadingButton>)

    const button = screen.getByRole('button', { name: 'Guardar' })

    expect(button).toBeEnabled()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('says what it is doing instead of just going dead', () => {
    render(
      <LoadingButton pending pendingLabel="Guardando…">
        Guardar
      </LoadingButton>,
    )

    const button = screen.getByRole('button')

    expect(button).toHaveTextContent('Guardando…')
    expect(button).not.toHaveTextContent('Guardar')
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
  })

  it('lets the spinner speak alone on icon-only buttons', () => {
    render(
      <LoadingButton pending size="icon" aria-label="Descargar">
        <svg data-testid="icon" />
      </LoadingButton>,
    )

    expect(screen.queryByTestId('icon')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Descargar' })).toBeDisabled()
  })

  it('stays disabled for its own reasons while idle', () => {
    render(
      <LoadingButton disabled pendingLabel="Guardando…">
        Guardar
      </LoadingButton>,
    )

    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled()
  })

  it('cannot be clicked twice while the first click is still running', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    const { rerender } = render(<LoadingButton onClick={onClick}>Guardar</LoadingButton>)

    await user.click(screen.getByRole('button'))
    rerender(
      <LoadingButton pending pendingLabel="Guardando…" onClick={onClick}>
        Guardar
      </LoadingButton>,
    )
    await user.click(screen.getByRole('button'))

    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
