import { AverageTrendChart } from '@/components/common/AverageTrendChart'
import { Skeleton } from '@/components/ui/skeleton'
import { dimensionColor, dimensionKey, shortenDimensionLabel } from '@/lib/dimensionLabel'
import { cn } from '@/lib/utils'
import { useGetDepartmentPeriodBreakdowns } from '../api'
import type { StatsPeriodRef } from '../types'

const GRID = 'grid gap-x-6 gap-y-5 sm:grid-cols-2'

/** The heteroevaluation always has four pedagogical dimensions — the shape to hold while they load. */
const DIMENSION_SLOTS = [0, 1, 2, 3]

export interface DepartmentDimensionsPeriodComparisonProps {
  /** Every period in the compared range, oldest first. */
  periods: StatsPeriodRef[]
  /** Dashed marker drawn on every chart, e.g. the range's overall average. */
  referenceValue?: number
  referenceLabel?: string
  className?: string
}

/**
 * Pedagogical dimension averages of a department compared period by period —
 * one small chart per dimension, drawn like "Evolución del promedio por
 * periodo" and colored with the dimension palette used across the app.
 * Stands in for `DepartmentDimensionsChart` while comparing a range, which
 * can only show the range as a single aggregate.
 *
 * The four charts share one y range (and the same reference marker), so a
 * dimension can be read against the others and not just against itself.
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
  const categories = periods.map(periodLabel)

  // Union across periods, in first-appearance order — a dimension missing
  // from one period keeps its chart, with a gap in that period.
  const dimensionNames = [
    ...new Set(
      periodStats.flatMap((stats) => (stats?.dimensions ?? []).map((entry) => entry.dimension)),
    ),
  ]

  const averageIn = (periodIndex: number, dimension: string) =>
    periodStats[periodIndex]?.dimensions?.find((entry) => entry.dimension === dimension)?.average ??
    null

  const bounds = sharedBounds(
    dimensionNames.flatMap((dimension) =>
      periods.map((_period, index) => averageIn(index, dimension)),
    ),
    referenceValue,
  )

  if (isPending) {
    return (
      <div className={cn(GRID, className)}>
        {DIMENSION_SLOTS.map((slot) => (
          <Skeleton key={slot} className="h-56 w-full rounded-md" />
        ))}
      </div>
    )
  }

  if (dimensionNames.length === 0) {
    return (
      <p className={cn('text-muted-foreground py-10 text-center text-sm text-balance', className)}>
        No hay promedios por dimensión en los periodos comparados.
      </p>
    )
  }

  return (
    <div className={cn(GRID, className)}>
      {dimensionNames.map((dimension) => (
        <div key={dimension}>
          <h3 className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
            {shortenDimensionLabel(dimension)}
          </h3>

          <AverageTrendChart
            series={[
              {
                id: dimensionKey(dimension),
                label: shortenDimensionLabel(dimension),
                color: dimensionColor(dimension),
                data: periods.map((period, index) => ({
                  x: periodLabel(period),
                  value: averageIn(index, dimension),
                })),
              },
            ]}
            categories={categories}
            min={bounds.min}
            max={bounds.max}
            referenceValue={referenceValue}
            referenceLabel={referenceLabel}
            customizable={false}
            emptyMessage="Sin promedios en los periodos comparados."
            chartClassName="h-56"
          />
        </div>
      ))}
    </div>
  )
}

/** X-axis label of a period: its name, falling back to its code. */
function periodLabel(period: StatsPeriodRef) {
  return period.academic_period_name || period.academic_period_code
}

/**
 * One y range for all four charts, zoomed to the band the averages actually
 * live in (rounded out to half points, never outside the 0–5 scale): on the
 * full scale a semester's movement of a tenth or two is a flat line.
 */
function sharedBounds(values: (number | null)[], referenceValue?: number) {
  const scored = [...values, referenceValue].filter((value): value is number => value != null)

  if (scored.length === 0) return { min: 0, max: 5 }

  return {
    min: Math.max(0, Math.floor((Math.min(...scored) - 0.25) * 2) / 2),
    max: Math.min(5, Math.ceil((Math.max(...scored) + 0.25) * 2) / 2),
  }
}
