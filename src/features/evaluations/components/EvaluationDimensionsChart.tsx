import {
  DimensionComparisonChart,
  type DimensionComparisonChartProps,
  type DimensionSeries,
} from '@/components/common/DimensionComparisonChart'
import { dimensionColor, shortenDimensionLabel } from '@/lib/dimensionLabel'
import type { DimensionAverageItem } from '../types'

export interface EvaluationDimensionsChartProps extends Omit<
  DimensionComparisonChartProps,
  'series' | 'dimensions'
> {
  dimensionAverages: DimensionAverageItem[] | undefined
  /** Series label shown in tooltips. Defaults to "Promedio de la evaluación". */
  label?: string
  /**
   * A second series to draw alongside, e.g. the department-wide averages
   * when `dimensionAverages` is scoped to a teacher/course.
   */
  compareAverages?: DimensionAverageItem[]
  /** Label for `compareAverages`. Defaults to "Promedio del departamento". */
  compareLabel?: string
}

/**
 * Averages of the pedagogical dimensions for a whole evaluation, drawn with the
 * shared `DimensionComparisonChart` and color-matched to the dimension palette
 * used across the app. Every chart prop (variant, reference line, height…)
 * passes through.
 *
 * @example
 * <EvaluationDimensionsChart dimensionAverages={evaluation.dimension_averages} />
 *
 * @example
 * <EvaluationDimensionsChart
 *   dimensionAverages={evaluation.dimension_averages}
 *   referenceValue={evaluation.overall_average}
 *   referenceLabel="Promedio general"
 * />
 */
export function EvaluationDimensionsChart({
  dimensionAverages,
  label = 'Promedio de la evaluación',
  compareAverages,
  compareLabel = 'Promedio del departamento',
  emptyMessage = 'Esta evaluación todavía no tiene promedios por dimensión.',
  ...chartProps
}: EvaluationDimensionsChartProps) {
  const items = dimensionAverages ?? []

  const series: DimensionSeries[] = [
    {
      id: 'evaluation',
      label,
      scores: items.map((item) => ({ dimension: item.dimension, value: item.average })),
    },
  ]

  if (compareAverages) {
    series.push({
      id: 'overall',
      label: compareLabel,
      scores: compareAverages.map((item) => ({ dimension: item.dimension, value: item.average })),
    })
  }

  return (
    <DimensionComparisonChart
      series={series}
      dimensions={items.map((item) => ({
        key: item.dimension,
        color: dimensionColor(item.dimension),
      }))}
      labelFormatter={shortenDimensionLabel}
      emptyMessage={emptyMessage}
      {...chartProps}
    />
  )
}
