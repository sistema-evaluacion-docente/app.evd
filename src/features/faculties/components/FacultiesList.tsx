import type { PaginationState, SortingState } from '@tanstack/react-table'
import { Pencil, Trash2, UserMinus, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useDebounce, useDebouncedCallback } from 'use-debounce'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DataTable, type DataTableAction } from '@/components/common/DataTable'
import { DataTableFilters, type FilterConfig } from '@/components/common/DataTableFilters'
import { DynamicFormDrawer, type FieldConfig } from '@/components/common/DynamicFormDrawer'
import { useTableFilters } from '@/hooks/useTableFilters'
import { useDeleteFaculty, useGetFaculties, useUnassignDean, useUpdateFaculty } from '../api'
import type { Faculty } from '../types'
import { AssignDeanDrawer } from './AssignDeanDrawer'
import { facultyColumns } from './columns'

interface FacultiesListProps {
  /** Whether to offer create/edit/delete/assign-dean actions. Read-only when false. */
  canManage?: boolean
}

const filterConfig: FilterConfig[] = [
  {
    type: 'boolean',
    name: 'active',
    label: 'Activa',
    trueLabel: 'Sí',
    falseLabel: 'No',
  },
]

/**
 * Displays the paginated list of faculties with server-side search and
 * active status filter, powered by the shared `DataTable`.
 *
 * @example
 * <FacultiesList />
 */
export function FacultiesList({ canManage = true }: FacultiesListProps = {}) {
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, 400)
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const [editTarget, setEditTarget] = useState<Faculty | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Faculty | null>(null)
  const [assignTarget, setAssignTarget] = useState<Faculty | null>(null)
  const [unassignTarget, setUnassignTarget] = useState<Faculty | null>(null)
  const { filters, setFilters } = useTableFilters('faculties-list', {
    active: true,
  })
  const [debouncedFilters] = useDebounce(filters, 400)

  const { data, isPending, isFetching } = useGetFaculties({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    active: debouncedFilters.active as boolean | undefined,
    search: debouncedSearch,
  })
  const { mutate: updateFaculty, isPending: isUpdating } = useUpdateFaculty()
  const { mutate: deleteFaculty, isPending: isDeleting } = useDeleteFaculty()
  const { mutate: unassignDean, isPending: isUnassigning } = useUnassignDean()

  const editFields: FieldConfig[] = editTarget
    ? [
        {
          name: 'name',
          label: 'Nombre de la facultad',
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
          name: 'active',
          label: 'Activa',
          type: 'boolean',
          defaultValue: String(editTarget.active),
        },
      ]
    : []

  const handleUpdateSubmit = (values: Record<string, string>) => {
    if (!editTarget) return

    updateFaculty(
      {
        facultyId: editTarget.id,
        payload: {
          name: values.name,
          code: values.code,
          active: values.active === 'true',
        },
      },
      {
        onSuccess: () => {
          toast.success('Facultad actualizada exitosamente')
          setEditTarget(null)
        },
      },
    )
  }

  const handleDelete = () => {
    if (!deleteTarget) return

    deleteFaculty(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Facultad eliminada exitosamente')
        setDeleteTarget(null)
      },
    })
  }

  const handleUnassign = () => {
    if (!unassignTarget) return

    unassignDean(unassignTarget.id, {
      onSuccess: () => {
        toast.success('Decano desasignado exitosamente')
        setUnassignTarget(null)
      },
    })
  }

  const faculties = data?.data ?? []
  const pageCount = data?.pagination?.pages ?? 1

  const resetPage = useDebouncedCallback(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, 400)

  const handleFiltersChange = (newFilters: Record<string, unknown>) => {
    setFilters(newFilters)
    resetPage()
  }

  const rowActions: DataTableAction<Faculty>[] = canManage
    ? [
        {
          label: 'Asignar decano',
          icon: <UserPlus className="size-4" />,
          onClick: (row) => setAssignTarget(row),
          visible: (row) => !row.dean,
        },
        {
          label: 'Desasignar decano',
          icon: <UserMinus className="size-4" />,
          onClick: (row) => setUnassignTarget(row),
          variant: 'destructive',
          visible: (row) => !!row.dean,
        },
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
    : []

  return (
    <>
      <DataTable
        columns={facultyColumns}
        data={faculties}
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
        emptyMessage="No hay facultades que coincidan."
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
          title={`Editar facultad: ${editTarget.name}`}
          description="Actualiza los datos de la facultad"
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
        title="Eliminar facultad"
        description={
          deleteTarget ? (
            <>
              ¿Estás seguro de que deseas eliminar la facultad <strong>{deleteTarget.name}</strong>?
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

      {assignTarget && (
        <AssignDeanDrawer
          faculty={assignTarget}
          open
          onOpenChange={(open) => {
            if (!open) setAssignTarget(null)
          }}
        />
      )}

      <ConfirmDialog
        open={unassignTarget !== null}
        title="Desasignar decano"
        description={
          unassignTarget ? (
            <>
              ¿Estás seguro de que deseas desasignar a <strong>{unassignTarget.dean?.name}</strong>{' '}
              como decano de la facultad <strong>{unassignTarget.name}</strong>?
            </>
          ) : null
        }
        confirmLabel="Desasignar"
        pendingLabel="Desasignando..."
        isPending={isUnassigning}
        confirmIcon={<UserMinus />}
        onOpenChange={(open) => !open && setUnassignTarget(null)}
        onConfirm={handleUnassign}
      />
    </>
  )
}
