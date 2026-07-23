import { cn } from '@/lib/utils'
import type { ResponseAPI } from '@/shared/types/Response'
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import {
  EllipsisVertical,
  Eye,
  Pencil,
  Plus,
  Power,
  PowerOff,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useDebounce } from 'use-debounce'
import { useSearchParams } from 'wouter'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Skeleton } from '../ui/skeleton'

const DEFAULT_ACTION_ICONS: Record<string, React.ReactNode> = {
  'ver detalle': <Eye className="size-4" />,
  ver: <Eye className="size-4" />,
  editar: <Pencil className="size-4" />,
  activar: <Power className="size-4" />,
  desactivar: <PowerOff className="size-4" />,
  eliminar: <Trash2 className="size-4" />,
  'eliminar permanentemente': <Trash2 className="size-4" />,
}

export interface DataTableAction<TData> {
  label: string
  onClick: (row: TData) => void
  variant?: 'default' | 'destructive'
  className?: string
  disabled?: (row: TData) => boolean
  visible?: (row: TData) => boolean
  icon?: React.ReactNode
}

interface DataTableCreateConfigBase {
  label?: string
  dialogTitle?: string
  dialogDescription?: string
}

interface DataTableCreateConfigCustomForm extends DataTableCreateConfigBase {
  renderForm: (helpers: { close: () => void }) => React.ReactNode
}

interface DataTableCreateConfigDefault extends DataTableCreateConfigBase {
  mutation: UseMutationResult<unknown, Error, { nombre: string }, unknown>
  fieldLabel?: string
  placeholder?: string
  renderForm?: undefined
}

export type DataTableCreateConfig = DataTableCreateConfigCustomForm | DataTableCreateConfigDefault

interface DataTableProps<TData> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<TData, any>[]
  emptyMessage?: string
  minWidthClassName?: string
  containerClassName?: string
  tableClassName?: string
  headRowClassName?: string
  bodyRowClassName?: string
  headerCellClassName?: string
  cellClassName?: string
  enableSorting?: boolean
  enableSearch?: boolean
  enableFilters?: boolean
  searchPlaceholder?: string
  pageSize?: number
  pageSizeOptions?: number[]
  rowActions?: DataTableAction<TData>[]
  actionsHeaderLabel?: string
  queryFn: (params: {
    page: number
    limit: number
    search: string
  }) => UseQueryResult<ResponseAPI<TData[]>>
  extraFilterParams?: Record<string, string | number | undefined>
  createConfig?: DataTableCreateConfig
  filters?: React.ReactNode
  disabledPagination?: boolean
}

/**
 * DataTable component that displays a table with sorting, searching, and pagination capabilities.
 * @template TData The type of data to display in the table.
 */
