import type { PaginationState, SortingState } from '@tanstack/react-table'
import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useDebounce, useDebouncedCallback } from 'use-debounce'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DataTable, type DataTableAction } from '@/components/common/DataTable'
import { DataTableFilters, type FilterConfig } from '@/components/common/DataTableFilters'
import { DynamicFormDrawer, type FieldConfig } from '@/components/common/DynamicFormDrawer'
import { useTableFilters } from '@/hooks/useTableFilters'
import {
  useDeleteAcademicPeriod,
  useGetAcademicPeriodsAdmin,
  useUpdateAcademicPeriod,
} from '../../api'
import type { AcademicPeriod } from '../../types'
import { periodAdminColumns } from './columns'

const filterConfig: FilterConfig[] = [
  {
    type: 'boolean',
    name: 'active',
    label: 'Activo',
    trueLabel: 'Sí',
    falseLabel: 'No',
  },
]

/**
 * Displays the paginated list of academic periods with server-side search and
 * active status filter, powered by the shared `DataTable`.
 *
 * @example
 * <PeriodsList />
 */
export function PeriodsList() {
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, 400)
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const [editTarget, setEditTarget] = useState<AcademicPeriod | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AcademicPeriod | null>(null)
  const { filters, setFilters } = useTableFilters('admin-periods-list', {
    active: true,
  })
  const [debouncedFilters] = useDebounce(filters, 400)

  const { data, isPending, isFetching } = useGetAcademicPeriodsAdmin({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    active: debouncedFilters.active as boolean | undefined,
    search: debouncedSearch,
  })
  const { mutate: updatePeriod, isPending: isUpdating } = useUpdateAcademicPeriod()
  const { mutate: deletePeriod, isPending: isDeleting } = useDeleteAcademicPeriod()

  const editFields: FieldConfig[] = editTarget
    ? [
        {
          name: 'name',
          label: 'Nombre del periodo',
          required: true,
          defaultValue: editTarget.name,
        },
        {
          name: 'code',
          label: 'Código',
          required: true,
          defaultValue: editTarget.code,
        },
        {
          name: 'start_date',
          label: 'Fecha de inicio',
          required: true,
          placeholder: 'YYYY-MM-DD',
          defaultValue: editTarget.start_date ?? '',
        },
        {
          name: 'end_date',
          label: 'Fecha de fin',
          required: true,
          placeholder: 'YYYY-MM-DD',
          defaultValue: editTarget.end_date ?? '',
        },
        {
          name: 'active',
          label: 'Activo',
          type: 'boolean',
          defaultValue: String(editTarget.active),
        },
      ]
    : []

  const handleUpdateSubmit = (values: Record<string, string>) => {
    if (!editTarget) return

    updatePeriod(
      {
        periodId: editTarget.id,
        payload: {
          name: values.name,
          code: values.code,
          start_date: values.start_date,
          end_date: values.end_date,
          active: values.active === 'true',
        },
      },
      {
        onSuccess: () => {
          toast.success('Periodo académico actualizado exitosamente')
          setEditTarget(null)
        },
      },
    )
  }

  const handleDelete = () => {
    if (!deleteTarget) return

    deletePeriod(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Periodo académico eliminado exitosamente')
        setDeleteTarget(null)
      },
    })
  }

  const periods = data?.data ?? []
  const pageCount = data?.pagination?.pages ?? 1

  const resetPage = useDebouncedCallback(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, 400)

  const handleFiltersChange = (newFilters: Record<string, unknown>) => {
    setFilters(newFilters)
    resetPage()
  }

  const rowActions: DataTableAction<AcademicPeriod>[] = [
    {
      label: 'Editar',
      icon: <Pencil className="size-4" />,
      onClick: (row) => setEditTarget(row),
    },
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
        columns={periodAdminColumns}
        data={periods}
        pageCount={pageCount}
        isLoading={isPending}
        isFetching={isFetching}
        search={search}
        onSearchChange={(value) => {
          setSearch(value)
          resetPage()
        }}
        sorting={sorting}
        onSortingChange={setSorting}
        pagination={pagination}
        onPaginationChange={setPagination}
        searchPlaceholder="Buscar por nombre o código..."
        emptyMessage="No hay periodos académicos que coincidan."
        rowActions={rowActions}
        toolbar={
          <DataTableFilters
            filters={filterConfig}
            values={filters}
            onChange={handleFiltersChange}
          />
        }
      />

      {editTarget && (
        <DynamicFormDrawer
          key={editTarget.id}
          title={`Editar periodo: ${editTarget.name}`}
          description="Actualiza los datos del periodo académico"
          hideTrigger
          open
          onOpenChange={(open) => {
            if (!open) setEditTarget(null)
          }}
          fields={editFields}
          onSubmit={handleUpdateSubmit}
          isSubmitting={isUpdating}
          submitLabel="Guardar"
          submitSubmittingLabel="Guardando..."
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Eliminar periodo académico"
        description={
          deleteTarget ? (
            <>
              ¿Estás seguro de que deseas eliminar el periodo académico{' '}
              <strong>{deleteTarget.name}</strong>?
              <br />
              Esta acción no se puede deshacer y se eliminarán todos los datos asociados.
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
