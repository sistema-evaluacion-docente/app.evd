import type { ColumnDef } from '@tanstack/react-table'

import { ScoreBadge } from '@/components/common/ScoreBadge'
import type { TeacherPeriodHistory } from '../types'

export const columns: ColumnDef<TeacherPeriodHistory>[] = [
  {
    id: 'period_code',
    accessorKey: 'period_code',
    header: 'Periodo',
    cell: ({ row }) => {
      const entry = row.original

      return (
        <div className="flex flex-col">
          <span className="text-foreground text-[15px] font-semibold">
            {entry.period_name ?? entry.period_code}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: 'group_count',
    header: 'Grupos',
    cell: ({ getValue }) => (
      <span className="text-muted-foreground text-sm tabular-nums">{getValue<number>()}</span>
    ),
  },
  {
    accessorKey: 'overall_average',
    header: 'Promedio',
    cell: ({ getValue }) => {
      const average = getValue<number | undefined>()

      return <ScoreBadge value={average} decimals={2} />
    },
  },
]
