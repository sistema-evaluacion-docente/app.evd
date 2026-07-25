import { createColumnHelper } from '@tanstack/react-table'
import { useState } from 'react'

import DataTable from '@/components/common/DataTable'
import SortBy from '@/components/common/SortBy'
import type { HistorySortBy } from '@/features/teachers/api/getTeacherHistory'
import type { TeacherHistoryEntry } from '@/features/teachers/types/Teacher'
import { PageHeader } from '@/shared/ui'
import useTeacherHistoryTable from '../hooks/useTeacherHistoryTable'

const col = createColumnHelper<TeacherHistoryEntry>()

const columns = [
  col.accessor('period_name', {
    header: 'Periodo',
    cell: (info) => {
      const entry = info.row.original
      return (
        <span className="text-foreground text-[15px] font-semibold">
          {entry.period_name || entry.period_code}
        </span>
      )
    },
  }),
  col.accessor('period_code', {
    header: 'Código',
    cell: (info) => <span className="text-muted-foreground text-sm">{info.getValue()}</span>,
  }),
  col.accessor('overall_average', {
    header: 'Promedio',
    cell: (info) => (
      <span className="num text-foreground text-[15px] font-semibold tabular-nums">
        {info.getValue().toFixed(1)}
        <span className="text-muted-foreground text-sm font-medium"> /5.0</span>
      </span>
    ),
  }),
  col.accessor('group_count', {
    header: 'Grupos',
    cell: (info) => (
      <span className="num text-muted-foreground text-sm tabular-nums">{info.getValue()}</span>
    ),
  }),
]

type SortField = 'period_code' | 'overall_average' | 'group_count'
type SortDirection = 'asc' | 'desc'

const SORT_FIELDS: { value: SortField; label: string }[] = [
  { value: 'period_code', label: 'Periodo' },
  { value: 'overall_average', label: 'Promedio' },
  { value: 'group_count', label: 'Grupos' },
]

function parseSortBy(value: HistorySortBy): { field: SortField; direction: SortDirection } {
  const parts = value.split('_')
  const direction = parts.pop() as SortDirection
  const field = parts.join('_') as SortField
  return { field, direction }
}

function buildSortBy(field: SortField, direction: SortDirection): HistorySortBy {
  return `${field}_${direction}` as HistorySortBy
}

export function MyPeriodsContent() {
  const [sortBy, setSortBy] = useState<HistorySortBy>('period_code_desc')

  const { queryFn, hasTeacherId } = useTeacherHistoryTable(sortBy)

  if (!hasTeacherId) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          underline
          title="Mis Periodos"
          description="Historial de evaluaciones por periodo académico."
        />

        <div className="text-muted-foreground py-10 text-center text-sm">
          Su usuario no está vinculado a un registro de docente. Contacte al administrador del
          sistema.
        </div>
      </div>
    )
  }

  const filters = (
    <SortBy
      fields={SORT_FIELDS}
      value={sortBy}
      onChange={(value) => setSortBy(value as HistorySortBy)}
      parse={parseSortBy as (v: string) => { field: string; direction: string }}
      build={(field, direction) => buildSortBy(field as SortField, direction as SortDirection)}
    />
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        underline
        title="Mis Periodos"
        description="Tu historial de evaluaciones por periodo académico."
      />

      <DataTable<TeacherHistoryEntry>
        columns={columns}
        queryFn={queryFn}
        emptyMessage="Aún no tiene evaluaciones registradas."
        enableSearch={true}
        filters={filters}
        disabledPagination
        searchPlaceholder="Buscar periodo, código o promedio..."
        enableFilters={true}
        minWidthClassName="min-w-0"
      />
    </div>
  )
}

export default MyPeriodsContent
