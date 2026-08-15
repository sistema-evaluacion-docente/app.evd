import { DimensionComparisonChart } from '@/components/common/DimensionComparisonChart'

/** Risk levels in display order, object key + readable label. */
const RISK_LEVELS = [
  { key: 'BAJO', label: 'Bajo' },
  { key: 'MEDIO', label: 'Medio' },
  { key: 'ALTO', label: 'Alto' },
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
      dimensions={entries.map((entry) => ({ key: entry.key, label: entry.label }))}
      orientation="vertical"
      min={0}
      max={max + 20}
      decimals={0}
      showLegend={false}
      emptyMessage="No hay comentarios clasificados por nivel de riesgo en este rango de periodos."
      className={className}
    />
  )
}
