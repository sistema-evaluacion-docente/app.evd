import { Card } from '@/components/ui/card'
import { Badge } from '@/shared/ui'
import { MessageSquare } from 'lucide-react'

import type { ProfessorSummary } from '../../model/professorSummary'

export interface ProfessorResultCardProps {
  summary: ProfessorSummary
  periodValue: string
}

export function ProfessorResultCard({ summary, periodValue }: ProfessorResultCardProps) {
  return (
    <Card className="flex flex-col gap-6 p-6 sm:p-7 lg:flex-row lg:items-center lg:gap-12">
      <div>
        <div className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Calificacion general · {periodValue}
        </div>

        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className="num text-foreground text-5xl leading-none font-semibold tabular-nums">
            {summary.overall.toFixed(1)}
          </span>
          <span className="text-muted-foreground text-base font-medium">/5.0</span>
        </div>

        <Badge variant={summary.level.variant} className="mt-3 h-7 px-3 text-xs">
          {summary.level.label}
        </Badge>
      </div>

      <div className="bg-border hidden w-px self-stretch lg:block" />

      <div className="flex items-center gap-3.5">
        <span className="bg-muted text-muted-foreground inline-flex size-11 shrink-0 items-center justify-center rounded-md">
          <MessageSquare size={20} />
        </span>

        <div>
          <div className="num text-foreground text-2xl leading-tight font-semibold tabular-nums">
            {summary.comments.length} comentarios
          </div>

          <div className="text-muted-foreground text-sm">
            escritos por sus estudiantes este periodo
          </div>
        </div>
      </div>

      <div className="lg:ml-auto lg:text-right">
        <div className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Promedio del departamento
        </div>

        <div className="num text-foreground/80 mt-2 text-3xl font-semibold tabular-nums">
          {summary.deptOverall.toFixed(1)}{' '}
          <span className="text-muted-foreground text-sm font-medium">/5.0</span>
        </div>
      </div>
    </Card>
  )
}
