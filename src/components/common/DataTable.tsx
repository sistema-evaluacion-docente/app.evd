import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
} from '@tanstack/react-table'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  EllipsisVertical,
  Inbox,
  Search,
  TriangleAlert,
} from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export interface DataTableAction<TData> {
  label: string
  onClick: (row: TData) => void
  variant?: 'default' | 'destructive'
  className?: string
  disabled?: (row: TData) => boolean
  visible?: (row: TData) => boolean
  icon?: ReactNode
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[]
  /** Rows already fetched by the caller's query hook (server-side). */
  data: TData[]
  /** Total number of pages reported by the server. */
  pageCount: number
  isLoading?: boolean
  isFetching?: boolean
  error?: Error | null
  search: string
  onSearchChange: (search: string) => void
  sorting: SortingState
  onSortingChange: OnChangeFn<SortingState>
  pagination: PaginationState
  onPaginationChange: OnChangeFn<PaginationState>
  enableSearch?: boolean
  searchPlaceholder?: string
  emptyMessage?: string
  rowActions?: DataTableAction<TData>[]
  actionsHeaderLabel?: string
  /** Called when a row is clicked (excluding the actions column). */
  onRowClick?: (row: TData) => void
  /** Returns `true` for rows that should render in a deactivated (dimmed) state. */
  isRowDisabled?: (row: TData) => boolean
  /** Extra controls rendered next to the search input (e.g. filter selects). */
  toolbar?: ReactNode
  /** Actions rendered on the right side of the toolbar (e.g. refresh). */
  toolbarActions?: ReactNode
  pageSizeOptions?: number[]
  className?: string
}

/**
 * Presentational, fully server-side table built on `@tanstack/react-table`.
 * The caller owns the query hook and all table state (search, sorting,
 * pagination) — this component only renders, so it works with any query.
 *
 * @example
 * const { data, isPending, isFetching } = useGetEvaluations({
 *   page: pagination.pageIndex + 1,
 *   limit: pagination.pageSize,
 *   search: debouncedSearch,
 * })
 *
 * <DataTable
 *   columns={columns}
 *   data={data?.data ?? []}
 *   pageCount={data?.pagination?.pages ?? 1}
 *   isLoading={isPending}
 *   isFetching={isFetching}
 *   search={search}
 *   onSearchChange={setSearch}
 *   sorting={sorting}
 *   onSortingChange={setSorting}
 *   pagination={pagination}
 *   onPaginationChange={setPagination}
 * />
 */
