import { DimensionComparisonChart } from '@/components/common/DimensionComparisonChart'
import { CATEGORIES, categoryShortLabel, UNCATEGORIZED } from '@/lib/categoryLabel'

/** Excludes "Sin categoría" — a non-classification, not useful for analysis. */
const ANALYZABLE_CATEGORIES = CATEGORIES.filter((category) => category.code !== UNCATEGORIZED)

export interface DepartmentCommentCategoriesChartProps {
  /** Comment count per pedagogical category code (`LABEL_0`…`LABEL_4`), as returned by the API. */
  counts: Record<string, number> | undefined
  className?: string
}

/**
 * Comment counts broken down by pedagogical category, drawn with the shared
 * `DimensionComparisonChart` (recharts) and color-matched to the same
 * category palette used across the app (`categoryColor`) — same pattern as
 * `DepartmentDimensionsChart`, scoped to comment counts instead of scores.
 *
 * @example
 * <DepartmentCommentCategoriesChart counts={stats.comments_pedagogical_category_counts} />
 */
export function DepartmentCommentCategoriesChart({
  counts,
  className,
}: DepartmentCommentCategoriesChartProps) {
  const entries = ANALYZABLE_CATEGORIES.map((category) => ({
    key: category.code,
    count: counts?.[category.code] ?? 0,
  }))

  const max = Math.max(1, ...entries.map((entry) => entry.count))

  return (
    <DimensionComparisonChart
      series={[
        {
          id: 'count',
          label: 'Comentarios',
          scores: entries.map((entry) => ({ dimension: entry.key, value: entry.count })),
        },
      ]}
      dimensions={ANALYZABLE_CATEGORIES.map((category) => ({
        key: category.code,
        color: category.color,
      }))}
      labelFormatter={categoryShortLabel}
      orientation="vertical"
      min={0}
      max={max + 20}
      decimals={0}
      showLegend={false}
      emptyMessage="No hay comentarios clasificados por categoría en este rango de periodos."
      className={className}
    />
  )
}
