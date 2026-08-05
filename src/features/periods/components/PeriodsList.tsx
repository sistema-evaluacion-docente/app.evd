import type { PaginationState, SortingState } from '@tanstack/react-table'
import { useState } from 'react'
import { useDebounce } from 'use-debounce'

import { DataTable } from '@/components/common/DataTable'
import { useAuthStore } from '@/features/auth'
import { useGetTeacherHistory } from '../api'
import type { HistorySortBy } from '../types'
import { columns } from './columns'

/**
 * Displays the list of evaluated periods of the authenticated teacher with
 * server-side search, sort, and pagination.
 *
 * @example
 * <PeriodsList />
 */
export function PeriodsList() {
  const teacherId = useAuthStore((state) => state.user?.teacher_id)
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, 400)
  const [sorting, setSorting] = useState<SortingState>([{ id: 'period_code', desc: true }])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })

  const sortBy: HistorySortBy | undefined = sorting[0]
    ? (`${sorting[0].id}_${sorting[0].desc ? 'desc' : 'asc'}` as HistorySortBy)
    : undefined

  const { data, isPending, isFetching } = useGetTeacherHistory({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: debouncedSearch,
    sort_by: sortBy,
  })

  const periods = data?.data ?? []
  const pageCount = data?.pagination?.pages ?? 1

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
        setPagination((prev) => ({ ...prev, pageIndex: 0 }))
      }}
      sorting={sorting}
      onSortingChange={setSorting}
      pagination={pagination}
      onPaginationChange={setPagination}
      searchPlaceholder="Buscar periodo..."
      emptyMessage="Aún no tiene evaluaciones registradas."
    />
  )
}
