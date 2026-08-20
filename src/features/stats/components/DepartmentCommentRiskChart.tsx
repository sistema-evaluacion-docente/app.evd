import { DimensionComparisonChart } from '@/components/common/DimensionComparisonChart'

/**
 * Risk levels in display order: key, readable label, and a fixed semantic
 * color (green/amber/red) — same set the donut view uses in
 * `DepartmentCommentsSummary`, so both view modes read consistently instead
 * of this one falling back to the generic chart palette.
 */
const RISK_LEVELS = [
  { key: 'BAJO', label: 'Bajo', color: '#22c55e' },
  { key: 'MEDIO', label: 'Medio', color: '#f59e0b' },
  { key: 'ALTO', label: 'Alto', color: '#ef4444' },
] as const

export interface DepartmentCommentRiskChartProps {
  /** Comment count per risk level (BAJO/MEDIO/ALTO), as returned by the API. */
  counts: { BAJO: number; MEDIO: number; ALTO: number } | undefined
  className?: string
}

/**
 * Comment counts broken down by risk level, drawn with the shared
 * `DimensionComparisonChart` (recharts) — same pattern as
 * `DepartmentCommentCategoriesChart`, scoped to risk level instead of
 * pedagogical category.
 *
 * @example
 * <DepartmentCommentRiskChart counts={stats.comments_risk_counts} />
 */
export function DepartmentCommentRiskChart({ counts, className }: DepartmentCommentRiskChartProps) {
  const entries = RISK_LEVELS.map((level) => ({
    key: level.key,
    label: level.label,
    count: counts?.[level.key] ?? 0,
  }))

  const rawMax = Math.max(1, ...entries.map((entry) => entry.count))
  const max = Math.max(10, Math.ceil(rawMax / 10) * 10)

  return (
    <DimensionComparisonChart
      series={[
        {
          id: 'count',
          label: 'Comentarios',
          scores: entries.map((entry) => ({ dimension: entry.key, value: entry.count })),
        },
      ]}
      dimensions={RISK_LEVELS.map((level) => ({
        key: level.key,
        label: level.label,
        color: level.color,
      }))}
      orientation="vertical"
      min={0}
      max={max}
      decimals={0}
      showLegend={false}
      emptyMessage="No hay comentarios clasificados por nivel de riesgo en este rango de periodos."
      className={className}
    />
  )
}
