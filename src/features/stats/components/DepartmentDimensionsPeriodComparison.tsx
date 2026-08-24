import { DimensionComparisonChart } from '@/components/common/DimensionComparisonChart'
import { shortenDimensionLabel } from '@/lib/dimensionLabel'
import { useGetDepartmentPeriodBreakdowns } from '../api'
import type { StatsPeriodRef } from '../types'

/**
 * Periods are an *ordered* series, not unrelated categories, so they're drawn
 * as one hue from light (oldest) to dark (newest) instead of the categorical
 * chart palette — the direction of time is readable straight off the bars.
 * Six steps is what a single hue holds while every step stays distinct from
 * its neighbour and from both the light and the dark app background; a range
 * longer than that repeats a shade, and the fixed oldest→newest order inside
 * every dimension group is what tells those apart.
 */
const PERIOD_RAMP = ['#64b8eb', '#4ea2d4', '#368cbd', '#1a77a6', '#00628e', '#004d71']

/** Grouped bars grow downwards: each dimension holds one bar per period. */
const CHART_HEIGHT: Record<number, string> = {
  2: 'h-64',
  3: 'h-72',
  4: 'h-80',
  5: 'h-96',
}

export interface DepartmentDimensionsPeriodComparisonProps {
  /** Every period in the compared range, oldest first. */
  periods: StatsPeriodRef[]
  /** Dashed marker, e.g. the range's overall average. */
  referenceValue?: number
  referenceLabel?: string
  className?: string
}

/**
 * Pedagogical dimension averages of a department compared period by period —
 * one bar group per dimension, one bar per period inside it. Stands in for
 * `DepartmentDimensionsChart` while comparing a range, which can only show
 * the range as a single aggregate.
 *
 * `GET /stats/departments/period-range` only ever answers with one aggregate
 * for whatever range it's asked about, so a genuine per-period read means
 * fetching each period on its own (`useGetDepartmentPeriodBreakdowns`) — the
 * same queries `DepartmentCommentPeriodBreakdown` runs, so the two cards
 * share one set of requests.
 *
 * @example
 * <DepartmentDimensionsPeriodComparison periods={stats.periods} referenceValue={stats.overall_average} />
 */
export function DepartmentDimensionsPeriodComparison({
  periods,
  referenceValue,
  referenceLabel,
  className,
}: DepartmentDimensionsPeriodComparisonProps) {
  const results = useGetDepartmentPeriodBreakdowns(
    periods.map((period) => period.academic_period_code),
  )
  const isPending = results.some((result) => result.isPending)

  const periodStats = results.map((result) => result.data?.data)

  // Union across periods, in first-appearance order — a dimension missing
  // from one period keeps its place on the axis instead of dropping out.
  const dimensionNames = [
    ...new Set(
      periodStats.flatMap((stats) => (stats?.dimensions ?? []).map((entry) => entry.dimension)),
    ),
  ]

  const colors = periodColors(periods.length)
  const series = periods.map((period, index) => ({
    id: period.academic_period_code,
    label: period.academic_period_name || period.academic_period_code,
    color: colors[index],
    scores: dimensionNames.map((dimension) => ({
      dimension,
      value: periodStats[index]?.dimensions?.find((entry) => entry.dimension === dimension)
        ?.average,
    })),
  }))

  return (
    <DimensionComparisonChart
      series={series}
      dimensions={dimensionNames.map((dimension) => ({ key: dimension }))}
      labelFormatter={shortenDimensionLabel}
      referenceValue={referenceValue}
      referenceLabel={referenceLabel}
      isLoading={isPending}
      emptyMessage="No hay promedios por dimensión en los periodos comparados."
      chartClassName={CHART_HEIGHT[periods.length] ?? (periods.length > 5 ? 'h-[28rem]' : 'h-64')}
      className={className}
    />
  )
}

/** `count` shades spread across the ramp, so the newest period is always the darkest. */
function periodColors(count: number) {
  if (count < 2) return [PERIOD_RAMP[PERIOD_RAMP.length - 1]]

  return Array.from(
    { length: count },
    (_, index) => PERIOD_RAMP[Math.round((index * (PERIOD_RAMP.length - 1)) / (count - 1))],
  )
}
