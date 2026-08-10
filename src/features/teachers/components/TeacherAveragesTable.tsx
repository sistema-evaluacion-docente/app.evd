import type { PaginationState, SortingState } from '@tanstack/react-table'
import { useState, type ReactNode } from 'react'
import { useDebounce, useDebouncedCallback } from 'use-debounce'

import { DataTable } from '@/components/common/DataTable'
import {
  DataTableFilters,
  type FilterConfig,
  type FilterOption,
  type SortField,
} from '@/components/common/DataTableFilters'
import { PeriodSelect } from '@/components/common/PeriodSelect'
import { useGetTeachers } from '../api'
import { CONTRACT_TYPES, TEACHER_SORT_FIELDS } from '../config'
import type { TeacherRecord } from '../types'
import { buildTeacherColumns } from './columns'

export interface TeacherAveragesTableProps {
  /**
   * Scopes results to one department. Omit (or pass `null`) to include
   * every department the caller is allowed to see — e.g. an admin-facing
   * overview — which also reveals a "Departamento" column.
   */
  departmentId?: number | null
  /** Preselects the period before the user picks one from the built-in selector. */
  defaultPeriodId?: number
  /**
   * Syncs the selected period with a URL query param (see `PeriodSelect`).
   * Leave unset when the widget can appear more than once on the same page.
   */
  periodSearchParam?: string
  /** Options offered by the "Tipo de contrato" filter. Defaults to the institution's standard set. */
  contractTypeOptions?: FilterOption[]
  /** Fields offered by the sort filter. Defaults to name/average/creation date. */
  sortFields?: SortField[]
  /** Initial sort applied to the list, in `{field}_{asc|desc}` form. Defaults to average score, descending. */
  defaultSortBy?: string
  /** Initial rows per page. Defaults to 10. */
  defaultPageSize?: number
  /**
   * Called when a row is clicked, with the currently selected period id (so
   * the caller can link to that teacher's detail for the same period). Omit
   * to render a non-interactive table — this component never navigates on
   * its own.
   */
  onTeacherClick?: (teacher: TeacherRecord, periodId: number | undefined) => void
  searchPlaceholder?: string
  emptyMessage?: string
  /** Optional heading rendered above the table. Omit to render just the table. */
  title?: ReactNode
  className?: string
}

/**
 * Paginated, filterable table of teachers with their average score for a
 * given academic period (`GET /teachers/with-averages`). Self-contained: it
 * owns its own period selector, search, filters and pagination state, so it
 * can be dropped into any page — a director's own department, an admin
 * overview across departments, or a dashboard widget — without extra wiring.
 *
 * @example
 * // Director scoped to their own department (the default `useGetTeachers` behavior).
 * <TeacherAveragesTable departmentId={department.id} title="Docentes de mi departamento" />
 *
 * @example
 * // Admin browsing every department, navigating on row click.
 * <TeacherAveragesTable
 *   title="Promedios por docente"
 *   onTeacherClick={(teacher, periodId) => {
 *     const period = periods.find((p) => p.id === periodId)
 *     navigate(`/docentes/${teacher.id}?period=${period?.name}`)
 *   }}
 * />
 */
export function TeacherAveragesTable({
  departmentId,
  defaultPeriodId,
  periodSearchParam,
  contractTypeOptions = CONTRACT_TYPES,
  sortFields = TEACHER_SORT_FIELDS,
  defaultSortBy = 'overall_average_desc',
  defaultPageSize = 10,
  onTeacherClick,
  searchPlaceholder = 'Buscar docente...',
  emptyMessage = 'No hay docentes con promedio en este periodo.',
  title,
  className,
}: TeacherAveragesTableProps) {
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | undefined>(defaultPeriodId)
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, 400)
  const [contractType, setContractType] = useState<string | undefined>(undefined)
  const [sortBy, setSortBy] = useState<string | undefined>(defaultSortBy)
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: defaultPageSize,
  })

  const resetPage = useDebouncedCallback(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, 400)

  const { data, isPending, isFetching } = useGetTeachers({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    academicPeriodId: selectedPeriodId,
    departmentId,
    search: debouncedSearch,
    contractType,
    sortBy,
  })

  const teachers = data?.data ?? []
  const pageCount = data?.pagination?.pages ?? 1
  const showDepartmentColumn = departmentId === undefined || departmentId === null
  const columns = buildTeacherColumns({ showDepartment: showDepartmentColumn })

  const filterConfig: FilterConfig[] = [
    {
      type: 'select',
      name: 'contractType',
      label: 'Tipo de contrato',
      options: contractTypeOptions,
      clearable: true,
    },
    {
      type: 'sort',
      name: 'sortBy',
      fields: sortFields,
    },
  ]

  const handleFiltersChange = (values: Record<string, unknown>) => {
    setContractType(values.contractType as string | undefined)
    setSortBy(values.sortBy as string | undefined)
    resetPage()
  }

  return (
    <section className={className}>
      {title && (
        <h2 className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
          {title}
        </h2>
      )}

      <DataTable
        columns={columns}
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
        onSortingChange={setSorting}
        pagination={pagination}
        onPaginationChange={setPagination}
        searchPlaceholder={searchPlaceholder}
        emptyMessage={emptyMessage}
        onRowClick={onTeacherClick && ((teacher) => onTeacherClick(teacher, selectedPeriodId))}
        toolbar={
          <div className="flex flex-wrap items-center gap-3">
            <PeriodSelect
              value={selectedPeriodId}
              defaultValue={defaultPeriodId}
              onValueChange={(id) => {
                setSelectedPeriodId(id)
                resetPage()
              }}
              searchParam={periodSearchParam}
            />
            <DataTableFilters
              filters={filterConfig}
              values={{ contractType, sortBy }}
              onChange={handleFiltersChange}
            />
          </div>
        }
      />
    </section>
  )
}
