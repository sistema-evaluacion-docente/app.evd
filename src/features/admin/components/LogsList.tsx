import type { PaginationState, SortingState } from '@tanstack/react-table'
import dayjs from 'dayjs'
import { Eye } from 'lucide-react'
import { useState } from 'react'
import { useDebounce, useDebouncedCallback } from 'use-debounce'

import { DataTable, type DataTableAction } from '@/components/common/DataTable'
import {
  DataTableFilters,
  type DateRange,
  type FilterConfig,
} from '@/components/common/DataTableFilters'
import { useTableFilters } from '@/hooks/useTableFilters'
import { useGetAuditLogs } from '../api'
import { OPERATION_OPTIONS, TABLE_NAMES } from '../config'
import type { AuditLog } from '../types'
import { AuditLogDetailDrawer } from './AuditLogDetailDrawer'
import { auditLogColumns } from './columns'

const filterConfig: FilterConfig[] = [
  {
    type: 'select',
    name: 'entityName',
    label: 'Entidad',
    options: TABLE_NAMES,
    clearable: true,
  },
  {
    type: 'select',
    name: 'operation',
    label: 'Operación',
    options: OPERATION_OPTIONS,
    clearable: true,
  },
  {
    type: 'dateRange',
    name: 'dateRange',
    label: 'Rango de fechas',
  },
]

/**
 * Displays the paginated list of audit logs with server-side search and
 * filters (entity, operation, date range), powered by the shared `DataTable`.
 *
 * @example
 * <LogsList />
 */
export function LogsList() {
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, 400)
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const [detailAuditId, setDetailAuditId] = useState<number | null>(null)
  const { filters, setFilters } = useTableFilters('admin-logs', {
    entityName: undefined as string | undefined,
    operation: undefined as string | undefined,
    dateRange: undefined as DateRange | undefined,
  })
  const [debouncedFilters] = useDebounce(filters, 400)

  const dateRange = debouncedFilters.dateRange as DateRange | undefined

  const { data, isPending, isFetching } = useGetAuditLogs({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    entityName: debouncedFilters.entityName as string | undefined,
    operation: debouncedFilters.operation as string | undefined,
    dateFrom: dateRange?.from ? dayjs(dateRange.from).format('YYYY-MM-DD') : undefined,
    dateTo: dateRange?.to ? dayjs(dateRange.to).format('YYYY-MM-DD') : undefined,
    search: debouncedSearch,
  })

  const logs = data?.data ?? []
  const pageCount = data?.pagination?.pages ?? 1

  const resetPage = useDebouncedCallback(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, 400)

  const handleFiltersChange = (newFilters: Record<string, unknown>) => {
    setFilters(newFilters)
    resetPage()
  }

  const rowActions: DataTableAction<AuditLog>[] = [
    {
      label: 'Ver detalle',
      icon: <Eye className="size-4" />,
      onClick: (row) => setDetailAuditId(row.id),
    },
  ]

  return (
    <>
      <DataTable
        columns={auditLogColumns}
        data={logs}
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
        searchPlaceholder="Buscar por elemento o descripción..."
        emptyMessage="No hay registros de auditoría que coincidan."
        rowActions={rowActions}
        toolbar={
          <DataTableFilters
            filters={filterConfig}
            values={filters}
            onChange={handleFiltersChange}
          />
        }
      />

      <AuditLogDetailDrawer
        auditId={detailAuditId}
        open={detailAuditId !== null}
        onOpenChange={(open) => {
          if (!open) setDetailAuditId(null)
        }}
      />
    </>
  )
}