function DataTable<TData>({
  columns,
  emptyMessage = 'Sin datos para mostrar.',
  minWidthClassName = 'min-w-230',
  containerClassName,
  tableClassName,
  headRowClassName,
  bodyRowClassName,
  headerCellClassName,
  cellClassName,
  enableSorting = true,
  enableSearch = true,
  enableFilters = true,
  searchPlaceholder = 'Buscar...',
  pageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  rowActions = [],
  actionsHeaderLabel = 'Acciones',
  queryFn,
  extraFilterParams,
  createConfig,
  filters,
  disabledPagination,
}: DataTableProps<TData>) {
  const [searchParams, setSearchParams] = useSearchParams()

  const pageValue = searchParams.get('page') ?? 1
  const limitValue = searchParams.get('limit') ?? pageSize
  const searchValue = searchParams.get('search') ?? ''

  const [search, setSearch] = useState(searchValue)
  const [page, setPage] = useState(Number(pageValue ?? 1))
  const [limit, setLimit] = useState(Number(limitValue ?? pageSize))

  const [value] = useDebounce(search ?? '', 400)

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newItemName, setNewItemName] = useState('')

  // A page number is only meaningful for the result set it was drawn from, so
  // snap back to the first page whenever the search term or an external filter
  // changes — otherwise a narrower result set leaves you stranded on an empty page.
  const filterKey = JSON.stringify([value, extraFilterParams])
  const [appliedFilterKey, setAppliedFilterKey] = useState(filterKey)
  if (appliedFilterKey !== filterKey) {
    setAppliedFilterKey(filterKey)
    setPage(1)
  }

  const { data, isLoading, isFetching, refetch } = queryFn({
    page,
    limit,
    search: value,
    ...extraFilterParams,
  })

  const result = (data?.data ?? []) as TData[]
  const paginationData = data?.pagination
  const hasRowActions = rowActions.length > 0

  const table = useReactTable({
    data: result,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableSorting,
  })

  useEffect(() => {
    const currentSearch = searchParams.get('search') ?? ''
    const currentPage = Number(searchParams.get('page') ?? 1)
    const currentLimit = Number(searchParams.get('limit') ?? pageSize)

    if (currentSearch === value && currentPage === page && currentLimit === limit) {
      return
    }

    setSearchParams((prev) => {
      return {
        ...prev,
        page: String(page),
        limit: String(limit),
        search: value,
      }
    })
  }, [page, limit, value, searchParams, setSearchParams, pageSize])

  return (
    <>
      {enableFilters && (
        <div className="flex items-center gap-2">
          {enableSearch ? (
            <Input
              type="text"
              value={search ?? ''}
              onChange={(event) => {
                setSearch(event.target.value)
              }}
              placeholder={searchPlaceholder}
              className="bg-background"
            />
          ) : null}

          {filters}

          <div className="ml-auto flex items-center gap-2">
            {createConfig ? (
              <Button
                size="sm"
                type="button"
                onClick={() => {
                  setNewItemName('')
                  setIsCreateDialogOpen(true)
                }}
              >
                <Plus className="size-4" />
                {createConfig.label ?? 'Nuevo'}
              </Button>
            ) : null}

            <Button
              size="sm"
              type="button"
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
              className="shrink-0"
            >
              <RotateCcw className={cn('size-4', isFetching && 'animate-spin')} />
              Recargar
            </Button>
          </div>
        </div>
      )}

      <div
        className={cn(
          'bg-background animate-fade-in overflow-x-auto rounded-lg border',
          containerClassName,
        )}
      >
        <table className={cn('w-full text-sm', minWidthClassName, tableClassName)}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className={cn('bg-background/50 border-b uppercase', headRowClassName)}
              >
                {headerGroup.headers.map((header) => {
                  return (
                    <th
                      key={header.id}
                      className={cn(
                        'bg-muted/50 text-muted-foreground px-5 py-3 text-left font-semibold first:pl-6 last:pr-6',
                        headerCellClassName,
                      )}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  )
                })}

                {hasRowActions ? (
                  <th
                    className={cn(
                      'bg-muted/50 text-muted-foreground px-5 py-3 text-right font-semibold first:pl-6 last:pr-6',
                      headerCellClassName,
                    )}
                  >
                    {actionsHeaderLabel}
                  </th>
                ) : null}
              </tr>
            ))}
          </thead>

          <tbody>
            <>
              {isLoading ? (
                <>
                  {[0, 1, 2, 3, 4].map((el) => (
                    <tr key={el} className="w-full">
                      {columns.map((column, index) => (
                        <td key={column.id ?? index} className="animate-fade-in w-auto px-2 py-1">
                          <Skeleton className="h-8 w-full" />
                        </td>
                      ))}

                      {hasRowActions ? (
                        <td className="w-auto px-2 py-1">
                          <Skeleton className="h-8 w-full" />
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </>
              ) : (
                <>
                  {table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columns.length + (hasRowActions ? 1 : 0)}
                        className="animate-fade-in py-10 text-center"
                      >
                        <p className="text-muted-foreground">{emptyMessage}</p>
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className={cn('border-b transition-colors', bodyRowClassName)}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className={cn(
                              'animate-fade-in px-5 py-4 align-middle first:pl-6 last:pr-6',
                              cellClassName,
                            )}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}

                        {hasRowActions ? (
                          <td
                            className={cn(
                              'animate-fade-in px-5 py-4 text-right align-middle first:pl-6 last:pr-6',
                              cellClassName,
                            )}
                          >
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button type="button" variant="ghost" size="sm">
                                    <EllipsisVertical />
                                  </Button>
                                }
                              ></DropdownMenuTrigger>

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
                                      disabled={
                                        action.disabled ? action.disabled(row.original) : false
                                      }
                                      onClick={() => action.onClick(row.original)}
                                    >
                                      {(() => {
                                        const icon =
                                          action.icon ??
                                          DEFAULT_ACTION_ICONS[action.label.toLowerCase()]

                                        return icon ? (
                                          <span className="size-4 shrink-0">{icon}</span>
                                        ) : null
                                      })()}

                                      {action.label}
                                    </DropdownMenuItem>
                                  ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        ) : null}
                      </tr>
                    ))
                  )}
                </>
              )}
            </>
          </tbody>
        </table>
      </div>

      {!disabledPagination && (
        <>
          {!isLoading && table.getRowModel().rows.length > 0 ? (
            <div className="text-muted-foreground mt-3 flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span>Filas por página</span>

                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
                    {limit}
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="start" className="w-24">
                    {pageSizeOptions.map((size) => (
                      <DropdownMenuItem key={size} onClick={() => setLimit(size)}>
                        {size}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-3">
                <span>
                  Página {page} de {paginationData?.pages ?? 1}
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Anterior
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= (paginationData?.pages ?? 0)}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}

      {createConfig ? (
        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open)
            if (!open) setNewItemName('')
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{createConfig.dialogTitle ?? 'Crear elemento'}</DialogTitle>
              {createConfig.dialogDescription ? (
                <p className="text-muted-foreground text-sm">{createConfig.dialogDescription}</p>
              ) : null}
            </DialogHeader>

            {createConfig.renderForm ? (
              createConfig.renderForm({
                close: () => {
                  setIsCreateDialogOpen(false)
                  setNewItemName('')
                },
              })
            ) : (
              <>
                <div className="grid gap-2">
                  <Label>{createConfig.fieldLabel ?? 'Nombre'}</Label>
                  <Input
                    value={newItemName}
                    onChange={(event) => setNewItemName(event.target.value)}
                    placeholder={createConfig.placeholder ?? 'Ingrese el nombre...'}
                    onKeyDown={(event) => {
                      if (
                        event.key === 'Enter' &&
                        newItemName.trim() &&
                        !createConfig.mutation.isPending
                      ) {
                        event.preventDefault()
                        createConfig.mutation.mutate(
                          { nombre: newItemName.trim() },
                          {
                            onSuccess: () => {
                              toast.success('Elemento creado exitosamente')
                              setIsCreateDialogOpen(false)
                              setNewItemName('')
                            },
                            onError: () => {
                              toast.error('Error al crear el elemento')
                            },
                          },
                        )
                      }
                    }}
                  />
                </div>

                <DialogFooter>
                  <Button
                    onClick={() => {
                      createConfig.mutation.mutate(
                        { nombre: newItemName.trim() },
                        {
                          onSuccess: () => {
                            toast.success('Elemento creado exitosamente')
                            setIsCreateDialogOpen(false)
                            setNewItemName('')
                          },
                          onError: () => {
                            toast.error('Error al crear el elemento')
                          },
                        },
                      )
                    }}
                    disabled={!newItemName.trim() || createConfig.mutation.isPending}
                  >
                    {createConfig.mutation.isPending ? 'Creando...' : 'Crear'}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  )
}

export default DataTable
