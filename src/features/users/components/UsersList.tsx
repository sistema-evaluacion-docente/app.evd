import type { PaginationState, SortingState } from '@tanstack/react-table'
import { Building2, Pencil, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useDebounce, useDebouncedCallback } from 'use-debounce'
import { useSearchParams } from 'wouter'

import { DataTable, type DataTableAction } from '@/components/common/DataTable'
import { DataTableFilters, type FilterConfig } from '@/components/common/DataTableFilters'
import { DynamicFormDrawer, type FieldConfig } from '@/components/common/DynamicFormDrawer'
import { Button } from '@/components/ui/button'
import { useGetDepartments } from '@/features/departments'
import { useTableFilters } from '@/hooks/useTableFilters'
import { useGetUserById, useGetUsers, useUpdateUser } from '../api'
import { ROLE_OPTIONS } from '../config'
import { DEPARTMENT_FILTER_PARAM, parseDepartmentId } from '../config/usersOfDepartment'
import type { AdminUser, UpdateUserPayload } from '../types'
import { userColumns } from './columns'

/** Select value for "no department" — the select can't hold an empty value. */
const NO_DEPARTMENT = 'none'

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
 * Displays the paginated list of users with server-side search, an active
 * status filter and an optional `?departamento=` filter from the URL, powered
 * by the shared `DataTable`.
 *
 * @example
 * <UsersList />
 */
export function UsersList() {
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, 400)
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  // `editTarget` se conserva al cerrar para que el drawer no se vacíe mientras
  // anima su salida; `editOpen` es lo que realmente lo abre y lo cierra.
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const { filters, setFilters } = useTableFilters('users-list', {
    active: true,
  })
  const [debouncedFilters] = useDebounce(filters, 400)

  // El departamento viaja en la URL (`?departamento=7`) para que se pueda
  // llegar desde la tabla de departamentos y volver con "atrás".
  const [searchParams, setSearchParams] = useSearchParams()
  const departmentId = parseDepartmentId(searchParams.get(DEPARTMENT_FILTER_PARAM))

  const { data, isPending, isFetching } = useGetUsers({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    active: debouncedFilters.active as boolean | undefined,
    search: debouncedSearch,
    departmentId,
  })
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser()

  // La lista no trae el departamento; el detalle sí. El formulario espera a
  // tenerlo para abrir ya prellenado.
  const { data: detailData } = useGetUserById(editTarget?.id)
  const detail = detailData?.data?.id === editTarget?.id ? detailData?.data : undefined

  const { data: departmentsData } = useGetDepartments({ limit: 100, active: true })
  const departments = departmentsData?.data ?? []

  const users = data?.data ?? []
  const pageCount = data?.pagination?.pages ?? 1

  const filteredDepartmentName = departments.find(
    (department) => department.id === departmentId,
  )?.name

  const clearDepartment = () => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        next.delete(DEPARTMENT_FILTER_PARAM)
        return next
      },
      { replace: true },
    )
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }

  // The teacher record's own department, not `department_id`: for a director
  // that one is the department they direct. Prefilling with it hid a teacher
  // record left in another department, and since only changes are sent, it
  // could never be corrected from here.
  const initialDepartment =
    detail?.teacher_department_id != null ? String(detail.teacher_department_id) : NO_DEPARTMENT

  const editFields: FieldConfig[] = detail
    ? [
        {
          name: 'name',
          label: 'Nombre completo',
          required: true,
          defaultValue: detail.name,
        },
        {
          name: 'email',
          label: 'Correo institucional',
          type: 'email',
          required: true,
          defaultValue: detail.email,
        },
        {
          name: 'institutional_code',
          label: 'Código institucional',
          required: true,
          defaultValue: detail.institutional_code ?? '',
        },
        {
          name: 'roles',
          label: 'Roles',
          type: 'multiSelect',
          required: true,
          defaultValue: detail.roles,
          options: ROLE_OPTIONS,
        },
        {
          name: 'department_id',
          label: 'Departamento (como docente)',
          type: 'select',
          defaultValue: initialDepartment,
          options: [
            { label: 'Sin departamento', value: NO_DEPARTMENT },
            ...departments.map((department) => ({
              label: department.name,
              value: String(department.id),
            })),
          ],
        },
        {
          name: 'active',
          label: 'Activo',
          type: 'boolean',
          defaultValue: String(detail.active),
        },
      ]
    : []

  const handleUpdateSubmit = (values: Record<string, string>) => {
    if (!detail) return

    const roles = values.roles.split(',').filter(Boolean)
    const email = values.email.trim().toLowerCase()

    if (roles.length === 0) {
      toast.error('Debe seleccionar al menos un rol')
      return
    }

    if (!email.endsWith('@ufps.edu.co')) {
      toast.error('El correo debe terminar en @ufps.edu.co')
      return
    }

    const payload: UpdateUserPayload = {
      name: values.name.trim(),
      email,
      institutional_code: values.institutional_code.trim(),
      roles,
      active: values.active === 'true',
    }

    // Only sent when it changed from the teacher record's department, so saving
    // other fields never touches it.
    if (values.department_id !== initialDepartment) {
      if (!roles.includes('DOCENTE')) {
        toast.error('El departamento solo se puede asignar a usuarios con rol Docente')
        return
      }

      payload.department_id =
        values.department_id === NO_DEPARTMENT ? null : Number(values.department_id)
    }

    updateUser(
      { id: detail.id, payload },
      {
        onSuccess: () => {
          toast.success('Usuario actualizado exitosamente')
          setEditOpen(false)
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
      onClick: (row) => {
        setEditTarget(row)
        setEditOpen(true)
      },
    },
  ]

  return (
    <>
      {departmentId != null && (
        <div className="border-border bg-muted/30 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border px-4 py-3">
          <p className="flex items-center gap-2 text-sm">
            <Building2 className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
            Usuarios del departamento{' '}
            <span className="font-medium">{filteredDepartmentName ?? 'seleccionado'}</span>
          </p>

          <Button variant="outline" size="sm" onClick={clearDepartment}>
            <X className="size-4" aria-hidden="true" />
            Quitar filtro
          </Button>
        </div>
      )}

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

      {/* Siempre montado, como el de crear: así abre y cierra con la misma
          animación. Se abre cuando llega el detalle del usuario. */}
      <DynamicFormDrawer
        title={`Editar usuario: ${editTarget?.name ?? ''}`}
        description="Si cambias el correo, la persona deberá iniciar sesión con el correo nuevo."
        hideTrigger
        open={editOpen && detail != null}
        onOpenChange={setEditOpen}
        fields={editFields}
        onSubmit={handleUpdateSubmit}
        isSubmitting={isUpdating}
        submitLabel="Guardar"
        submitSubmittingLabel="Guardando..."
      />
    </>
  )
}
