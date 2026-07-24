import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { createColumnHelper } from '@tanstack/react-table'
import { ArrowDownIcon, ArrowUpIcon, CheckIcon, ChevronDownIcon, Funnel } from 'lucide-react'
import { useState } from 'react'

import DataTable from '@/components/common/DataTable'
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

const SORT_DIRECTIONS: { value: SortDirection; label: string; icon: typeof ArrowDownIcon }[] = [
  { value: 'desc', label: 'Desc', icon: ArrowDownIcon },
  { value: 'asc', label: 'Asc', icon: ArrowUpIcon },
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

function getSortFieldLabel(field: SortField): string {
  return SORT_FIELDS.find((f) => f.value === field)?.label ?? field
}

export function MyPeriodsContent() {
  const [sortBy, setSortBy] = useState<HistorySortBy>('period_code_desc')
  const [open, setOpen] = useState(false)

  const { field: currentField, direction: currentDirection } = parseSortBy(sortBy)
  const [pendingField, setPendingField] = useState<SortField>(currentField)
  const [pendingDirection, setPendingDirection] = useState<SortDirection>(currentDirection)

  const { queryFn, hasTeacherId } = useTeacherHistoryTable(sortBy)

  function handleOpen(nextOpen: boolean) {
    if (nextOpen) {
      setPendingField(currentField)
      setPendingDirection(currentDirection)
    }
    setOpen(nextOpen)
  }

  function handleApply() {
    setSortBy(buildSortBy(pendingField, pendingDirection))
    setOpen(false)
  }

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
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground text-xs font-semibold whitespace-nowrap uppercase">
        Ordenar por
      </span>

      <Popover open={open} onOpenChange={handleOpen}>
        <PopoverTrigger render={<Button variant="outline" className="h-9 gap-2" />}>
          <span className="text-sm font-medium">{getSortFieldLabel(currentField)}</span>
          <ChevronDownIcon className="text-muted-foreground size-4" />
        </PopoverTrigger>

        <PopoverContent className="w-56 p-0" sideOffset={4}>
          <div className="flex flex-col">
            <div className="flex flex-col p-1">
              {SORT_FIELDS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setPendingField(item.value)}
                  className={`hover:bg-muted flex cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 text-sm transition-colors ${pendingField === item.value ? 'text-primary font-medium' : 'text-foreground'}`}
                >
                  <span>{item.label}</span>

                  {pendingField === item.value && <CheckIcon className="text-primary size-4" />}
                </button>
              ))}
            </div>

            <div className="bg-border mx-2 h-px" />

            <div className="flex flex-col p-1">
              {SORT_DIRECTIONS.map((item) => {
                const Icon = item.icon

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setPendingDirection(item.value)}
                    className={`hover:bg-muted flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors ${pendingDirection === item.value ? 'text-primary font-medium' : 'text-foreground'}`}
                  >
                    <Icon className="size-4" />
                    <span>{item.label}</span>
                    {pendingDirection === item.value && (
                      <CheckIcon className="text-primary ml-auto size-4" />
                    )}
                  </button>
                )
              })}
            </div>

            <div className="bg-border mx-2 h-px" />

            <div className="flex justify-end p-2">
              <Button size="sm" variant="outline" onClick={handleApply}>
                <Funnel />
                Aplicar
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
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
