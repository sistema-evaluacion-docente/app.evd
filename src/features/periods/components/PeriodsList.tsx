import type { PaginationState, SortingState } from '@tanstack/react-table'
import { Eye } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useDebounce } from 'use-debounce'

import { DataTable, type DataTableAction } from '@/components/common/DataTable'
import { DataTableFilters, type FilterConfig } from '@/components/common/DataTableFilters'
import { useAuthStore } from '@/features/auth'
import { useNavigate } from '@/hooks/useNavigate'
import { useTableFilters } from '@/hooks/useTableFilters'
import { useGetTeacherHistory } from '../api'
import type { HistorySortBy, TeacherPeriodHistory } from '../types'
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

/** La API tope 100 por página, y nadie acumula tantos periodos evaluados. */
const HISTORY_LIMIT = 100

const PAGE_SIZE = 10

/**
 * Displays the list of evaluated periods of the authenticated teacher.
 *
 * El orden lo resuelve la API; el buscador y la paginación, no. `search` en
 * `GET /teachers/{id}/history` es el filtro genérico de la lista de docentes
 * (viaja junto a `active`, `department_id` y `contract_type`), así que buscaba
 * por el docente — uno solo, siempre el mismo — y nunca por el periodo: escribir
 * "2024" no filtraba nada. El historial completo cabe en una página, de modo que
 * se pide entero y se filtra aquí por código y nombre del periodo.
 *
 * @example
 * <PeriodsList />
 */
export function PeriodsList() {
  const navigate = useNavigate()
  const teacherId = useAuthStore((state) => state.user?.teacher_id)
  const [search, setSearch] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  })
  const { filters, setFilters } = useTableFilters('periods-list', {
    sortBy: 'period_code_desc',
  })
  const [debouncedFilters] = useDebounce(filters, 400)

  const { data, isPending, isFetching } = useGetTeacherHistory({
    page: 1,
    limit: HISTORY_LIMIT,
    sort_by: (debouncedFilters.sortBy as HistorySortBy) || undefined,
  })

  const periods = useMemo(() => data?.data ?? [], [data])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (query.length === 0) return periods

    return periods.filter(
      (period) =>
        period.period_code.toLowerCase().includes(query) ||
        period.period_name?.toLowerCase().includes(query),
    )
  }, [periods, search])

  const page = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize

    return filtered.slice(start, start + pagination.pageSize)
  }, [filtered, pagination])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pagination.pageSize))

  /** Una lista más corta puede no llegar a la página que se estaba mirando. */
  const resetPage = () => setPagination((prev) => ({ ...prev, pageIndex: 0 }))

  const handleFiltersChange = (newFilters: Record<string, unknown>) => {
    setFilters(newFilters)
    resetPage()
  }

  const goToDetail = (period: TeacherPeriodHistory) => {
    navigate(`/periodos/${encodeURIComponent(period.period_code)}`)
  }

  const rowActions: DataTableAction<TeacherPeriodHistory>[] = [
    {
      label: 'Ver detalle',
      icon: <Eye className="size-4" />,
      onClick: goToDetail,
    },
  ]

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
      data={page}
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
      emptyMessage={
        periods.length === 0
          ? 'Aún no tiene evaluaciones registradas.'
          : 'No hay periodos que coincidan.'
      }
      onRowClick={goToDetail}
      rowActions={rowActions}
      toolbar={
        <DataTableFilters filters={filterConfig} values={filters} onChange={handleFiltersChange} />
      }
    />
  )
}
