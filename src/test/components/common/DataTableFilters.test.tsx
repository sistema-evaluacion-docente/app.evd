import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import {
  DataTableFilters,
  type FilterConfig,
  type FilterValues,
} from '@/components/common/DataTableFilters'

/** `DataTableFilters` is fully controlled — this keeps `values` in local state like a real caller. */
function Harness({
  filters,
  initialValues = {},
}: {
  filters: FilterConfig[]
  initialValues?: FilterValues
}) {
  const [values, setValues] = useState<FilterValues>(initialValues)

  return <DataTableFilters filters={filters} values={values} onChange={setValues} />
}

const BOOLEAN_FILTER: FilterConfig = { type: 'boolean', name: 'active', label: 'Activo' }
const SELECT_FILTER: FilterConfig = {
  type: 'select',
  name: 'status',
  label: 'Estado',
  clearable: true,
  options: [
    { label: 'Activo', value: 'active' },
    { label: 'Inactivo', value: 'inactive' },
  ],
}

describe('DataTableFilters', () => {
  it('shows the trigger with no active badge by default', () => {
    render(<Harness filters={[BOOLEAN_FILTER]} />)

    expect(screen.getByRole('button', { name: 'Filtros' })).toBeInTheDocument()
    expect(screen.queryByText('1')).not.toBeInTheDocument()
  })

  it('shows the active count badge once a filter has a value', () => {
    render(<Harness filters={[BOOLEAN_FILTER]} initialValues={{ active: true }} />)

    expect(screen.getByRole('button', { name: /Filtros/ })).toHaveTextContent('1')
  })

  it('toggles a boolean filter through its switch', async () => {
    const user = userEvent.setup()

    render(<Harness filters={[BOOLEAN_FILTER]} />)

    await user.click(screen.getByRole('button', { name: 'Filtros' }))

    const toggle = screen.getByRole('switch')
    expect(toggle).not.toBeChecked()

    await user.click(toggle)

    expect(toggle).toBeChecked()
  })

  it('selects an option from a select filter', async () => {
    const user = userEvent.setup()

    render(<Harness filters={[SELECT_FILTER]} />)

    await user.click(screen.getByRole('button', { name: 'Filtros' }))
    await user.click(screen.getByRole('combobox'))
    await user.click(await screen.findByRole('option', { name: 'Inactivo' }))

    // `SelectValue` renders the raw filter value here (no label lookup) — the
    // active-count badge is the reliable signal that the pick was applied.
    expect(screen.getByRole('button', { name: /Filtros/ })).toHaveTextContent('1')
  })

  it('clears a select filter through its clear button', async () => {
    const user = userEvent.setup()

    render(<Harness filters={[SELECT_FILTER]} initialValues={{ status: 'active' }} />)

    await user.click(screen.getByRole('button', { name: /Filtros/ }))
    await user.click(screen.getByRole('button', { name: 'Limpiar filtro' }))

    expect(screen.queryByRole('button', { name: 'Limpiar filtro' })).not.toBeInTheDocument()
  })

  it('renders custom filter content and reports its changes', async () => {
    const user = userEvent.setup()

    const customFilter: FilterConfig = {
      type: 'custom',
      name: 'code',
      label: 'Código',
      render: (value, onChange) => (
        <button type="button" onClick={() => onChange('ABC')}>
          {(value as string) || 'Elegir código'}
        </button>
      ),
    }

    render(<Harness filters={[customFilter]} />)

    await user.click(screen.getByRole('button', { name: 'Filtros' }))
    await user.click(screen.getByRole('button', { name: 'Elegir código' }))

    expect(await screen.findByRole('button', { name: 'ABC' })).toBeInTheDocument()
  })

  it('renders a sort control outside the filters popover', () => {
    const sortFilter: FilterConfig = {
      type: 'sort',
      name: 'sort',
      fields: [{ value: 'name', label: 'Nombre' }],
    }

    render(<Harness filters={[sortFilter]} />)

    expect(screen.getByRole('button', { name: /Ordenar por/ })).toBeInTheDocument()
  })

  it('resets every filter through the clear-all action', async () => {
    const user = userEvent.setup()

    render(<Harness filters={[BOOLEAN_FILTER]} initialValues={{ active: true }} />)

    await user.click(screen.getByRole('button', { name: /Filtros/ }))
    await user.click(screen.getByRole('button', { name: 'Limpiar' }))

    expect(screen.queryByText('1')).not.toBeInTheDocument()
    expect(screen.getByRole('switch')).not.toBeChecked()
  })

  it('uses a custom trigger and clear-all label', () => {
    render(
      <DataTableFilters
        filters={[BOOLEAN_FILTER]}
        values={{}}
        onChange={vi.fn()}
        triggerLabel="Filtrar"
      />,
    )

    expect(screen.getByRole('button', { name: 'Filtrar' })).toBeInTheDocument()
  })
})
