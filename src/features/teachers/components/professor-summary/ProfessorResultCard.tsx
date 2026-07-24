import { Card } from '@/components/ui/card'
import { ArrowDown, ArrowUp, Minus } from 'lucide-react'

import type { ProfessorSummary } from '../../model/professorSummary'

export interface ProfessorResultCardProps {
  summary: ProfessorSummary
  periodValue: string
}

/**
 * A card that displays a professor's evaluation results.
 *
 * @param {ProfessorResultCardProps} props - The props for the component.
 * @param {ProfessorSummary} props.summary - The summary of the professor's evaluation results.
 * @param {string} props.periodValue - The period value for which the results are displayed.
 * @returns {JSX.Element} A card component displaying the professor's evaluation results.
 */
export function ProfessorResultCard({ summary, periodValue }: ProfessorResultCardProps) {
  const diff = summary.overall - summary.deptOverall
  const rounded = Math.round(diff * 10) / 10
  const abs = Math.abs(rounded)
  const isPositive = rounded > 0
  const isZero = rounded === 0

  return (
    <Card className="flex w-full max-w-sm flex-col gap-6 p-6 sm:p-7">
      <div>
        <div className="text-muted-foreground mb-4 text-xs font-semibold tracking-wider uppercase">
          Promedio de Heteroevaluación - {periodValue}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-baseline gap-1.5">
            <span className="num text-foreground text-4xl leading-none font-semibold tabular-nums">
              {summary.overall.toFixed(1)}
            </span>

            <span className="text-muted-foreground text-base font-medium">/5.0</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">vs. departamento:</span>

        <p
          className={`flex items-center gap-1 font-medium ${isPositive ? 'text-green-600' : isZero ? 'text-muted-foreground' : 'text-red-600'}`}
        >
          {isZero ? (
            <Minus className="size-3" />
          ) : isPositive ? (
            <ArrowUp className="size-3" />
          ) : (
            <ArrowDown className="size-3" />
          )}

          <span className="num tabular-nums">
            {isZero ? 'igual' : `${abs.toFixed(1)} ${isPositive ? 'por encima' : 'por debajo'}`}
          </span>
        </p>
      </div>
    </Card>
  )
}
