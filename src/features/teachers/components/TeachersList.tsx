import type { PaginationState, SortingState } from '@tanstack/react-table'
import { Eye } from 'lucide-react'
import { useState } from 'react'
import { useDebounce } from 'use-debounce'

import { DataTable, type DataTableAction } from '@/components/common/DataTable'
import { PeriodSelect } from '@/components/common/PeriodSelect'
import { useAuthStore } from '@/features/auth'
import { useAcademicPeriodsStore } from '@/features/periods'
import { useNavigate } from '@/hooks/useNavigate'
import { useGetTeachers } from '../api'
import type { TeacherRecord } from '../types'
import { teacherColumns } from './columns'

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

  const { data, isPending, isFetching } = useGetTeachers({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    academicPeriodId: selectedPeriodId,
    search: debouncedSearch,
  })

  const teachers = data?.data ?? []
  const pageCount = data?.pagination?.pages ?? 1

  const resetPage = () => setPagination((prev) => ({ ...prev, pageIndex: 0 }))

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
        <PeriodSelect
          value={selectedPeriodId}
          onValueChange={(id) => {
            setSelectedPeriodId(id)
            resetPage()
          }}
          searchParam="period"
        />
      }
    />
  )
}
