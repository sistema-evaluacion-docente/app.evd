import type { PaginationState, SortingState } from '@tanstack/react-table'
import { Eye, Pencil } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useDebounce, useDebouncedCallback } from 'use-debounce'

import { DataTable, type DataTableAction } from '@/components/common/DataTable'
import { DataTableFilters, type FilterConfig } from '@/components/common/DataTableFilters'
import { DynamicFormDrawer, type FieldConfig } from '@/components/common/DynamicFormDrawer'
import { PeriodSelect } from '@/components/common/PeriodSelect'
import { useAuthStore } from '@/features/auth'
import { useAcademicPeriodsStore } from '@/features/periods'
import { useNavigate } from '@/hooks/useNavigate'
import { useTableFilters } from '@/hooks/useTableFilters'
import { useGetTeachers, useUpdateTeacher } from '../api'
import { CONTRACT_TYPES, TEACHER_SORT_FIELDS } from '../config'
import type { TeacherRecord } from '../types'
import { teacherColumns } from './columns'

const filterConfig: FilterConfig[] = [
  {
    type: 'boolean',
    name: 'active',
    label: 'Activo',
    trueLabel: 'Sí',
    falseLabel: 'No',
  },
  {
    type: 'boolean',
    name: 'hasAverage',
    label: 'Con promedio',
    trueLabel: 'Sí',
    falseLabel: 'No',
  },
  {
    type: 'select',
    name: 'contractType',
    label: 'Tipo de contrato',
    // TODO: define contract typrs
    options: CONTRACT_TYPES,
    clearable: true,
  },
  {
    type: 'sort',
    name: 'sortBy',
    fields: TEACHER_SORT_FIELDS,
  },
]

/**
 * Displays the paginated list of teachers with their averages of the
 * authenticated director's department, for a selected academic period, with
 * server-side search and pagination.
 *
 * @example
 * <TeachersList />
 */
