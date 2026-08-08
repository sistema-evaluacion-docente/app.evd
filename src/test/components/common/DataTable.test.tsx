import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table'
import { describe, expect, it, vi } from 'vitest'

import { DataTable, type DataTableAction } from '@/components/common/DataTable'

interface Person {
  id: number
  name: string
}

const PEOPLE: Person[] = [
  { id: 1, name: 'Ada Lovelace' },
  { id: 2, name: 'Grace Hopper' },
]

const COLUMNS: ColumnDef<Person, unknown>[] = [{ accessorKey: 'name', header: 'Nombre' }]

const DEFAULT_PAGINATION: PaginationState = { pageIndex: 0, pageSize: 10 }
const DEFAULT_SORTING: SortingState = []

function renderTable(props: Partial<React.ComponentProps<typeof DataTable<Person>>> = {}) {
  return render(
    <DataTable
      columns={COLUMNS}
      data={PEOPLE}
      pageCount={1}
      search=""
      onSearchChange={vi.fn()}
      sorting={DEFAULT_SORTING}
      onSortingChange={vi.fn()}
      pagination={DEFAULT_PAGINATION}
      onPaginationChange={vi.fn()}
      {...props}
    />,
  )
}

describe('DataTable', () => {
  it('renders one row per record with the configured columns', () => {
    renderTable()

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByText('Grace Hopper')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Nombre' })).toBeInTheDocument()
  })

  it('shows five skeleton rows while loading', () => {
    const { container } = renderTable({ data: [], isLoading: true })

    const rows = within(screen.getByRole('table')).getAllByRole('row')
    expect(rows).toHaveLength(6) // header + 5 skeleton rows
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
  })

  it('shows the error message instead of rows', () => {
    renderTable({ data: [], error: new Error('No se pudo cargar la lista') })

    expect(screen.getByText('No se pudo cargar la lista')).toBeInTheDocument()
    expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument()
  })

  it('shows the empty message when there is no data', () => {
    renderTable({ data: [] })

    expect(screen.getByText('Sin datos para mostrar.')).toBeInTheDocument()
  })

  it('uses a custom empty message', () => {
    renderTable({ data: [], emptyMessage: 'No hay docentes registrados.' })

    expect(screen.getByText('No hay docentes registrados.')).toBeInTheDocument()
  })

  it('shows a search input by default and reports typed changes', async () => {
    const user = userEvent.setup()
    const onSearchChange = vi.fn()

    renderTable({ onSearchChange })

    const search = screen.getByRole('textbox', { name: 'Buscar...' })
    await user.type(search, 'Ada')

    expect(onSearchChange).toHaveBeenCalled()
  })

  it('hides the toolbar entirely when search and extras are disabled', () => {
    renderTable({ enableSearch: false })

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('renders the toolbar and toolbar actions slots', () => {
    renderTable({
      toolbar: <span>Filtro extra</span>,
      toolbarActions: <button type="button">Refrescar</button>,
    })

    expect(screen.getByText('Filtro extra')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Refrescar' })).toBeInTheDocument()
  })

  it('shows a loading spinner while fetching in the background', () => {
    renderTable({ isFetching: true })

    expect(screen.getByRole('status', { name: 'Cargando' })).toBeInTheDocument()
  })

  it('reports the clicked row through onRowClick', async () => {
    const user = userEvent.setup()
    const onRowClick = vi.fn()

    renderTable({ onRowClick })

    await user.click(screen.getByText('Ada Lovelace'))

    expect(onRowClick).toHaveBeenCalledWith(PEOPLE[0])
  })

  it('does not report clicks on rows marked as disabled', async () => {
    const user = userEvent.setup()
    const onRowClick = vi.fn()

    renderTable({ onRowClick, isRowDisabled: (row) => row.id === 1 })

    await user.click(screen.getByText('Ada Lovelace'))

    expect(onRowClick).not.toHaveBeenCalled()
  })

  it('renders row actions and runs the clicked one', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()

    const rowActions: DataTableAction<Person>[] = [{ label: 'Eliminar', onClick: onDelete }]

    renderTable({ rowActions })

    const menuButtons = screen.getAllByRole('button', { name: 'Acciones' })
    await user.click(menuButtons[0])
    await user.click(await screen.findByRole('menuitem', { name: 'Eliminar' }))

    expect(onDelete).toHaveBeenCalledWith(PEOPLE[0])
  })

  it('hides row actions filtered out by visible()', async () => {
    const user = userEvent.setup()

    const rowActions: DataTableAction<Person>[] = [
      { label: 'Eliminar', onClick: vi.fn(), visible: (row) => row.id !== 1 },
    ]

    renderTable({ rowActions })

    const menuButtons = screen.getAllByRole('button', { name: 'Acciones' })
    await user.click(menuButtons[0])

    expect(screen.queryByRole('menuitem', { name: 'Eliminar' })).not.toBeInTheDocument()
  })

  it('shows pagination controls and the current page', () => {
    renderTable({ pageCount: 3, pagination: { pageIndex: 0, pageSize: 10 } })

    expect(screen.getByText('Página 1 de 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeEnabled()
  })

  it('reports the next page through onPaginationChange', async () => {
    const user = userEvent.setup()
    const onPaginationChange = vi.fn()

    renderTable({
      pageCount: 3,
      pagination: { pageIndex: 0, pageSize: 10 },
      onPaginationChange,
    })

    await user.click(screen.getByRole('button', { name: 'Página siguiente' }))

    expect(onPaginationChange).toHaveBeenCalled()
  })

  it('hides pagination while loading or on error', () => {
    renderTable({ isLoading: true, data: [] })

    expect(screen.queryByRole('button', { name: 'Página siguiente' })).not.toBeInTheDocument()
  })

  it('changes the page size through the page size menu', async () => {
    const user = userEvent.setup()
    const onPaginationChange = vi.fn()

    renderTable({ onPaginationChange })

    await user.click(screen.getByRole('button', { name: /10/ }))
    await user.click(await screen.findByRole('menuitem', { name: '20' }))

    expect(onPaginationChange).toHaveBeenCalledWith({ pageIndex: 0, pageSize: 20 })
  })
})
