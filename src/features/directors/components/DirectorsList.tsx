import type { PaginationState, SortingState } from '@tanstack/react-table'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useDebounce } from 'use-debounce'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DataTable, type DataTableAction } from '@/components/common/DataTable'
import { DataTableFilters, type FilterConfig } from '@/components/common/DataTableFilters'
import { useTableFilters } from '@/hooks/useTableFilters'
import { useDeleteDirector, useGetDirectors } from '../api'
import type { Director } from '../types'
import { directorColumns } from './columns'

/**
 * Displays the paginated list of directors with server-side search and an
 * active-status filter, powered by the shared `DataTable`.
 *
 * @example
 * <DirectorsList />
 */
export function DirectorsList() {
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, 400)
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const [deleteTarget, setDeleteTarget] = useState<Director | null>(null)
  const { filters, setFilters } = useTableFilters('directors-list', {
    active: true,
  })
  const [debouncedFilters] = useDebounce(filters, 400)

  const { data, isPending, isFetching } = useGetDirectors({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    active: debouncedFilters.active as boolean | undefined,
    search: debouncedSearch,
  })
  const { mutate: deleteDirector, isPending: isDeleting } = useDeleteDirector()

  const directors = data?.data ?? []
  const pageCount = data?.pagination?.pages ?? 1

  const handleDelete = () => {
    if (!deleteTarget) return

    deleteDirector(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Director eliminado exitosamente')
        setDeleteTarget(null)
      },
    })
  }

  const resetPage = (newFilters: Record<string, unknown>) => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
    setFilters(newFilters)
  }

  const filterConfig: FilterConfig[] = [
    {
      type: 'boolean',
      name: 'active',
      label: 'Estado',
      trueLabel: 'Activo',
      falseLabel: 'Inactivo',
    },
  ]

  const rowActions: DataTableAction<Director>[] = [
    {
      label: 'Eliminar',
      icon: <Trash2 className="size-4" />,
      onClick: (row) => setDeleteTarget(row),
      variant: 'destructive',
    },
  ]

  return (
    <>
      <DataTable
        columns={directorColumns}
        data={directors}
        pageCount={pageCount}
        isLoading={isPending}
        isFetching={isFetching}
        search={search}
        onSearchChange={(value) => {
          setSearch(value)
          setPagination((prev) => ({ ...prev, pageIndex: 0 }))
        }}
        sorting={sorting}
        onSortingChange={setSorting}
        pagination={pagination}
        onPaginationChange={setPagination}
        searchPlaceholder="Buscar por nombre, correo o código..."
        emptyMessage="No hay directores que coincidan."
        rowActions={rowActions}
        toolbar={
          <DataTableFilters
            filters={filterConfig}
            values={filters}
            onChange={(newFilters) => resetPage(newFilters)}
          />
        }
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Eliminar director"
        description={
          deleteTarget ? (
            <>
              ¿Estás seguro de que deseas eliminar a <strong>{deleteTarget.user.name}</strong> como
              director del departamento <strong>{deleteTarget.department.name}</strong>?
              <br />
              Esta acción no se puede deshacer.
            </>
          ) : null
        }
        confirmLabel="Eliminar"
        pendingLabel="Eliminando..."
        isPending={isDeleting}
        confirmIcon={<Trash2 />}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </>
  )
}
