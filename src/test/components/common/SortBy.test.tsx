import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import SortBy, { type SortByField } from '@/components/common/SortBy'

const FIELDS: SortByField[] = [
  { value: 'name', label: 'Nombre' },
  { value: 'date', label: 'Fecha' },
]

describe('SortBy', () => {
  it('shows the placeholder when there is no value', () => {
    render(<SortBy fields={FIELDS} value="" onChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: /Ordenar por/ })).toBeInTheDocument()
  })

  it('shows the label of the currently sorted field', () => {
    render(<SortBy fields={FIELDS} value="name_asc" onChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: /Nombre/ })).toBeInTheDocument()
  })

  it('lists every field and the default directions when opened', async () => {
    const user = userEvent.setup()

    render(<SortBy fields={FIELDS} value="" onChange={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /Ordenar por/ }))

    expect(screen.getByRole('button', { name: 'Nombre' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fecha' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Desc' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Asc' })).toBeInTheDocument()
  })

  it('reports the built field_direction value once the popover closes', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<SortBy fields={FIELDS} value="" onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: /Ordenar por/ }))
    await user.click(screen.getByRole('button', { name: 'Fecha' }))
    await user.click(screen.getByRole('button', { name: 'Asc' }))
    await user.keyboard('{Escape}')

    expect(onChange).toHaveBeenCalledWith('date_asc')
  })

  it('uses a custom parse/build pair for the current value', () => {
    render(
      <SortBy
        fields={FIELDS}
        value="name:asc"
        onChange={vi.fn()}
        parse={(value) => {
          const [field, direction] = value.split(':')
          return { field, direction }
        }}
        build={(field, direction) => `${field}:${direction}`}
      />,
    )

    expect(screen.getByRole('button', { name: /Nombre/ })).toBeInTheDocument()
  })

  it('does not render a clear action by default', async () => {
    const user = userEvent.setup()

    render(<SortBy fields={FIELDS} value="name_asc" onChange={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /Nombre/ }))

    expect(screen.queryByRole('button', { name: 'Sin orden' })).not.toBeInTheDocument()
  })

  it('clears the value through the clear action when clearable', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<SortBy fields={FIELDS} value="name_asc" onChange={onChange} clearable />)

    await user.click(screen.getByRole('button', { name: /Nombre/ }))
    await user.click(screen.getByRole('button', { name: 'Sin orden' }))

    expect(onChange).toHaveBeenCalledWith('')
  })
})
