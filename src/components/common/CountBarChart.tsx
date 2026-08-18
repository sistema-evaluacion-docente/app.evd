import { TrendingDown, TrendingUp } from 'lucide-react'

import { computeCountDeltas, isRelevantDelta } from '@/lib/countDelta'
import { cn } from '@/lib/utils'

/** One segment of the bar: a stable key, its label, count, and an optional fixed color. */
export interface CountBarChartEntry {
  key: string
  label: string
  value: number
  color?: string
  /** Same metric from a comparison period, if any — enables a delta indicator in the legend. */
  previousValue?: number
}

export interface CountBarChartProps {
  entries: CountBarChartEntry[]
  /** Legend below the bar with the exact count and percentage per segment. Defaults to `true`. */
  showLegend?: boolean
  emptyMessage?: string
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

/** Below this width the percentage text wouldn't fit without overflowing its segment. */
const MIN_LABEL_PERCENT = 10

/**
 * A count breakdown as a single 100%-stacked horizontal bar, with the
 * percentage printed inside each segment wide enough to hold it — the `bar`
 * counterpart of `CountPieChart`, same `entries` shape, so a toggle can swap
 * between the two without recomputing anything. When every entry carries a
 * `previousValue`, the legend also shows a percentage-point delta against
 * that comparison period.
 *
 * @example
 * <CountBarChart entries={[{ key: 'BAJO', label: 'Bajo', value: 12, color: '#22c55e' }]} />
 */
export function CountBarChart({
  entries,
  showLegend = true,
  emptyMessage = 'No hay datos suficientes para graficar.',
  className,
}: CountBarChartProps) {
  const total = entries.reduce((sum, entry) => sum + entry.value, 0)

  if (total === 0) {
    return (
      <p className={cn('text-muted-foreground py-6 text-center text-sm', className)}>
        {emptyMessage}
      </p>
    )
  }

  const deltas = computeCountDeltas(entries)
  const deltaByKey = new Map(entries.map((entry, index) => [entry.key, deltas[index]]))
  const visible = entries.filter((entry) => entry.value > 0)

  return (
    <div className={className}>
      <div
        className="flex h-8 w-full gap-0.5 overflow-hidden rounded-md"
        role="img"
        aria-label={visible
          .map(
            (entry) =>
              `${entry.label}: ${entry.value} (${Math.round((entry.value / total) * 100)}%)`,
          )
          .join(', ')}
      >
        {visible.map((entry, index) => {
          const percent = (entry.value / total) * 100

          return (
            <div
              key={entry.key}
              className="flex h-full items-center justify-center"
              style={{
                width: `${percent}%`,
                backgroundColor: entry.color ?? PALETTE[index % PALETTE.length],
              }}
            >
              {percent >= MIN_LABEL_PERCENT && (
                <span className="text-xs font-semibold text-white">{Math.round(percent)}%</span>
              )}
            </div>
          )
        })}
      </div>

      {showLegend && (
        <div className="mt-2 flex flex-col gap-1">
          {visible.map((entry, index) => {
            const delta = deltaByKey.get(entry.key)
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
