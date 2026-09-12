import type { PaginationState, SortingState } from '@tanstack/react-table'
import { Pencil } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useDebounce, useDebouncedCallback } from 'use-debounce'

import { DataTable, type DataTableAction } from '@/components/common/DataTable'
import { DataTableFilters, type FilterConfig } from '@/components/common/DataTableFilters'
import { DynamicFormDrawer, type FieldConfig } from '@/components/common/DynamicFormDrawer'
import { useTableFilters } from '@/hooks/useTableFilters'
import { useGetUsers, useUpdateUser } from '../api'
import { ROLE_OPTIONS } from '../config'
import type { AdminUser } from '../types'
import { userColumns } from './columns'

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
 * Displays the paginated list of users with server-side search and an
 * active status filter, powered by the shared `DataTable`.
 *
 * @example
 * <UsersList />
 */
export function UsersList() {
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, 400)
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null)
  const { filters, setFilters } = useTableFilters('users-list', {
    active: true,
  })
  const [debouncedFilters] = useDebounce(filters, 400)

  const { data, isPending, isFetching } = useGetUsers({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    active: debouncedFilters.active as boolean | undefined,
    search: debouncedSearch,
  })
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser()

  const users = data?.data ?? []
  const pageCount = data?.pagination?.pages ?? 1

  // Solo roles y estado: son las dos únicas cosas que la API deja cambiar de
  // otro usuario. Un campo de nombre aquí se enviaría a ninguna parte.
  const editFields: FieldConfig[] = editTarget
    ? [
        {
          name: 'role',
          label: 'Roles',
          type: 'multiSelect',
          required: true,
          defaultValue: editTarget.roles,
          options: ROLE_OPTIONS,
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

    // La API direcciona a los usuarios por su `uid` de Firebase, que solo
    // existe cuando la persona ya ha entrado alguna vez. Sin él no hay a quién
    // dirigir la petición, y decirlo es mejor que mandarla y fallar.
    if (!editTarget.uid) {
      toast.error(
        'Este usuario aún no ha iniciado sesión, así que todavía no se le pueden cambiar los roles ni el estado',
      )
      return
    }

    updateUser(
      {
        uid: editTarget.uid,
        payload: {
          active: values.active === 'true',
          roles: values.role.split(',').filter(Boolean),
        },
      },
      {
        onSuccess: () => {
          toast.success('Usuario actualizado exitosamente')
          setEditTarget(null)
        },
      },
    )
  }

  const resetPage = useDebouncedCallback(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, 400)

  const handleFiltersChange = (newFilters: Record<string, unknown>) => {
    setFilters(newFilters)
    resetPage()
  }

  const rowActions: DataTableAction<AdminUser>[] = [
    {
      label: 'Editar',
      icon: <Pencil className="size-4" />,
      onClick: (row) => setEditTarget(row),
    },
  ]

  return (
    <>
      <DataTable
        columns={userColumns}
        data={users}
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
        searchPlaceholder="Buscar por nombre, correo o código..."
        emptyMessage="No hay usuarios que coincidan."
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
          title={`Editar usuario: ${editTarget.name}`}
          description="Reemplaza sus roles o cambia su estado"
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
    </>
  )
}