export function DataTable<TData>({
  columns,
  data,
  pageCount,
  isLoading = false,
  isFetching = false,
  error,
  search,
  onSearchChange,
  sorting,
  onSortingChange,
  pagination,
  onPaginationChange,
  enableSearch = true,
  searchPlaceholder = 'Buscar...',
  emptyMessage = 'Sin datos para mostrar.',
  rowActions = [],
  actionsHeaderLabel = 'Acciones',
  onRowClick,
  isRowDisabled,
  toolbar,
  toolbarActions,
  pageSizeOptions = [5, 10, 20, 50],
  className,
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    state: { sorting, pagination },
    onSortingChange,
    onPaginationChange,
    pageCount,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    getCoreRowModel: getCoreRowModel(),
  })

  const hasRowActions = rowActions.length > 0
  const visibleColumns = table.getVisibleFlatColumns().length
  const colSpan = visibleColumns + (hasRowActions ? 1 : 0)
  const showToolbar = enableSearch || Boolean(toolbar) || Boolean(toolbarActions)
  const showPagination = !isLoading && !error && data.length > 0

  return (
    <div className={cn('space-y-4', className)}>
      {showToolbar ? (
        <div className="flex flex-wrap items-center gap-3">
          {enableSearch ? (
            <div className="relative">
              <Search
                aria-hidden="true"
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
              />
              <Input
                type="text"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="bg-background h-9 w-56 pl-9 shadow-none"
              />
            </div>
          ) : null}

          {toolbar}

          <div className="ml-auto flex items-center gap-2">
            {isFetching || isLoading ? (
              <Spinner aria-label="Cargando" className="text-muted-foreground size-4" />
            ) : null}

            {toolbarActions}
          </div>
        </div>
      ) : null}

      <div className="bg-background border-border/70 overflow-hidden rounded-lg border">
        <Table className="tabular-nums">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-border/70 bg-transparent hover:bg-transparent"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-muted-foreground h-10 px-4 text-xs font-medium tracking-wider uppercase"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}

                {hasRowActions ? (
                  <TableHead className="text-muted-foreground h-10 px-4 text-right text-xs font-medium tracking-wider uppercase">
                    {actionsHeaderLabel}
                  </TableHead>
                ) : null}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody className={cn('transition-opacity', isFetching && !isLoading && 'opacity-50')}>
            {isLoading ? (
              Array.from({ length: 5 }, (_, index) => (
                <TableRow key={index} className="border-border/60">
                  {Array.from({ length: visibleColumns }, (__, columnIndex) => (
                    <TableCell key={columnIndex} className="px-4 py-3.5">
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}

                  {hasRowActions ? (
                    <TableCell className="px-4 py-3.5">
                      <Skeleton className="ml-auto h-7 w-7" />
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            ) : error ? (
              <TableRow className="border-border/60">
                <TableCell colSpan={colSpan} className="py-16 text-center">
                  <TriangleAlert
                    aria-hidden="true"
                    className="text-destructive/60 mx-auto mb-3 size-8"
                  />
                  <p className="text-destructive text-sm">{error.message}</p>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow className="border-border/60">
                <TableCell colSpan={colSpan} className="py-16 text-center">
                  <Inbox
                    aria-hidden="true"
                    className="text-muted-foreground/40 mx-auto mb-3 size-8"
                  />
                  <p className="text-muted-foreground text-sm">{emptyMessage}</p>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => {
                const rowDisabled = isRowDisabled ? isRowDisabled(row.original) : false

                return (
                  <TableRow
                    key={row.id}
                    className={cn(
                      'animate-fade-in border-border/60 transition-colors duration-150',
                      rowDisabled
                        ? 'bg-muted/20 hover:bg-muted/20 opacity-60'
                        : 'hover:bg-muted/30',
                      onRowClick && !rowDisabled && 'cursor-pointer',
                    )}
                    onClick={
                      onRowClick && !rowDisabled ? () => onRowClick(row.original) : undefined
                    }
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-4 py-3.5 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}

                    {hasRowActions ? (
                      <TableCell
                        className="px-4 py-3.5 text-right align-middle"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label={actionsHeaderLabel}
                                className="text-muted-foreground opacity-70 transition-opacity hover:opacity-100"
                              >
                                <EllipsisVertical className="size-4" />
                              </Button>
                            }
                          />

                          <DropdownMenuContent align="end" className="w-auto min-w-40">
                            {rowActions
                              .filter((action) =>
                                action.visible ? action.visible(row.original) : true,
                              )
                              .map((action) => (
                                <DropdownMenuItem
                                  key={action.label}
                                  variant={action.variant ?? 'default'}
                                  className={action.className}
                                  disabled={action.disabled ? action.disabled(row.original) : false}
                                  onClick={() => action.onClick(row.original)}
                                >
                                  {action.icon ? (
                                    <span aria-hidden="true" className="shrink-0">
                                      {action.icon}
                                    </span>
                                  ) : null}

                                  {action.label}
                                </DropdownMenuItem>
                              ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    ) : null}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {showPagination ? (
        <div className="text-muted-foreground flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span>Filas por página</span>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="sm" className="text-foreground rounded-md px-2">
                    {pagination.pageSize}
                    <ChevronDown aria-hidden="true" className="size-3.5" />
                  </Button>
                }
              />

              <DropdownMenuContent align="start" className="w-20">
                {pageSizeOptions.map((size) => (
                  <DropdownMenuItem
                    key={size}
                    onClick={() =>
                      onPaginationChange({ ...pagination, pageSize: size, pageIndex: 0 })
                    }
                  >
                    {size}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Página anterior"
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
            </Button>

            <span aria-live="polite" className="min-w-20 text-center text-sm tabular-nums">
              Página {pagination.pageIndex + 1} de {table.getPageCount()}
            </span>

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Página siguiente"
            >
              <ChevronRight aria-hidden="true" className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
