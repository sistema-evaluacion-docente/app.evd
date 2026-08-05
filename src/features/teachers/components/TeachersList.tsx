import type { PaginationState, SortingState } from '@tanstack/react-table'
import { Eye } from 'lucide-react'
import { useState } from 'react'
import { useDebounce, useDebouncedCallback } from 'use-debounce'

import { DataTable, type DataTableAction } from '@/components/common/DataTable'
import { DataTableFilters, type FilterConfig } from '@/components/common/DataTableFilters'
import { PeriodSelect } from '@/components/common/PeriodSelect'
import { useAuthStore } from '@/features/auth'
import { useAcademicPeriodsStore } from '@/features/periods'
import { useNavigate } from '@/hooks/useNavigate'
import { useTableFilters } from '@/hooks/useTableFilters'
import { useGetTeachers } from '../api'
import type { TeacherRecord } from '../types'
import { teacherColumns } from './columns'

const CONTRACT_TYPES = [
  { label: 'Tiempo completo', value: 'Tiempo completo' },
  { label: 'Medio tiempo', value: 'Medio tiempo' },
  { label: 'Hora cátedra', value: 'Hora cátedra' },
  { label: 'Planta', value: 'Planta' },
]

const SORT_FIELDS = [
  { value: 'name', label: 'Nombre' },
  { value: 'overall_average', label: 'Promedio' },
  { value: 'created_at', label: 'Fecha de creación' },
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
    fields: SORT_FIELDS,
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
  ]

  if (!departmentId) {
    return (
      <div className="text-muted-foreground py-10 text-center text-sm">
        Su usuario no está vinculado a un departamento. Contacte al administrador del sistema.
      </div>
    )
  }

  return (
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
  )
}
