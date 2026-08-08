import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'

describe('ConfirmDialog', () => {
  it('renders nothing when closed', () => {
    render(
      <ConfirmDialog
        open={false}
        onOpenChange={vi.fn()}
        title="Eliminar evaluación"
        onConfirm={vi.fn()}
      />,
    )

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('shows the title and default description when open', () => {
    render(
      <ConfirmDialog open onOpenChange={vi.fn()} title="Eliminar evaluación" onConfirm={vi.fn()} />,
    )

    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByText('Eliminar evaluación')).toBeInTheDocument()
    expect(
      screen.getByText('Esta acción no se puede deshacer. Se eliminarán todos los datos.'),
    ).toBeInTheDocument()
  })

  it('shows a custom description', () => {
    render(
      <ConfirmDialog
        open
        onOpenChange={vi.fn()}
        title="Eliminar evaluación"
        description="Se perderán los comentarios asociados."
        onConfirm={vi.fn()}
      />,
    )

    expect(screen.getByText('Se perderán los comentarios asociados.')).toBeInTheDocument()
  })

  it('uses the default action labels', () => {
    render(
      <ConfirmDialog open onOpenChange={vi.fn()} title="Eliminar evaluación" onConfirm={vi.fn()} />,
    )

    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
  })

  it('uses custom action labels', () => {
    render(
      <ConfirmDialog
        open
        onOpenChange={vi.fn()}
        title="Archivar periodo"
        confirmLabel="Archivar"
        cancelLabel="Volver"
        onConfirm={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Archivar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Volver' })).toBeInTheDocument()
  })

  it('runs onConfirm when the confirm action is clicked', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()

    render(
      <ConfirmDialog
        open
        onOpenChange={vi.fn()}
        title="Eliminar evaluación"
        onConfirm={onConfirm}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Eliminar' }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('shows the pending label and disables the confirm action while pending', () => {
    render(
      <ConfirmDialog
        open
        onOpenChange={vi.fn()}
        title="Eliminar evaluación"
        onConfirm={vi.fn()}
        isPending
        pendingLabel="Eliminando..."
      />,
    )

    const confirmButton = screen.getByRole('button', { name: 'Eliminando...' })

    expect(confirmButton).toBeInTheDocument()
    expect(confirmButton).toBeDisabled()
  })

  it('closes through onOpenChange when the cancel action is clicked', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()

    render(
      <ConfirmDialog
        open
        onOpenChange={onOpenChange}
        title="Eliminar evaluación"
        onConfirm={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onOpenChange.mock.calls[0]?.[0]).toBe(false)
  })
})
