import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Building2, User } from 'lucide-react'

import type { ProfessorSummary } from '../../model/professorSummary'

export interface ProfessorResultCardProps {
  summary: ProfessorSummary
  periodValue: string
}

export function ProfessorResultCard({ summary, periodValue }: ProfessorResultCardProps) {
  return (
    <Card className="flex flex-col gap-6 p-6 sm:p-7 lg:flex-row lg:items-start lg:gap-12">
      <div>
        <div className="text-muted-foreground mb-4 text-xs font-semibold tracking-wider uppercase">
          Promedio de Heteroevaluación - {periodValue}
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-muted flex h-15 w-15 items-center justify-center rounded">
            <User className="text-muted-foreground h-8 w-8" />
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="num text-foreground text-4xl leading-none font-semibold tabular-nums">
              {summary.overall.toFixed(1)}
            </span>

            <span className="text-muted-foreground text-base font-medium">/5.0</span>
          </div>
        </div>

        {/* <Badge variant={summary.level.variant} className="mt-3 h-7 px-3 text-xs">
          {summary.level.label}
        </Badge> */}
      </div>

      <Separator orientation="vertical" />

      <div>
        <div className="text-muted-foreground mb-4 text-xs font-semibold tracking-wider uppercase">
          Promedio del departamento - {periodValue}
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-muted flex h-15 w-15 items-center justify-center rounded">
            <Building2 className="text-muted-foreground h-8 w-8" />
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="num text-foreground text-4xl leading-none font-semibold tabular-nums">
              {summary.deptOverall.toFixed(1)}
            </span>

            <span className="text-muted-foreground text-base font-medium">/5.0</span>
          </div>
        </div>
      </div>

      {/* <div className="lg:ml-auto lg:text-right">
        <div className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Promedio del departamento
        </div>

        <div className="num text-foreground/80 mt-2 text-3xl font-semibold tabular-nums">
          {summary.deptOverall.toFixed(1)}{' '}
          <span className="text-muted-foreground text-sm font-medium">/5.0</span>
        </div>
      </div> */}
    </Card>
  )
}
