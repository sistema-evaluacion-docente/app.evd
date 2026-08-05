import type { ColumnDef } from '@tanstack/react-table'

import { ScoreBadge } from '@/components/common/ScoreBadge'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { AI_STATUS_DISPLAY, EVALUATION_STATUS_DISPLAY } from '../config'
import type { AiStatus, EvaluationRecord } from '../types'

/**
 * Column definitions for the evaluations table (period, status, average, AI
 * analysis, PDF) used by the shared `DataTable`.
 *
 * @example
 * <DataTable columns={evaluationColumns} data={data} pageCount={pageCount} {...stateProps} />
 */
export const evaluationColumns: ColumnDef<EvaluationRecord>[] = [
  {
    id: 'academic_period_name',
    accessorKey: 'academic_period_name',
    header: 'Periodo',
    cell: ({ row }) => {
      const evaluation = row.original

      return (
        <div className="flex flex-col">
          <span className="text-foreground text-[15px] font-semibold">
            {evaluation.academic_period_name || evaluation.academic_period_code || '—'}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ getValue }) => {
      const status = getValue<EvaluationRecord['status']>()
      const config = EVALUATION_STATUS_DISPLAY[status]

      return <Badge className={config.className}>{config.label}</Badge>
    },
  },

  {
    accessorKey: 'overall_average',
    header: 'Promedio',
    cell: ({ getValue }) => {
      const average = getValue<number | null>()

      return <ScoreBadge value={average} decimals={2} />
    },
  },
  {
    accessorKey: 'count',
    header: 'Docentes',
    cell: ({ getValue }) => {
      const count = getValue<number | null>()

      return (
        <span className="text-muted-foreground text-sm tabular-nums">
          {count != null ? count : '—'}
        </span>
      )
    },
  },
  {
    accessorKey: 'ai_status',
    header: 'Análisis IA',
    cell: ({ getValue }) => {
      const aiStatus = getValue<AiStatus | null>()

      if (!aiStatus) {
        return <span className="text-muted-foreground text-xs">No disponible</span>
      }

      const config = AI_STATUS_DISPLAY[aiStatus]

      return (
        <Badge className={config.className}>
          {aiStatus === 'ANALYZING' ? <Spinner className="size-3" /> : null}
          {config.label}
        </Badge>
      )
    },
  },
]
