import type { PaginationState, SortingState } from '@tanstack/react-table'
import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useDebounce, useDebouncedCallback } from 'use-debounce'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DataTable, type DataTableAction } from '@/components/common/DataTable'
import { DataTableFilters, type FilterConfig } from '@/components/common/DataTableFilters'
import { DynamicFormDrawer, type FieldConfig } from '@/components/common/DynamicFormDrawer'
import { useGetFaculties } from '@/features/faculties'
import { useTableFilters } from '@/hooks/useTableFilters'
import { useDeleteDepartment, useGetDepartments, useUpdateDepartment } from '../api'
import type { Department } from '../types'
import { departmentColumns } from './columns'

/**
 * Displays the paginated list of departments with server-side search and
 * filters (active status, faculty), powered by the shared `DataTable`.
 *
 * @example
 * <DepartmentsList />
 */
export function DepartmentsList() {
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, 400)
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const [editTarget, setEditTarget] = useState<Department | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null)
  const { filters, setFilters } = useTableFilters('departments-list', {
    active: true,
    facultyId: undefined as number | undefined,
  })
  const [debouncedFilters] = useDebounce(filters, 400)

  // Fetch faculties for the filter dropdown
  const { data: facultiesData } = useGetFaculties({ limit: 100 })
  const faculties = facultiesData?.data ?? []

  const { data, isPending, isFetching } = useGetDepartments({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    active: debouncedFilters.active as boolean | undefined,
    facultyId: debouncedFilters.facultyId as number | undefined,
    search: debouncedSearch,
  })
  const { mutate: updateDepartment, isPending: isUpdating } = useUpdateDepartment()
  const { mutate: deleteDepartment, isPending: isDeleting } = useDeleteDepartment()

  const editFields: FieldConfig[] = editTarget
    ? [
        {
          name: 'name',
          label: 'Nombre del departamento',
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
          name: 'faculty_id',
          label: 'Facultad',
          type: 'select',
          required: true,
          defaultValue: String(editTarget.faculty_id),
          options: faculties.map((f) => ({ label: f.name, value: String(f.id) })),
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

    updateDepartment(
      {
        departmentId: editTarget.id,
        payload: {
          name: values.name,
          code: values.code,
          faculty_id: Number(values.faculty_id),
          active: values.active === 'true',
        },
      },
      {
        onSuccess: () => {
          toast.success('Departamento actualizado exitosamente')
          setEditTarget(null)
        },
      },
    )
  }

  const handleDelete = () => {
    if (!deleteTarget) return

    deleteDepartment(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Departamento eliminado exitosamente')
        setDeleteTarget(null)
      },
    })
  }

  const departments = data?.data ?? []
  const pageCount = data?.pagination?.pages ?? 1

  const resetPage = useDebouncedCallback(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, 400)

  const handleFiltersChange = (newFilters: Record<string, unknown>) => {
    setFilters(newFilters)
    resetPage()
  }

  const rowActions: DataTableAction<Department>[] = [
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

  const filterConfig: FilterConfig[] = [
    {
      type: 'boolean',
      name: 'active',
      label: 'Activo',
      trueLabel: 'Sí',
      falseLabel: 'No',
    },
    {
      type: 'select',
      name: 'facultyId',
      label: 'Facultad',
      options: faculties.map((f) => ({ label: f.name, value: f.id })),
      clearable: true,
    },
  ]

  return (
    <>
      <DataTable
        columns={departmentColumns}
        data={departments}
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
        emptyMessage="No hay departamentos que coincidan."
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
          title={`Editar departamento: ${editTarget.name}`}
          description="Actualiza los datos del departamento"
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
        title="Eliminar departamento"
        description={
          deleteTarget ? (
            <>
              ¿Estás seguro de que deseas eliminar el departamento{' '}
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
