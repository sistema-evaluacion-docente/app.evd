import { CalendarRange, FileText, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'wouter'

import { ScoreBadge } from '@/components/common/ScoreBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useNavigate } from '@/hooks/useNavigate'
import formatDate from '@/lib/formatDate'
import { cn } from '@/lib/utils'
import { AI_STATUS_DISPLAY, EVALUATION_STATUS_DISPLAY } from '../config'
import type { EvaluationRecord } from '../types'

export interface EvaluationOverviewProps {
  evaluation: EvaluationRecord
  /** Link to the source document. Pass `null` to hide the action. */
  pdfHref?: string | null
  /** Extra actions rendered next to the PDF button. */
  actions?: ReactNode
  /**
   * Triggers the AI analysis. Omit to hide the action entirely (e.g. a
   * read-only context). Shown as a button next to the "Análisis con IA" fact
   * — rather than only inside a row-actions menu — whenever the evaluation
   * is actually ready to be analyzed (`status === 'COMPLETED'` and
   * `ai_status` is `PENDING` or `FAILED`), so the one thing to do about a
   * "Pendiente"/"Fallido" badge is right next to it instead of buried in a
   * menu the reader has to already know to open.
   */
  onAnalyze?: () => void
  /** Whether the analysis request itself is in flight, on top of `ai_status === 'ANALYZING'`. */
  isAnalyzing?: boolean
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
 *
 * @example
 * // With the AI analysis action surfaced next to its status.
 * <EvaluationOverview evaluation={evaluation} onAnalyze={() => analyze(evaluation.id)} isAnalyzing={isPending} />
 */
export function EvaluationOverview({
  evaluation,
  pdfHref,
  actions,
  onAnalyze,
  isAnalyzing,
  className,
}: EvaluationOverviewProps) {
  const navigate = useNavigate()

  const statusConfig = EVALUATION_STATUS_DISPLAY[evaluation.status]
  const aiStatusConfig = evaluation.ai_status ? AI_STATUS_DISPLAY[evaluation.ai_status] : undefined
  const isCurrentlyAnalyzing = evaluation.ai_status === 'ANALYZING' || isAnalyzing
  const canAnalyze =
    evaluation.status === 'COMPLETED' &&
    (evaluation.ai_status === 'PENDING' || evaluation.ai_status === 'FAILED')

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
              nativeButton={false}
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
        <Fact
          label="Docentes evaluados"
          title={`Ver la lista de docentes evaluados`}
          onClick={() => navigate(`/docentes?period=${evaluation.academic_period_name}`)}
        >
          <span className="num text-2xl font-semibold tabular-nums">{evaluation.count}</span>
        </Fact>

        <Fact
          label="Comentarios de alto riesgo"
          title={`Ver los comentarios de alto riesgo`}
          onClick={() => navigate(`/alertas?period=${evaluation.academic_period_name}`)}
        >
          <span className="num text-primary text-2xl font-semibold tabular-nums">
            {evaluation.comments_risk_counts?.ALTO ?? '—'}
          </span>
        </Fact>

        <Fact label="Procesamiento">
          <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
        </Fact>

        <Fact label="Análisis con IA">
          <div className="flex flex-wrap items-center gap-2">
            {aiStatusConfig ? (
              <Badge className={aiStatusConfig.className}>
                {isCurrentlyAnalyzing && <Spinner className="size-3" />}
                {aiStatusConfig.label}
              </Badge>
            ) : (
              <span className="text-muted-foreground text-sm">No disponible</span>
            )}

            {onAnalyze && canAnalyze && !isCurrentlyAnalyzing && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onAnalyze}
                className="bg-background h-7 px-2 text-xs"
              >
                <Sparkles className="size-3.5" aria-hidden="true" />
                {evaluation.ai_status === 'FAILED' ? 'Reintentar' : 'Analizar'}
              </Button>
            )}
          </div>
        </Fact>
      </div>
    </section>
  )
}

function Fact({
  label,
  children,
  onClick,
  title,
}: {
  label: string
  children: ReactNode
  onClick?: () => void
  title?: string
}) {
  return (
    <div
      title={title}
      onClick={onClick}
      className={cn('px-6 py-4', onClick ? 'hover:bg-accent/50 cursor-pointer' : '')}
    >
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>

      <div className="mt-2 flex min-h-8 items-center">{children}</div>
    </div>
  )
}
