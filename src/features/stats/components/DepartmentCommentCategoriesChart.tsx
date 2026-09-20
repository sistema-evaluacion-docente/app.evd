import { DimensionComparisonChart } from '@/components/common/DimensionComparisonChart'
import { CATEGORIES, categoryLabel, UNCATEGORIZED } from '@/lib/categoryLabel'

/** Excludes "Sin categoría" — a non-classification, not useful for analysis. */
const ANALYZABLE_CATEGORIES = CATEGORIES.filter((category) => category.code !== UNCATEGORIZED)

export interface DepartmentCommentCategoriesChartProps {
  /** Comment count per pedagogical category code (`LABEL_0`…`LABEL_4`), as returned by the API. */
  counts: Record<string, number> | undefined
  /** Wording when nothing is classified. Defaults to the single-period one. */
  emptyMessage?: string
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
  emptyMessage = 'No hay comentarios clasificados por categoría en este periodo.',
  className,
}: DepartmentCommentCategoriesChartProps) {
  const entries = ANALYZABLE_CATEGORIES.map((category) => ({
    key: category.code,
    count: counts?.[category.code] ?? 0,
  }))

  const rawMax = Math.max(1, ...entries.map((entry) => entry.count))
  const max = Math.max(10, Math.ceil(rawMax / 10) * 10)

  // See `DepartmentCommentRiskChart`: all-zero is "not classified yet", not
  // "nobody wrote anything", and an empty axis cannot tell the two apart.
  const anyClassified = entries.some((entry) => entry.count > 0)

  return (
    <DimensionComparisonChart
      series={[
        {
          id: 'count',
          label: 'Comentarios',
          scores: anyClassified
            ? entries.map((entry) => ({ dimension: entry.key, value: entry.count }))
            : [],
        },
      ]}
      dimensions={ANALYZABLE_CATEGORIES.map((category) => ({
        key: category.code,
        color: category.color,
      }))}
      labelFormatter={categoryLabel}
      orientation="vertical"
      wrapLabels
      min={0}
      max={max}
      decimals={0}
      showLegend={false}
      emptyMessage={emptyMessage}
      className={className}
    />
  )
}
