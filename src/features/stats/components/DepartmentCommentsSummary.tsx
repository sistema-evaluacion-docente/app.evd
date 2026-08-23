import { BarChart3, LayoutGrid, PieChart as PieChartIcon } from 'lucide-react'
import { useState } from 'react'

import { CountPieChart } from '@/components/common/CountPieChart'
import { Button } from '@/components/ui/button'
import { CATEGORIES, categoryColor, categoryLabel, UNCATEGORIZED } from '@/lib/categoryLabel'
import { cn } from '@/lib/utils'
import { DepartmentCommentCategoriesChart } from './DepartmentCommentCategoriesChart'
import { DepartmentCommentRiskChart } from './DepartmentCommentRiskChart'

/** Risk levels in display order: key, readable label, and a fixed semantic color
 *  (green/amber/red) — same set used in the teacher's own comments summary. */
const RISK_LEVELS = [
  { key: 'BAJO', label: 'Bajo', color: '#22c55e' },
  { key: 'MEDIO', label: 'Medio', color: '#f59e0b' },
  { key: 'ALTO', label: 'Alto', color: '#ef4444' },
] as const

/** Excludes "Sin categoría" — a non-classification, not useful for analysis. */
const ANALYZABLE_CATEGORIES = CATEGORIES.filter((category) => category.code !== UNCATEGORIZED)

type ViewMode = 'bar' | 'pie' | 'both'

export interface DepartmentCommentsSummaryProps {
  riskCounts: { BAJO: number; MEDIO: number; ALTO: number } | undefined
  categoryCounts: Record<string, number> | undefined
  /** Counts from the range's starting period, when comparing a genuine range — enables the delta indicator (donut mode only). */
  previousRiskCounts?: { BAJO: number; MEDIO: number; ALTO: number }
  previousCategoryCounts?: Record<string, number>
  /** Start/end period names, when comparing a genuine range — swaps the generic subtitle for "Comparando X con Y". */
  comparisonLabel?: { start: string; end: string }
  className?: string
}

/**
 * Comment breakdown for the department's period-range report: risk level and
 * pedagogical category, as the existing vertical bar charts
 * (`DepartmentCommentRiskChart`/`DepartmentCommentCategoriesChart`, unchanged),
 * as donuts (`CountPieChart`), or both stacked together — one toggle switches
 * every column at once, e.g. to include both forms in a printed report.
 *
 * @example
 * <DepartmentCommentsSummary
 *   riskCounts={stats.comments_risk_counts}
 *   categoryCounts={stats.comments_pedagogical_category_counts}
 * />
 */
export function DepartmentCommentsSummary({
  riskCounts,
  categoryCounts,
  previousRiskCounts,
  previousCategoryCounts,
  comparisonLabel,
  className,
}: DepartmentCommentsSummaryProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('bar')

  const riskEntries = RISK_LEVELS.map((level) => ({
    key: level.key,
    label: level.label,
    value: riskCounts?.[level.key] ?? 0,
    color: level.color,
    previousValue: previousRiskCounts?.[level.key],
  }))

  const categoryEntries = ANALYZABLE_CATEGORIES.map((category) => ({
    key: category.code,
    label: categoryLabel(category.code),
    value: categoryCounts?.[category.code] ?? 0,
    color: categoryColor(category.code),
    previousValue:
      previousCategoryCounts?.[category.code] ?? (previousCategoryCounts ? 0 : undefined),
  }))

  return (
    <section className={cn('border-border bg-background rounded-md border', className)}>
      <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4">
        <div>
          <h2 className="text-sm font-medium">Comentarios de la heteroevaluación</h2>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {comparisonLabel
              ? `Comparando ${comparisonLabel.start} con ${comparisonLabel.end}.`
              : 'Clasificación de los comentarios que los estudiantes dejaron en las evaluaciones del departamento durante el rango seleccionado.'}
          </p>
        </div>

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
      </div>

      <div className="divide-border grid divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <div className="px-6 py-4">
          <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
            Por nivel de riesgo
          </h3>

          {viewMode !== 'pie' && <DepartmentCommentRiskChart counts={riskCounts} />}

          {viewMode !== 'bar' && (
            <CountPieChart
              entries={riskEntries}
              emptyMessage="No hay comentarios clasificados por nivel de riesgo en este rango de periodos."
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
    </section>
  )
}
