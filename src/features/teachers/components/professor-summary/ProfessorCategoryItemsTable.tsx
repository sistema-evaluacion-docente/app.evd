import { DataTable, type DataTableColumn } from '@/shared/ui'
import { ArrowDown, ArrowUp, Minus } from 'lucide-react'

import { professorScoreTone, type CategoryItemHistory } from '../../model/professorSummary'

export interface ProfessorCategoryItemsTableProps {
  items: CategoryItemHistory[]
  periods: { code: string; name: string }[]
}

function TrendCell({ item }: { item: CategoryItemHistory }) {
  const scores = item.byPeriod

  if (scores.length < 2) {
    return <span className="text-muted-foreground text-sm">--</span>
  }

  const delta = scores[scores.length - 1].mine - scores[scores.length - 2].mine
  const isUp = delta > 0.005
  const isDown = delta < -0.005
  const Icon = isUp ? ArrowUp : isDown ? ArrowDown : Minus
  const tone = isUp
    ? 'bg-emerald-50 text-emerald-700'
    : isDown
      ? 'bg-red-50 text-red-700'
      : 'bg-muted text-muted-foreground'

  return (
    <span
      className={`num inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${tone}`}
    >
      <Icon size={12} />
      {delta >= 0 ? '+' : ''}
      {delta.toFixed(2)}
    </span>
  )
}

export function ProfessorCategoryItemsTable({ items, periods }: ProfessorCategoryItemsTableProps) {
  const columns: DataTableColumn<CategoryItemHistory>[] = [
    {
      header: 'Pregunta',
      cellClassName: 'align-top py-4',
      cell: (item) => (
        <div className="max-w-md">
          <p className="text-foreground/80 text-sm leading-normal" style={{ textWrap: 'pretty' }}>
            {item.text}
          </p>

          <span className="text-muted-foreground mt-1 block font-mono text-xs">{item.code}</span>
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
          return <span className="text-muted-foreground text-sm">--</span>
        }

        return (
          <span
            className={`num text-sm font-semibold tabular-nums ${professorScoreTone(score.mine)}`}
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
      emptyMessage="Sin items para comparar."
    />
  )
}
