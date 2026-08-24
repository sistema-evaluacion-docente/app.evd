import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/** Bar heights (%) of the fake risk chart — three levels, uneven so it reads as data. */
const RISK_BARS = [58, 84, 40]

/** Bar heights (%) of the fake category chart — the four analyzable categories. */
const CATEGORY_BARS = [76, 48, 92, 62]

/** Chip widths of the fake indicator selectors shown while comparing a range. */
const RISK_CHIPS = ['w-14', 'w-16', 'w-14']
const CATEGORY_CHIPS = ['w-28', 'w-24', 'w-20', 'w-24']

/** Bar widths of the fake horizontal dimension chart — the heteroevaluation's four dimensions. */
const DIMENSION_BARS = ['w-10/12', 'w-7/12', 'w-11/12', 'w-8/12']

/** Point heights (%) of the fake trend line, one per period of a short range. */
const TREND_POINTS = [42, 66, 54, 80]

/** The heteroevaluation always has four pedagogical dimensions — the shape to hold while they load. */
const DIMENSION_SLOTS = [0, 1, 2, 3]

export interface DepartmentPeriodRangeSummarySkeletonProps {
  /** Mirrors the "Evolución del promedio por periodo" card, only drawn while comparing a range. */
  showTrendChart?: boolean
  /**
   * Range mode: the comments and dimensions cards take the per-period shape
   * (`DepartmentCommentPeriodBreakdown` / `DepartmentDimensionsPeriodComparison`),
   * matching those components' own loading states so nothing shifts twice.
   */
  rangeCompare?: boolean
  className?: string
}

/**
 * Loading placeholder for `DepartmentPeriodRangeSummary`. Mirrors the real
 * report card by card — hero, optional trend, comments and dimensions — with
 * fake axes, bars and chips instead of plain grey blocks, so the page keeps
 * its layout when the data lands.
 *
 * @example
 * if (isPending) return <DepartmentPeriodRangeSummarySkeleton />
 *
 * @example
 * <DepartmentPeriodRangeSummarySkeleton showTrendChart rangeCompare />
 */