export function TeachersList() {
  const navigate = useNavigate()

  const departmentId = useAuthStore((state) => state.user?.department_id)

  const [selectedPeriodId, setSelectedPeriodId] = useState<number | undefined>(undefined)
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, 400)
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const [editTarget, setEditTarget] = useState<TeacherRecord | null>(null)
  // const [editDepartmentOpen, se
  // tEditDepartmentOpen] = useState(false)
  const { filters, setFilters } = useTableFilters('teachers', {
    active: true,
    hasAverage: true,
    contractType: undefined as string | undefined,
    sortBy: 'name_desc',
  })
  const [debouncedFilters] = useDebounce(filters, 400)

  const { data, isPending, isFetching } = useGetTeachers({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    academicPeriodId: selectedPeriodId,
    search: debouncedSearch,
    active: debouncedFilters.active as boolean | undefined,
    hasAverage: debouncedFilters.hasAverage as boolean | undefined,
    contractType: debouncedFilters.contractType as string | undefined,
    sortBy: debouncedFilters.sortBy as string | undefined,
  })
  const { mutate: updateTeacher, isPending: isUpdating } = useUpdateTeacher()

  // Fetch department data for editing
  // const { data: departmentData } = useGetDepartments({
  //   limit: 1,
  //   search: '',
  // })
  // const currentDepartment = departmentData?.data?.[0]

  // Fetch faculties for the department dropdown
  // const { data: facultiesData } = useGetFaculties({ limit: 100 })
  // const faculties = facultiesData?.data ?? []

  // const { mutate: updateDepartment, isPending: isUpdatingDepartment } = useUpdateDepartment()

  const editFields: FieldConfig[] = editTarget
    ? [
        {
          name: 'name',
          label: 'Nombre completo',
          required: true,
          defaultValue: editTarget.user.name,
        },
        {
          name: 'email',
          label: 'Correo institucional',
          type: 'email',
          required: true,
          defaultValue: editTarget.user.email,
        },
        {
          name: 'institutional_code',
          label: 'Código institucional',
          required: true,
          defaultValue: editTarget.institutional_code,
        },
        {
          name: 'contract_type',
          label: 'Tipo de contrato',
          type: 'select',
          required: true,
          defaultValue: editTarget.contract_type,
          options: CONTRACT_TYPES,
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

    updateTeacher(
      {
        teacherId: editTarget.id,
        payload: {
          name: values.name,
          email: values.email,
          avatar_url: values.avatar_url,
          institutional_code: values.institutional_code,
          department_id: editTarget.department_id,
          contract_type: values.contract_type,
          user_id: editTarget.user_id,
          active: values.active === 'true',
        },
      },
      {
        onSuccess: () => {
          toast.success('Docente actualizado exitosamente')
          setEditTarget(null)
        },
        onError: (error) => {
          toast.error(error.message || 'Error al actualizar el docente')
        },
      },
    )
  }

  // const departmentFields: FieldConfig[] = currentDepartment
  //   ? [
  //       {
  //         name: 'name',
  //         label: 'Nombre del departamento',
  //         required: true,
  //         defaultValue: currentDepartment.name,
  //       },
  //       {
  //         name: 'code',
  //         label: 'Código',
  //         required: true,
  //         defaultValue: currentDepartment.code,
  //       },
  //       {
  //         name: 'faculty_id',
  //         label: 'Facultad',
  //         type: 'select',
  //         required: true,
  //         defaultValue: String(currentDepartment.faculty_id),
  //         options: faculties.map((f) => ({ label: f.name, value: String(f.id) })),
  //       },
  //       {
  //         name: 'active',
  //         label: 'Activo',
  //         type: 'boolean',
  //         defaultValue: String(currentDepartment.active),
  //       },
  //     ]
  //   : []

  // const handleDepartmentUpdateSubmit = (values: Record<string, string>) => {
  //   if (!currentDepartment) return

  //   updateDepartment(
  //     {
  //       departmentId: currentDepartment.id,
  //       payload: {
  //         name: values.name,
  //         code: values.code,
  //         faculty_id: Number(values.faculty_id),
  //         active: values.active === 'true',
  //       },
  //     },
  //     {
  //       onSuccess: () => {
  //         toast.success('Departamento actualizado exitosamente')
  //         setEditDepartmentOpen(false)
  //       },
  //       onError: (error) => {
  //         toast.error(error.message || 'Error al actualizar el departamento')
  //       },
  //     },
  //   )
  // }

  const teachers = data?.data ?? []
  const pageCount = data?.pagination?.pages ?? 1

  const resetPage = useDebouncedCallback(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, 400)

  const handleFiltersChange = (newFilters: Record<string, unknown>) => {
    setFilters(newFilters)
    resetPage()
  }

  const periodsStore = useAcademicPeriodsStore()

  const rowActions: DataTableAction<TeacherRecord>[] = [
    {
      label: 'Ver detalle',
      icon: <Eye className="size-4" />,
      onClick: (row) => {
        const period = periodsStore.periods.find((p) => p.id === selectedPeriodId)
        navigate(`/docentes/${row.id}?period=${period?.name}`)
      },
    },
    {
      label: 'Editar docente',
      icon: <Pencil className="size-4" />,
      onClick: (row) => setEditTarget(row),
    },
  ]

  if (!departmentId) {
    return (
      <div className="text-muted-foreground py-10 text-center text-sm">
        Su usuario no está vinculado a un departamento. Contacte al administrador del sistema.
      </div>
    )
  }

  return (
    <>
      <DataTable
        columns={teacherColumns}
        data={teachers}
        pageCount={pageCount}
        isLoading={isPending}
        isFetching={isFetching}
        search={search}
        onSearchChange={(value) => {
          setSearch(value)
          resetPage()
        }}
        sorting={sorting}
        onRowClick={(row) => {
          const period = periodsStore.periods.find((p) => p.id === selectedPeriodId)
          navigate(`/docentes/${row.id}?period=${period?.name}`)
        }}
        onSortingChange={setSorting}
        pagination={pagination}
        onPaginationChange={setPagination}
        searchPlaceholder="Buscar docente..."
        emptyMessage="No hay docentes registrados en su departamento."
        rowActions={rowActions}
        toolbar={
          <div className="flex flex-wrap items-center gap-3">
            <PeriodSelect
              value={selectedPeriodId}
              onValueChange={(id) => {
                setSelectedPeriodId(id)
                resetPage()
              }}
              searchParam="period"
            />
            <DataTableFilters
              filters={filterConfig}
              values={filters}
              onChange={handleFiltersChange}
            />
          </div>
        }
      />

      {editTarget && (
        <DynamicFormDrawer
          key={editTarget.id}
          title={`Editar docente: ${editTarget.user.name}`}
          description="Actualiza los datos del docente"
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

      {/* {currentDepartment && (
        <DynamicFormDrawer
          key={`dept-${currentDepartment.id}`}
          title={`Editar departamento: ${currentDepartment.name}`}
          description="Actualiza los datos del departamento"
          hideTrigger
          open={editDepartmentOpen}
          onOpenChange={setEditDepartmentOpen}
          fields={departmentFields}
          onSubmit={handleDepartmentUpdateSubmit}
          isSubmitting={isUpdatingDepartment}
          submitLabel="Guardar"
          submitSubmittingLabel="Guardando..."
        />
      )} */}
    </>
  )
}
