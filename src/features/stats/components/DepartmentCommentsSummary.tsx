import { BarChart3, LayoutGrid, PieChart as PieChartIcon, Sparkles } from 'lucide-react'
import { useState } from 'react'

import { CountPieChart } from '@/components/common/CountPieChart'
import { LoadingButton } from '@/components/common/LoadingButton'
import ChartColumnSkeleton from '@/components/skeletons/ChartColumnSkeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AI_STATUS_DISPLAY, type AiStatus } from '@/features/evaluations'
import { CATEGORIES, categoryColor, categoryLabel, UNCATEGORIZED } from '@/lib/categoryLabel'
import { cn } from '@/lib/utils'
import { RISK_LEVELS, type RiskLevelMeta } from '@/lib/riskLevel'
import { DepartmentCommentCategoriesChart } from './DepartmentCommentCategoriesChart'
import { DepartmentCommentRiskChart } from './DepartmentCommentRiskChart'

/** Excludes "Sin categoría" — a non-classification, not useful for analysis. */
const ANALYZABLE_CATEGORIES = CATEGORIES.filter((category) => category.code !== UNCATEGORIZED)

/** Legend line widths of the loading state, one per risk level/category. */
const RISK_LEGEND_WIDTHS = ['w-32', 'w-36', 'w-28']
const CATEGORY_LEGEND_WIDTHS = ['w-40', 'w-32', 'w-36', 'w-28']

type ViewMode = 'bar' | 'pie' | 'both'

export interface DepartmentCommentsSummaryProps {
  riskCounts: { BAJO: number; MEDIO: number; ALTO: number } | undefined
  categoryCounts: Record<string, number> | undefined
  /** Counts from the range's starting period, when comparing a genuine range — enables the delta indicator (donut mode only). */
  previousRiskCounts?: { BAJO: number; MEDIO: number; ALTO: number }
  previousCategoryCounts?: Record<string, number>
  /** Start/end period names, when comparing a genuine range — swaps the generic subtitle for "Comparando X con Y". */
  comparisonLabel?: { start: string; end: string }
  /**
   * Makes the risk breakdown clickable — bar, donut slice and donut legend
   * alike — handing back the level picked, e.g. to open its comments. Omit to
   * leave the charts as a read-only figure.
   */
  onRiskLevelClick?: (level: RiskLevelMeta) => void
  /**
   * AI status of the period's evaluation. Anything other than `ANALYZED`
   * replaces the charts with the notice below: every count is zero until the
   * model has classified the comments, and an all-zero chart is indistinguishable
   * from a department nobody wrote about.
   */
  aiStatus?: AiStatus | null
  /** Starts the analysis from the notice. Omit to leave the notice read-only. */
  onAnalyze?: () => void
  /** Whether that analysis is already running — the button says so and waits. */
  isAnalyzing?: boolean
  /**
   * `aiStatus` is still on its way. The counts and the status they have to be
   * read against arrive from two different requests, so until the second one
   * lands the card knows the numbers but not what they mean — and drawing the
   * charts on that guess is what made them flash before the notice replaced
   * them. It waits instead.
   */
  isStatusPending?: boolean
  className?: string
}

/**
 * Comment breakdown for a single period: risk level and pedagogical
 * category, as the existing vertical bar charts
 * (`DepartmentCommentRiskChart`/`DepartmentCommentCategoriesChart`, unchanged),
 * as donuts (`CountPieChart`), or both stacked together — one toggle switches
 * every column at once, e.g. to include both forms in a printed report.
 *
 * Single period only — when comparing a range, `DepartmentPeriodRangeSummary`
 * renders `DepartmentCommentPeriodBreakdown` instead, since a range needs a
 * genuine per-period read, not one period's counts labeled as a comparison.
 *
 * @example
 * <DepartmentCommentsSummary
 *   riskCounts={stats.comments_risk_counts}
 *   categoryCounts={stats.comments_pedagogical_category_counts}
 * />
 *
 * @example
 * // Risk breakdown that opens the comments of the level clicked.
 * <DepartmentCommentsSummary
 *   riskCounts={counts}
 *   categoryCounts={categories}
 *   onRiskLevelClick={(level) => navigate(`/comentarios?riskLevel=${level.id}`)}
 * />
 */
