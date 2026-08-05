import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'

import { ScoreBadge } from '@/components/common/ScoreBadge'
import { Button } from '@/components/ui/button'
import type { TeacherPeriodHistory } from '../types'

export const columns: ColumnDef<TeacherPeriodHistory>[] = [
  {
    id: 'period_code',
    accessorKey: 'period_code',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Periodo
        <ArrowUpDown />
      </Button>
    ),
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
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Grupos
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ getValue }) => (
      <span className="text-muted-foreground text-sm tabular-nums">{getValue<number>()}</span>
    ),
  },
  {
    accessorKey: 'overall_average',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Promedio
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ getValue }) => {
      const average = getValue<number | null>()

      return <ScoreBadge value={average} decimals={2} />
    },
  },
]
