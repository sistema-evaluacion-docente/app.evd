import {
  DimensionComparisonChart,
  type DimensionComparisonChartProps,
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
  emptyMessage = 'Esta evaluación todavía no tiene promedios por dimensión.',
  ...chartProps
}: EvaluationDimensionsChartProps) {
  const items = dimensionAverages ?? []

  return (
    <DimensionComparisonChart
      series={[
        {
          id: 'evaluation',
          label,
          scores: items.map((item) => ({ dimension: item.dimension, value: item.average })),
        },
      ]}
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
