import { MessageSquare } from 'lucide-react'

import { Badge, Card } from '@/shared/ui'

import type { ProfessorSummary } from '../model/data'

export interface ProfessorResultCardProps {
  summary: ProfessorSummary
  periodValue: string
}

/** Overall grade, comment count and department average for the period. */
export function ProfessorResultCard({ summary, periodValue }: ProfessorResultCardProps) {
  return (
    <Card className="flex flex-col gap-6 p-6 sm:p-7 lg:flex-row lg:items-center lg:gap-12">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">
          Calificación general · {periodValue}
        </div>
        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className="num text-[52px] font-semibold leading-none tabular-nums text-ink-900">
            {summary.overall.toFixed(1)}
          </span>
          <span className="text-[17px] font-medium text-ink-500">/5.0</span>
        </div>
        <Badge variant={summary.level.variant} className="mt-3 h-7 px-3 text-[12px]">
          {summary.level.label}
        </Badge>
      </div>

      <div className="hidden w-px self-stretch bg-ink-100 lg:block" />

      <div className="flex items-center gap-3.5">
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700">
          <MessageSquare size={20} />
        </span>
        <div>
          <div className="num text-[22px] font-semibold leading-tight tabular-nums text-ink-900">
            {summary.comments.length} comentarios
          </div>
          <div className="text-[14px] text-ink-500">
            escritos por sus estudiantes este periodo
          </div>
        </div>
      </div>

      <div className="lg:ml-auto lg:text-right">
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">
          Promedio del departamento
        </div>
        <div className="num mt-2 text-[28px] font-semibold tabular-nums text-ink-700">
          {summary.deptOverall.toFixed(1)}{' '}
          <span className="text-[14px] font-medium text-ink-400">/5.0</span>
        </div>
      </div>
    </Card>
  )
}
