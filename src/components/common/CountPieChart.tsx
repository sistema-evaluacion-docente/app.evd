import { TrendingDown, TrendingUp } from 'lucide-react'
import { Cell, Pie, PieChart } from 'recharts'

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { computeCountDeltas, isRelevantDelta } from '@/lib/countDelta'
import { cn } from '@/lib/utils'

/** One slice of the pie: a stable key, its label, count, and an optional fixed color. */
export interface CountPieChartEntry {
  key: string
  label: string
  value: number
  color?: string
  /** Same metric from a comparison period, if any — enables a delta indicator in the legend. */
  previousValue?: number
}

export interface CountPieChartProps {
  entries: CountPieChartEntry[]
  /** Legend below the donut — color alone isn't enough to read a slice. Defaults to `true`. */
  showLegend?: boolean
  emptyMessage?: string
  chartClassName?: string
  className?: string
}

/** Fallback palette for entries with no explicit `color`, in draw order. */
const PALETTE = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
]

/**
 * A count breakdown as a donut chart — same building blocks
 * (`ChartContainer`/`ChartTooltip`) as `DimensionComparisonChart`, but for a
 * single set of counts drawn as pie slices instead of an axis of scores. The
 * legend (custom, not recharts') doubles as the label — plus, when every
 * entry carries a `previousValue`, a percentage-point delta against that
 * comparison period. Renders `emptyMessage` instead of an ambiguous all-zero
 * donut.
 *
 * @example
 * <CountPieChart entries={[{ key: 'BAJO', label: 'Bajo', value: 12, color: '#22c55e' }]} />
 */
export function CountPieChart({
  entries,
  showLegend = true,
  emptyMessage = 'No hay datos suficientes para graficar.',
  chartClassName,
  className,
}: CountPieChartProps) {
  const hasData = entries.some((entry) => entry.value > 0)

  const chartConfig: ChartConfig = Object.fromEntries(
    entries.map((entry, index) => [
      entry.key,
      { label: entry.label, color: entry.color ?? PALETTE[index % PALETTE.length] },
    ]),
  )

  if (!hasData) {
    return (
      <p className={cn('text-muted-foreground py-6 text-center text-sm', className)}>
        {emptyMessage}
      </p>
    )
  }

  const deltas = computeCountDeltas(entries)

  return (
    <div className={className}>
      <ChartContainer config={chartConfig} className={cn('h-56', chartClassName)}>
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey="key" hideLabel />} />

          <Pie
            data={entries}
            dataKey="value"
            nameKey="key"
            innerRadius="55%"
            outerRadius="80%"
            paddingAngle={2}
            strokeWidth={2}
          >
            {entries.map((entry, index) => (
              <Cell key={entry.key} fill={entry.color ?? PALETTE[index % PALETTE.length]} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>

      {showLegend && (
        <div className="mt-2 flex flex-col gap-1">
          {entries.map((entry, index) => {
            const delta = deltas[index]
            const relevant = isRelevantDelta(delta?.deltaPoints)

            return (
              <span
                key={entry.key}
                className="text-muted-foreground flex items-center gap-1 text-xs"
              >
                <span
                  aria-hidden="true"
                  className="size-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: entry.color ?? PALETTE[index % PALETTE.length] }}
                />
                {entry.label}: {entry.value} ({Math.round(delta?.percent ?? 0)}%)
                {relevant && delta?.deltaPoints != null && (
                  <span
                    className={cn(
                      'flex items-center gap-0.5 font-medium',
                      delta.deltaPoints > 0 ? 'text-emerald-600' : 'text-red-600',
                    )}
                  >
                    {delta.deltaPoints > 0 ? (
                      <TrendingUp className="size-3" aria-hidden="true" />
                    ) : (
                      <TrendingDown className="size-3" aria-hidden="true" />
                    )}
                    {delta.deltaPoints > 0 ? '+' : ''}
                    {delta.deltaPoints.toFixed(1)}%
                  </span>
                )}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
