import type { ColumnDef } from '@tanstack/react-table'

import { ScoreBadge } from '@/components/common/ScoreBadge'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import type { AiStatus, EvaluationRecord } from '../types'

const STATUS_MAP: Record<EvaluationRecord['status'], { label: string; className: string }> = {
  PROCESSING: { label: 'Procesando', className: 'bg-amber-50 text-amber-700' },
  COMPLETED: { label: 'Completado', className: 'bg-emerald-50 text-emerald-700' },
  FAILED: { label: 'Fallido', className: 'bg-red-50 text-red-700' },
}

const AI_STATUS_MAP: Record<AiStatus, { label: string; className: string }> = {
  PENDING: { label: 'Pendiente', className: 'bg-amber-50 text-amber-700' },
  ANALYZING: { label: 'Analizando', className: 'bg-blue-50 text-blue-700' },
  ANALYZED: { label: 'Completado', className: 'bg-emerald-50 text-emerald-700' },
  FAILED: { label: 'Fallido', className: 'bg-red-50 text-red-700' },
}

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
      const config = STATUS_MAP[status]

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

      const config = AI_STATUS_MAP[aiStatus]

      return (
        <Badge className={config.className}>
          {aiStatus === 'ANALYZING' ? <Spinner className="size-3" /> : null}
          {config.label}
        </Badge>
      )
    },
  },
]
