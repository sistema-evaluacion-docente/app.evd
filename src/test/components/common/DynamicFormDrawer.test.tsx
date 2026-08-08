import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { DynamicFormDrawer, type FieldConfig } from '@/components/common/DynamicFormDrawer'

const TEXT_FIELDS: FieldConfig[] = [
  { name: 'name', label: 'Nombre', required: true },
  { name: 'bio', label: 'Biografía', type: 'textarea' },
]

describe('DynamicFormDrawer', () => {
  it('shows the trigger button and keeps the drawer closed initially', () => {
    render(
      <DynamicFormDrawer
        title="Nuevo docente"
        triggerLabel="Agregar"
        fields={TEXT_FIELDS}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Agregar' })).toBeInTheDocument()
    expect(screen.queryByText('Nuevo docente')).not.toBeInTheDocument()
  })

  it('opens the drawer when the trigger is clicked', async () => {
    const user = userEvent.setup()

    render(
      <DynamicFormDrawer
        title="Nuevo docente"
        triggerLabel="Agregar"
        fields={TEXT_FIELDS}
        onSubmit={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Agregar' }))

    expect(screen.getByText('Nuevo docente')).toBeInTheDocument()
    expect(screen.getByLabelText(/Nombre/)).toBeInTheDocument()
    expect(screen.getByLabelText('Biografía')).toBeInTheDocument()
  })

  it('reports typed values as a flat record on submit', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(
      <DynamicFormDrawer
        title="Nuevo docente"
        triggerLabel="Agregar"
        fields={TEXT_FIELDS}
        onSubmit={onSubmit}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Agregar' }))
    await user.type(screen.getByLabelText(/Nombre/), 'Ada Lovelace')
    await user.type(screen.getByLabelText('Biografía'), 'Pionera')
    await user.click(screen.getByRole('button', { name: /Guardar/ }))

    expect(onSubmit).toHaveBeenCalledWith({ name: 'Ada Lovelace', bio: 'Pionera' })
  })

  it('toggles a boolean field through its switch', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(
      <DynamicFormDrawer
        title="Nuevo docente"
        triggerLabel="Agregar"
        fields={[{ name: 'active', label: 'Activo', type: 'boolean' }]}
        onSubmit={onSubmit}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Agregar' }))

    const toggle = screen.getByRole('switch', { name: 'Activo' })
    expect(toggle).not.toBeChecked()

    await user.click(toggle)
    expect(toggle).toBeChecked()

    await user.click(screen.getByRole('button', { name: /Guardar/ }))

    expect(onSubmit).toHaveBeenCalledWith({ active: 'true' })
  })

  it('toggles options of a multiSelect field', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(
      <DynamicFormDrawer
        title="Nuevo docente"
        triggerLabel="Agregar"
        fields={[
          {
            name: 'roles',
            label: 'Roles',
            type: 'multiSelect',
            options: [
              { label: 'Admin', value: 'admin' },
              { label: 'Docente', value: 'docente' },
            ],
          },
        ]}
        onSubmit={onSubmit}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Agregar' }))
    await user.click(screen.getByRole('button', { name: 'Admin' }))
    await user.click(screen.getByRole('button', { name: /Guardar/ }))

    expect(onSubmit).toHaveBeenCalledWith({ roles: 'admin' })
  })

  it('respects a controlled open state and hides the trigger', () => {
    render(
      <DynamicFormDrawer
        title="Nuevo docente"
        fields={TEXT_FIELDS}
        onSubmit={vi.fn()}
        open
        onOpenChange={vi.fn()}
        hideTrigger
      />,
    )

    expect(screen.queryByRole('button', { name: 'Agregar' })).not.toBeInTheDocument()
    expect(screen.getByText('Nuevo docente')).toBeInTheDocument()
  })

  it('reports the controlled open state through onOpenChange when cancelled', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()

    render(
      <DynamicFormDrawer
        title="Nuevo docente"
        fields={TEXT_FIELDS}
        onSubmit={vi.fn()}
        open
        onOpenChange={onOpenChange}
        hideTrigger
      />,
    )

    await user.click(screen.getByRole('button', { name: /Cancelar/ }))

    expect(onOpenChange.mock.calls[0]?.[0]).toBe(false)
  })
})
