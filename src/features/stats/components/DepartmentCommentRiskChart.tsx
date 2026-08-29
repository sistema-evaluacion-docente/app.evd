import { DimensionComparisonChart } from '@/components/common/DimensionComparisonChart'
import { RISK_LEVELS, type RiskLevelMeta } from '@/lib/riskLevel'

export interface DepartmentCommentRiskChartProps {
  /** Comment count per risk level (BAJO/MEDIO/ALTO), as returned by the API. */
  counts: { BAJO: number; MEDIO: number; ALTO: number } | undefined
  /** Makes each bar clickable, e.g. to open that level's comments. */
  onRiskLevelClick?: (level: RiskLevelMeta) => void
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
 *
 * @example
 * // Each bar opens the comments filtered by the level clicked.
 * <DepartmentCommentRiskChart counts={counts} onRiskLevelClick={(level) => navigate(hrefFor(level))} />
 */
export function DepartmentCommentRiskChart({
  counts,
  onRiskLevelClick,
  className,
}: DepartmentCommentRiskChartProps) {
  const entries = RISK_LEVELS.map((level) => ({
    key: level.key,
    label: level.name,
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
        label: level.name,
        color: level.color,
      }))}
      orientation="vertical"
      min={0}
      max={max}
      decimals={0}
      showLegend={false}
      emptyMessage="No hay comentarios clasificados por nivel de riesgo en este rango de periodos."
      onDimensionClick={
        onRiskLevelClick
          ? (key) => {
              const level = RISK_LEVELS.find((entry) => entry.key === key)

              if (level) onRiskLevelClick(level)
            }
          : undefined
      }
      className={className}
    />
  )
}
