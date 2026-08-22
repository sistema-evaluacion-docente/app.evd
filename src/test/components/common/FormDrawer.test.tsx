import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { SubmitEvent } from 'react'
import { describe, expect, it, vi } from 'vitest'

import FormDrawer from '@/components/common/FormDrawer'

describe('FormDrawer', () => {
  it('renders nothing when closed', () => {
    render(
      <FormDrawer open={false} onOpenChange={vi.fn()} title="Nuevo docente" onSubmit={vi.fn()}>
        <input aria-label="Nombre" />
      </FormDrawer>,
    )

    expect(screen.queryByText('Nuevo docente')).not.toBeInTheDocument()
  })

  it('shows the title, description and children when open', () => {
    render(
      <FormDrawer
        open
        onOpenChange={vi.fn()}
        title="Nuevo docente"
        description="Completa los datos del docente"
        onSubmit={vi.fn()}
      >
        <input aria-label="Nombre" />
      </FormDrawer>,
    )

    expect(screen.getByText('Nuevo docente')).toBeInTheDocument()
    expect(screen.getByText('Completa los datos del docente')).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument()
  })

  it('uses the default action labels', () => {
    render(
      <FormDrawer open onOpenChange={vi.fn()} title="Nuevo docente" onSubmit={vi.fn()}>
        <input aria-label="Nombre" />
      </FormDrawer>,
    )

    expect(screen.getByRole('button', { name: /Guardar/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cancelar/ })).toBeInTheDocument()
  })

  it('runs onSubmit when the form is submitted', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn((event: SubmitEvent<HTMLFormElement>) => event.preventDefault())

    render(
      <FormDrawer open onOpenChange={vi.fn()} title="Nuevo docente" onSubmit={onSubmit}>
        <input aria-label="Nombre" />
      </FormDrawer>,
    )

    await user.click(screen.getByRole('button', { name: /Guardar/ }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('closes through onOpenChange when cancel is clicked', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()

    render(
      <FormDrawer open onOpenChange={onOpenChange} title="Nuevo docente" onSubmit={vi.fn()}>
        <input aria-label="Nombre" />
      </FormDrawer>,
    )

    await user.click(screen.getByRole('button', { name: /Cancelar/ }))

    expect(onOpenChange.mock.calls[0]?.[0]).toBe(false)
  })

  it('shows the submitting label and disables both actions while submitting', () => {
    render(
      <FormDrawer
        open
        onOpenChange={vi.fn()}
        title="Nuevo docente"
        onSubmit={vi.fn()}
        isSubmitting
        submitSubmittingLabel="Guardando..."
      >
        <input aria-label="Nombre" />
      </FormDrawer>,
    )

    expect(screen.getByRole('button', { name: /Guardando/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Cancelar/ })).toBeDisabled()
  })
})