export function DepartmentPeriodRangeSummarySkeleton({
  showTrendChart = false,
  rangeCompare = false,
  className,
}: DepartmentPeriodRangeSummarySkeletonProps) {
  return (
    <div className={cn('space-y-6', className)} role="status" aria-busy="true">
      <span className="sr-only">Cargando el resumen del departamento…</span>

      {/* Hero: context strip + department name and overall average. */}
      <section className="divide-border border-border bg-background divide-y overflow-hidden rounded-md border">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-3">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Skeleton className="size-4 shrink-0 rounded-sm" />
            <Skeleton className="h-2.5 w-32" />
            <Skeleton className="h-5 w-20 rounded-4xl" />
          </div>

          <Skeleton className="h-8 w-44" />
        </div>

        <div className="flex flex-wrap items-end justify-between gap-6 p-6">
          <div className="min-w-0 space-y-2">
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="h-7 w-64 sm:h-8 sm:w-80" />
          </div>

          <div className="flex flex-col items-end gap-2">
            <Skeleton className="h-2.5 w-28" />
            <Skeleton className="h-11 w-28" />
          </div>
        </div>
      </section>

      {showTrendChart && (
        <Panel titleWidth="w-56">
          <ChartFrame>
            <Plot>
              <div
                aria-hidden="true"
                className="border-border/60 absolute inset-x-0 top-1/3 border-t border-dashed"
              />

              {TREND_POINTS.map((point, index) => (
                <div key={index} className="flex h-full flex-1 items-end justify-center">
                  <div className="flex justify-center" style={{ height: `${point}%` }}>
                    <Skeleton className="size-2.5 rounded-full" />
                  </div>
                </div>
              ))}
            </Plot>

            <AxisLabels count={TREND_POINTS.length} />
          </ChartFrame>
        </Panel>
      )}

      {/* Comments: two columns, one per classification. */}
      <section className="border-border bg-background rounded-md border">
        <div className="border-border flex flex-wrap items-start justify-between gap-3 border-b px-6 py-4">
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-56" />
            <Skeleton className="h-2.5 w-72 sm:w-[26rem]" />
            <Skeleton className="h-2.5 w-40" />
          </div>

          {!rangeCompare && (
            <div className="border-border inline-flex shrink-0 gap-0.5 rounded-md border p-0.5">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-20" />
            </div>
          )}
        </div>

        <div className="divide-border grid divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <div className="px-6 py-4">
            <Skeleton className="mb-3 h-2.5 w-28" />

            {rangeCompare ? (
              <>
                <Chips widths={RISK_CHIPS} />
                <Skeleton className="mt-4 h-56 w-full rounded-md" />
              </>
            ) : (
              <>
                <Skeleton className="mb-3 h-2.5 w-56" />

                <ChartFrame>
                  <Plot>
                    <Bars heights={RISK_BARS} />
                  </Plot>

                  <AxisLabels count={RISK_BARS.length} />
                </ChartFrame>
              </>
            )}
          </div>

          <div className="px-6 py-4">
            <Skeleton className="mb-3 h-2.5 w-36" />

            {rangeCompare ? (
              <>
                <Chips widths={CATEGORY_CHIPS} />
                <Skeleton className="mt-4 h-56 w-full rounded-md" />
              </>
            ) : (
              <ChartFrame>
                <Plot>
                  <Bars heights={CATEGORY_BARS} />
                </Plot>

                <AxisLabels count={CATEGORY_BARS.length} />
              </ChartFrame>
            )}
          </div>
        </div>
      </section>

      {/* Dimensions: one horizontal chart, or a small chart per dimension in range mode. */}
      <Panel titleWidth="w-64" subtitleWidth={rangeCompare ? 'w-56' : undefined}>
        {rangeCompare ? (
          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            {DIMENSION_SLOTS.map((slot) => (
              <Skeleton key={slot} className="h-56 w-full rounded-md" />
            ))}
          </div>
        ) : (
          <div className="flex h-64 flex-col justify-center gap-6 pt-6">
            {DIMENSION_BARS.map((width, index) => (
              <div key={index} className="flex items-center gap-4">
                <Skeleton className="h-2.5 w-24 shrink-0 sm:w-28" />

                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Skeleton className={cn('h-6 rounded-sm', width)} />
                  <Skeleton className="h-2.5 w-8 shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}

/** Bordered card with a hairline header, matching the report's real sections. */
function Panel({
  titleWidth,
  subtitleWidth,
  children,
}: {
  titleWidth: string
  subtitleWidth?: string
  children: React.ReactNode
}) {
  return (
    <section className="border-border bg-background rounded-md border">
      <div className="border-border border-b px-6 py-4">
        <Skeleton className={cn('h-3.5', titleWidth)} />

        {subtitleWidth && <Skeleton className={cn('mt-2 h-2.5', subtitleWidth)} />}
      </div>

      <div className="px-6 py-4">{children}</div>
    </section>
  )
}

/** Chart box the size of the real one (`h-64` including its `pt-6`), with fake y-axis ticks. */
function ChartFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-64 gap-4 pt-6">
      <div className="flex h-52 w-8 shrink-0 flex-col justify-between">
        {[0, 1, 2, 3, 4].map((tick) => (
          <Skeleton key={tick} className="h-2 w-full" />
        ))}
      </div>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

/** Plot area of a `ChartFrame`, sitting on the fake x axis. */
function Plot({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-border/60 relative flex h-52 items-end gap-3 border-b">{children}</div>
  )
}

function Bars({ heights }: { heights: number[] }) {
  return (
    <>
      {heights.map((height, index) => (
        <div key={index} className="flex h-full flex-1 items-end justify-center">
          <Skeleton
            className="w-full max-w-12 rounded-t-sm rounded-b-none"
            style={{ height: `${height}%` }}
          />
        </div>
      ))}
    </>
  )
}

function AxisLabels({ count }: { count: number }) {
  return (
    <div className="flex gap-3 pt-2">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex flex-1 justify-center">
          <Skeleton className="h-2.5 w-full max-w-16" />
        </div>
      ))}
    </div>
  )
}

/** Single-select pill group of the per-period breakdowns, which render before their charts. */
function Chips({ widths }: { widths: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {widths.map((width, index) => (
        <Skeleton key={index} className={cn('h-6 rounded-full', width)} />
      ))}
    </div>
  )
}
