import type { PaginationState, SortingState } from '@tanstack/react-table'
import { useState } from 'react'
import { useDebounce, useDebouncedCallback } from 'use-debounce'

import { DataTable } from '@/components/common/DataTable'
import { DataTableFilters, type FilterConfig } from '@/components/common/DataTableFilters'
import { useAuthStore } from '@/features/auth'
import { useTableFilters } from '@/hooks/useTableFilters'
import { useGetTeacherHistory } from '../api'
import type { HistorySortBy } from '../types'
import { columns } from './columns'

const SORT_FIELDS = [
  { value: 'period_code', label: 'Periodo' },
  { value: 'overall_average', label: 'Promedio' },
  { value: 'group_count', label: 'Grupos' },
]

const filterConfig: FilterConfig[] = [
  {
    type: 'sort',
    name: 'sortBy',
    fields: SORT_FIELDS,
  },
]

/**
 * Displays the list of evaluated periods of the authenticated teacher with
 * server-side search, sort, and pagination. Sorting is driven by the shared
 * `DataTableFilters` toolbar and persisted per table by `useTableFilters`.
 *
 * @example
 * <PeriodsList />
 */
export function PeriodsList() {
  const teacherId = useAuthStore((state) => state.user?.teacher_id)
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, 400)
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const { filters, setFilters } = useTableFilters('periods-list', {
    sortBy: 'period_code_desc',
  })
  const [debouncedFilters] = useDebounce(filters, 400)

  const { data, isPending, isFetching } = useGetTeacherHistory({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: debouncedSearch,
    sort_by: (debouncedFilters.sortBy as HistorySortBy) || undefined,
  })

  const periods = data?.data ?? []
  const pageCount = data?.pagination?.pages ?? 1

  const resetPage = useDebouncedCallback(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, 400)

  const handleFiltersChange = (newFilters: Record<string, unknown>) => {
    setFilters(newFilters)
    resetPage()
  }

  if (!teacherId) {
    return (
      <div className="text-muted-foreground py-10 text-center text-sm">
        Su usuario no está vinculado a un registro de docente. Contacte al administrador del
        sistema.
      </div>
    )
  }

  return (
    <DataTable
      columns={columns}
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
      searchPlaceholder="Buscar periodo..."
      emptyMessage="Aún no tiene evaluaciones registradas."
      toolbar={
        <DataTableFilters filters={filterConfig} values={filters} onChange={handleFiltersChange} />
      }
    />
  )
}
