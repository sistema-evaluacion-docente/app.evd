import { CalendarRange, FileText } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'wouter'

import { ScoreBadge } from '@/components/common/ScoreBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import formatDate from '@/lib/formatDate'
import { AI_STATUS_DISPLAY, EVALUATION_STATUS_DISPLAY } from '../config'
import type { EvaluationRecord } from '../types'

export interface EvaluationOverviewProps {
  evaluation: EvaluationRecord
  /** Link to the source document. Pass `null` to hide the action. */
  pdfHref?: string | null
  /** Extra actions rendered next to the PDF button. */
  actions?: ReactNode
  className?: string
}

/**
 * Flat, typographic hero for an evaluation: a context strip naming the
 * academic period, the overall average as the single large figure, and the
 * processing/AI/state facts as hairline-separated columns — same visual
 * language as `TeacherOverview`, so both detail pages read as one system.
 * When `evaluation.comparison` is present, the average shows a trend badge
 * against the previous academic period.
 *
 * @example
 * <EvaluationOverview evaluation={evaluation} pdfHref={`/evaluaciones/${evaluation.id}/pdf`} />
 */
export function EvaluationOverview({
  evaluation,
  pdfHref,
  actions,
  className,
}: EvaluationOverviewProps) {
  const statusConfig = EVALUATION_STATUS_DISPLAY[evaluation.status]
  const aiStatusConfig = evaluation.ai_status ? AI_STATUS_DISPLAY[evaluation.ai_status] : undefined

  return (
    <section
      className={`divide-border border-border bg-background divide-y overflow-hidden rounded-md border ${className ?? ''}`}
    >
      <div className="bg-brand-50 dark:bg-brand-900/20 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-3">
        <p className="text-brand-700 dark:text-brand-200 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <CalendarRange
            className="text-brand-600 dark:text-brand-300 size-4 shrink-0"
            aria-hidden="true"
          />

          <span className="text-brand-700/80 dark:text-brand-300/80 text-xs font-medium tracking-wide uppercase">
            Evaluación del periodo
          </span>

          <Badge className="text-sm font-bold">
            {evaluation.academic_period_name || evaluation.academic_period_code}
          </Badge>
        </p>

        <div className="flex shrink-0 items-center gap-2">
          {actions}

          {pdfHref && (
            <Button
              variant="outline"
              size="sm"
              render={<Link href={pdfHref} />}
              className="bg-background"
            >
              <FileText className="size-4" aria-hidden="true" />
              Ver PDF
            </Button>
          )}
        </div>
      </div>

      <div className="relative flex flex-wrap items-end justify-between gap-6 overflow-hidden p-6">
        <div
          aria-hidden="true"
          className="from-brand-500/10 pointer-events-none absolute -top-24 -right-24 size-56 rounded-full bg-radial to-transparent blur-2xl"
        />

        <div className="relative min-w-0">
          <h2 className="mt-1 truncate text-2xl font-bold tracking-tight sm:text-3xl">
            {evaluation.academic_period_name || evaluation.academic_period_code || 'Periodo'}
          </h2>

          <p className="text-muted-foreground mt-2 text-sm">
            Cargada el {formatDate(evaluation.created_at)}
          </p>
        </div>

        <div className="relative text-right">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Promedio general
          </p>

          <ScoreBadge
            value={evaluation.overall_average}
            previousValue={evaluation.comparison?.old_average}
            previousLabel={evaluation.comparison?.previous_period_name}
            tone="auto"
            size="5xl"
            decimals={2}
            className="leading-none"
          />
        </div>
      </div>

      <div className="divide-border grid grid-cols-2 divide-x sm:grid-cols-4">
        <Fact label="Docentes evaluados">
          <span className="num text-2xl font-semibold tabular-nums">{evaluation.count}</span>
        </Fact>

        <Fact label="Procesamiento">
          <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
        </Fact>

        <Fact label="Análisis con IA">
          {aiStatusConfig ? (
            <Badge className={aiStatusConfig.className}>{aiStatusConfig.label}</Badge>
          ) : (
            <span className="text-muted-foreground text-sm">No disponible</span>
          )}
        </Fact>

        <Fact label="Comentarios de alto riesgo">
          <span className="num text-2xl font-semibold text-red-600 tabular-nums dark:text-red-400">
            {evaluation.comments_risk_counts?.ALTO ?? '—'}
          </span>
        </Fact>
      </div>
    </section>
  )
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="px-6 py-4">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>

      <div className="mt-2 flex min-h-8 items-center">{children}</div>
    </div>
  )
}
