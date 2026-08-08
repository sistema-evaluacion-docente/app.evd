import type { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import {
  DataTable,
  type DataTableAction,
  type DataTableBulkAction,
} from '@/components/common/DataTable'

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

  describe('row selection', () => {
    it('does not render checkboxes by default', () => {
      renderTable()

      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    })

    it('renders a checkbox per row plus a select-all checkbox', () => {
      renderTable({ enableRowSelection: true })

      expect(screen.getByRole('checkbox', { name: 'Seleccionar todo' })).toBeInTheDocument()
      expect(screen.getAllByRole('checkbox', { name: 'Seleccionar fila' })).toHaveLength(2)
    })

    it('selects a single row and marks select-all as indeterminate', async () => {
      const user = userEvent.setup()

      renderTable({ enableRowSelection: true })

      const rowCheckboxes = screen.getAllByRole('checkbox', { name: 'Seleccionar fila' })
      await user.click(rowCheckboxes[0])

      expect(rowCheckboxes[0]).toBeChecked()
      expect(screen.getByRole('checkbox', { name: 'Seleccionar todo' })).toHaveAttribute(
        'aria-checked',
        'mixed',
      )
    })

    it('selects and clears all rows through the select-all checkbox', async () => {
      const user = userEvent.setup()

      renderTable({ enableRowSelection: true })

      const selectAll = screen.getByRole('checkbox', { name: 'Seleccionar todo' })
      await user.click(selectAll)

      const rowCheckboxes = screen.getAllByRole('checkbox', { name: 'Seleccionar fila' })
      expect(rowCheckboxes[0]).toBeChecked()
      expect(rowCheckboxes[1]).toBeChecked()
      expect(selectAll).toBeChecked()

      await user.click(selectAll)

      expect(rowCheckboxes[0]).not.toBeChecked()
      expect(rowCheckboxes[1]).not.toBeChecked()
    })

    it('does not trigger onRowClick when toggling a row checkbox', async () => {
      const user = userEvent.setup()
      const onRowClick = vi.fn()

      renderTable({ enableRowSelection: true, onRowClick })

      const rowCheckboxes = screen.getAllByRole('checkbox', { name: 'Seleccionar fila' })
      await user.click(rowCheckboxes[0])

      expect(onRowClick).not.toHaveBeenCalled()
    })

    it('disables the checkbox for rows excluded by isRowSelectable', () => {
      renderTable({ enableRowSelection: true, isRowSelectable: (row) => row.id !== 1 })

      const rowCheckboxes = screen.getAllByRole('checkbox', { name: 'Seleccionar fila' })
      expect(rowCheckboxes[0]).toHaveAttribute('aria-disabled', 'true')
      expect(rowCheckboxes[1]).not.toHaveAttribute('aria-disabled')
    })

    it('hides the bulk actions bar when nothing is selected', () => {
      const bulkActions: DataTableBulkAction<Person>[] = [{ label: 'Eliminar', onClick: vi.fn() }]

      renderTable({ enableRowSelection: true, bulkActions })

      expect(screen.queryByText(/seleccionad/)).not.toBeInTheDocument()
    })

    it('shows the bulk actions bar with the selection count once rows are selected', async () => {
      const user = userEvent.setup()
      const bulkActions: DataTableBulkAction<Person>[] = [{ label: 'Eliminar', onClick: vi.fn() }]

      renderTable({ enableRowSelection: true, bulkActions })

      const rowCheckboxes = screen.getAllByRole('checkbox', { name: 'Seleccionar fila' })
      await user.click(rowCheckboxes[0])
      await user.click(rowCheckboxes[1])

      expect(screen.getByText('2 seleccionados')).toBeInTheDocument()
    })

    it('runs the clicked bulk action with the selected rows and clears the selection', async () => {
      const user = userEvent.setup()
      const onDeleteMany = vi.fn()
      const bulkActions: DataTableBulkAction<Person>[] = [
        { label: 'Eliminar', onClick: onDeleteMany },
      ]

      renderTable({ enableRowSelection: true, bulkActions })

      const rowCheckboxes = screen.getAllByRole('checkbox', { name: 'Seleccionar fila' })
      await user.click(rowCheckboxes[0])
      await user.click(screen.getByRole('button', { name: 'Eliminar' }))

      expect(onDeleteMany).toHaveBeenCalledWith([PEOPLE[0]])
      expect(screen.queryByText(/seleccionad/)).not.toBeInTheDocument()
      expect(rowCheckboxes[0]).not.toBeChecked()
    })

    it('keeps the selection after a bulk action when keepSelection is set', async () => {
      const user = userEvent.setup()
      const bulkActions: DataTableBulkAction<Person>[] = [
        { label: 'Exportar', onClick: vi.fn(), keepSelection: true },
      ]

      renderTable({ enableRowSelection: true, bulkActions })

      const rowCheckboxes = screen.getAllByRole('checkbox', { name: 'Seleccionar fila' })
      await user.click(rowCheckboxes[0])
      await user.click(screen.getByRole('button', { name: 'Exportar' }))

      expect(rowCheckboxes[0]).toBeChecked()
      expect(screen.getByText('1 seleccionado')).toBeInTheDocument()
    })

    it('clears the selection through the "Limpiar selección" button', async () => {
      const user = userEvent.setup()
      const bulkActions: DataTableBulkAction<Person>[] = [{ label: 'Eliminar', onClick: vi.fn() }]

      renderTable({ enableRowSelection: true, bulkActions })

      const rowCheckboxes = screen.getAllByRole('checkbox', { name: 'Seleccionar fila' })
      await user.click(rowCheckboxes[0])
      await user.click(screen.getByRole('button', { name: /Limpiar selección/ }))

      expect(rowCheckboxes[0]).not.toBeChecked()
      expect(screen.queryByText(/seleccionad/)).not.toBeInTheDocument()
    })

    it('reports selection changes through a controlled rowSelection prop', async () => {
      const user = userEvent.setup()
      const onRowSelectionChange = vi.fn()

      renderTable({
        enableRowSelection: true,
        rowSelection: {},
        onRowSelectionChange,
      })

      const rowCheckboxes = screen.getAllByRole('checkbox', { name: 'Seleccionar fila' })
      await user.click(rowCheckboxes[0])

      expect(onRowSelectionChange).toHaveBeenCalled()
      // Controlled state does not change on its own until the caller updates it.
      expect(rowCheckboxes[0]).not.toBeChecked()
    })

    it('uses a custom selection count label', async () => {
      const user = userEvent.setup()
      const bulkActions: DataTableBulkAction<Person>[] = [{ label: 'Eliminar', onClick: vi.fn() }]

      renderTable({
        enableRowSelection: true,
        bulkActions,
        selectionCountLabel: (count) => `${count} docente(s) elegido(s)`,
      })

      const rowCheckboxes = screen.getAllByRole('checkbox', { name: 'Seleccionar fila' })
      await user.click(rowCheckboxes[0])

      expect(screen.getByText('1 docente(s) elegido(s)')).toBeInTheDocument()
    })
  })
})
