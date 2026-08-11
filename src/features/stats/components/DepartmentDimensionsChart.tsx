import {
  DimensionComparisonChart,
  type DimensionComparisonChartProps,
} from '@/components/common/DimensionComparisonChart'
import { dimensionColor, shortenDimensionLabel } from '@/lib/dimensionLabel'
import type { DepartmentDimensionAverage } from '../types'

export interface DepartmentDimensionsChartProps extends Omit<
  DimensionComparisonChartProps,
  'series' | 'dimensions'
> {
  dimensions: DepartmentDimensionAverage[] | undefined
  /** Series label shown in tooltips. Defaults to "Promedio del departamento". */
  label?: string
}

/**
 * Pedagogical dimension averages of a department across a period range,
 * drawn with the shared `DimensionComparisonChart` and color-matched to the
 * dimension palette used across the app (same pattern as
 * `EvaluationDimensionsChart`, scoped to a department instead of one
 * evaluation).
 *
 * @example
 * <DepartmentDimensionsChart dimensions={stats.dimensions} referenceValue={stats.overall_average} />
 */
export function DepartmentDimensionsChart({
  dimensions,
  label = 'Promedio del departamento',
  emptyMessage = 'No hay promedios por dimensión para este rango de periodos.',
  ...chartProps
}: DepartmentDimensionsChartProps) {
  const items = dimensions ?? []

  return (
    <DimensionComparisonChart
      series={[
        {
          id: 'department',
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
