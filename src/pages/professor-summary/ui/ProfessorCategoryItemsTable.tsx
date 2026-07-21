import { ArrowDown, ArrowUp, Minus } from 'lucide-react'

import { DataTable, type DataTableColumn } from '@/shared/ui'

import { professorScoreTone, type CategoryItemHistory } from '../model/data'

export interface ProfessorCategoryItemsTableProps {
  items: CategoryItemHistory[]
  /** Visible periods, oldest → newest — one column each. */
  periods: { code: string; name: string }[]
}

/** Change between the two most recent semesters an item was evaluated in. */
function TrendCell({ item }: { item: CategoryItemHistory }) {
  const scores = item.byPeriod
  if (scores.length < 2) {
    return <span className="text-[13px] text-ink-400">—</span>
  }

  const delta = scores[scores.length - 1].mine - scores[scores.length - 2].mine
  const isUp = delta > 0.005
  const isDown = delta < -0.005
  const Icon = isUp ? ArrowUp : isDown ? ArrowDown : Minus
  const tone = isUp
    ? 'bg-emerald-50 text-emerald-700'
    : isDown
      ? 'bg-red-50 text-red-700'
      : 'bg-ink-100 text-ink-500'

  return (
    <span
      className={`num inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[12px] font-semibold tabular-nums ${tone}`}
    >
      <Icon size={12} />
      {delta >= 0 ? '+' : ''}
      {delta.toFixed(2)}
    </span>
  )
}

/** Item-by-item evolution across semesters for a single category. */
export function ProfessorCategoryItemsTable({
  items,
  periods,
}: ProfessorCategoryItemsTableProps) {
  const columns: DataTableColumn<CategoryItemHistory>[] = [
    {
      header: 'Pregunta',
      cellClassName: 'align-top py-4',
      cell: (item) => (
        <div className="max-w-md">
          <p
            className="text-[13.5px] leading-normal text-ink-700"
            style={{ textWrap: 'pretty' }}
          >
            {item.text}
          </p>
          <span className="mt-1 block font-mono text-[11px] text-ink-400">{item.code}</span>
        </div>
      ),
    },
    ...periods.map<DataTableColumn<CategoryItemHistory>>((period) => ({
      header: period.code,
      headerClassName: 'text-right whitespace-nowrap',
      cellClassName: 'align-top py-4 text-right whitespace-nowrap',
      cell: (item) => {
        const score = item.byPeriod.find((entry) => entry.code === period.code)
        if (!score) {
          return <span className="text-[13px] text-ink-400">—</span>
        }
        return (
          <span
            className={`num text-[14px] font-semibold tabular-nums ${professorScoreTone(score.mine)}`}
          >
            {score.mine.toFixed(2)}
          </span>
        )
      },
    })),
    {
      header: 'Tendencia',
      headerClassName: 'text-right whitespace-nowrap',
      cellClassName: 'align-top py-4 text-right',
      cell: (item) => <TrendCell item={item} />,
    },
  ]

  return (
    <DataTable
      columns={columns}
      rows={items}
      rowKey={(item) => item.code}
      headerVariant="muted"
      minWidth={340 + periods.length * 92 + 110}
      emptyMessage="Sin ítems para comparar."
    />
  )
}