export function DepartmentCommentsSummary({
  riskCounts,
  categoryCounts,
  onRiskLevelClick,
  aiStatus,
  onAnalyze,
  isAnalyzing = false,
  isStatusPending = false,
  className,
}: DepartmentCommentsSummaryProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('bar')

  const pendingAnalysis = !isStatusPending && aiStatus != null && aiStatus !== 'ANALYZED'

  const riskEntries = RISK_LEVELS.map((level) => ({
    key: level.key,
    label: level.name,
    value: riskCounts?.[level.key] ?? 0,
    color: level.color,
  }))

  const riskLevelByKey = new Map(RISK_LEVELS.map((level) => [level.key, level]))

  const categoryEntries = ANALYZABLE_CATEGORIES.map((category) => ({
    key: category.code,
    label: categoryLabel(category.code),
    value: categoryCounts?.[category.code] ?? 0,
    color: categoryColor(category.code),
  }))

  return (
    <section className={cn('border-border bg-background rounded-md border', className)}>
      <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4">
        <div>
          <h2 className="text-sm font-medium">Comentarios de la heteroevaluación</h2>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Clasificación de los comentarios que los estudiantes dejaron en las evaluaciones del
            departamento durante el periodo seleccionado.
          </p>
        </div>

        {/* Reserved while the status is unknown, then either the real toggle or
            nothing at all — the notice has no view to switch between. */}
        {isStatusPending && <Skeleton className="h-9 w-56 shrink-0 rounded-md" />}

        {!isStatusPending && !pendingAnalysis && (
          <div
            role="group"
            aria-label="Forma de ver los comentarios"
            className="border-border inline-flex shrink-0 gap-0.5 rounded-md border p-0.5"
          >
            <Button
              type="button"
              variant={viewMode === 'bar' ? 'default' : 'ghost'}
              size="sm"
              aria-pressed={viewMode === 'bar'}
              onClick={() => setViewMode('bar')}
            >
              <BarChart3 className="size-3.5" aria-hidden="true" />
              Barra
            </Button>

            <Button
              type="button"
              variant={viewMode === 'pie' ? 'default' : 'ghost'}
              size="sm"
              aria-pressed={viewMode === 'pie'}
              onClick={() => setViewMode('pie')}
            >
              <PieChartIcon className="size-3.5" aria-hidden="true" />
              Dona
            </Button>

            <Button
              type="button"
              variant={viewMode === 'both' ? 'default' : 'ghost'}
              size="sm"
              aria-pressed={viewMode === 'both'}
              onClick={() => setViewMode('both')}
            >
              <LayoutGrid className="size-3.5" aria-hidden="true" />
              Ambos
            </Button>
          </div>
        )}
      </div>

      {isStatusPending ? (
        <div
          role="status"
          aria-busy="true"
          aria-label="Cargando los comentarios del periodo"
          className="divide-border grid divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0"
        >
          <ChartColumnSkeleton
            variant={viewMode === 'pie' ? 'pie' : 'bar'}
            headingWidth="w-28"
            legendWidths={RISK_LEGEND_WIDTHS}
          />
          <ChartColumnSkeleton
            variant={viewMode === 'pie' ? 'pie' : 'bar'}
            headingWidth="w-36"
            legendWidths={CATEGORY_LEGEND_WIDTHS}
          />
        </div>
      ) : pendingAnalysis ? (
        <AnalysisNotice aiStatus={aiStatus} onAnalyze={onAnalyze} isAnalyzing={isAnalyzing} />
      ) : (
        <div className="divide-border grid divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <div className="px-6 py-4">
            <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
              Por nivel de riesgo
            </h3>

            {onRiskLevelClick && (
              <p className="text-muted-foreground mb-3 text-xs">
                Haz clic en un nivel para ver sus comentarios.
              </p>
            )}

            {viewMode !== 'pie' && (
              <DepartmentCommentRiskChart counts={riskCounts} onRiskLevelClick={onRiskLevelClick} />
            )}

            {viewMode !== 'bar' && (
              <CountPieChart
                entries={riskEntries}
                emptyMessage="No hay comentarios clasificados por nivel de riesgo en este rango de periodos."
                onEntryClick={
                  onRiskLevelClick
                    ? (entry) => {
                        const level = riskLevelByKey.get(entry.key as RiskLevelMeta['key'])

                        if (level) onRiskLevelClick(level)
                      }
                    : undefined
                }
                className={viewMode === 'both' ? 'border-border mt-4 border-t pt-4' : undefined}
              />
            )}
          </div>

          <div className="px-6 py-4">
            <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
              Por categoría pedagógica
            </h3>

            {viewMode !== 'pie' && <DepartmentCommentCategoriesChart counts={categoryCounts} />}

            {viewMode !== 'bar' && (
              <CountPieChart
                entries={categoryEntries}
                emptyMessage="No hay comentarios clasificados por categoría en este rango de periodos."
                className={viewMode === 'both' ? 'border-border mt-4 border-t pt-4' : undefined}
              />
            )}
          </div>
        </div>
      )}
    </section>
  )
}

/**
 * What stands where the charts would be until the comments have been through
 * the model, with the one action that fixes it.
 *
 * The counts behind those charts are classifications, so before the analysis
 * they are all zero — and zero draws as a flat axis with no bars, which reads
 * as "nobody wrote anything" rather than "nothing has been read yet". Saying
 * which of the two it is, and offering the run right here, is the difference
 * between a broken-looking card and a card with one thing left to do.
 */
function AnalysisNotice({
  aiStatus,
  onAnalyze,
  isAnalyzing,
}: {
  aiStatus: AiStatus | null | undefined
  onAnalyze?: () => void
  isAnalyzing: boolean
}) {
  const statusConfig = aiStatus ? AI_STATUS_DISPLAY[aiStatus] : undefined

  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <div className="bg-muted flex size-12 items-center justify-center rounded-full">
        <Sparkles className="text-muted-foreground size-5" aria-hidden="true" />
      </div>

      {statusConfig && <Badge className={statusConfig.className}>{statusConfig.label}</Badge>}

      <p className="text-muted-foreground max-w-sm text-sm text-balance">
        {aiStatus === 'FAILED'
          ? 'El análisis anterior falló. Analiza los comentarios con IA para poder mostrar las estadísticas.'
          : 'Analiza los comentarios con IA para poder mostrar las estadísticas.'}
      </p>

      {onAnalyze && (
        <LoadingButton
          type="button"
          size="sm"
          pending={isAnalyzing}
          pendingLabel="Analizando…"
          onClick={onAnalyze}
        >
          <Sparkles className="size-4" aria-hidden="true" />
          Analizar
        </LoadingButton>
      )}
    </div>
  )
}
