import { useState } from 'react'

import { getScoreToneBgClass } from '@/lib/scoreTone'
import { cn } from '@/lib/utils'

/** One bar of a ranked comparison: a faculty, a department… */
export interface RankedBarItem {
  /** Stable identity, handed back to `onItemClick`. */
  key: string
  label: string
  /** Score to draw. Items without one are left out of the bars and only counted. */
  value: number | null | undefined
}

export interface RankedBarChartProps {
  items: RankedBarItem[]
  /** Top of the scale the bars are drawn against. Defaults to 5. */
  max?: number
  /** Dashed marker across every bar, e.g. the faculty average. */
  referenceValue?: number
  referenceLabel?: string
  /** How many bars show before "Ver todos". Defaults to 10. */
  initialVisible?: number
  /** Makes every bar a button — e.g. to open the faculty or department it stands for. */
  onItemClick?: (key: string) => void
  /** Noun used for the "sin promedio" note. Defaults to "elementos". */
  itemsLabel?: string
  emptyMessage?: string
  className?: string
}

/**
 * Horizontal bars for comparing many entities at once, best first. Made for
 * lists that outgrow a normal chart (dozens of departments): full names on
 * the left instead of clipped axis ticks, only the top `initialVisible` shown
 * until the reader asks for all, and a scrollable body once expanded. Bars are
 * colored by the same score semaphore as `ScoreBadge`. Purely presentational —
 * it receives already-shaped items and owns no query.
 *
 * @example
 * <RankedBarChart
 *   items={departments.map((d) => ({ key: String(d.id), label: d.name, value: d.average }))}
 *   referenceValue={facultyAverage}
 *   referenceLabel="Promedio de la facultad"
 *   onItemClick={(key) => navigate(`/departamentos/${key}`)}
 * />
 */
export function RankedBarChart({
  items,
  max = 5,
  referenceValue,
  referenceLabel,
  initialVisible = 10,
  onItemClick,
  itemsLabel = 'elementos',
  emptyMessage = 'No hay datos para comparar.',
  className,
}: RankedBarChartProps) {
  const [expanded, setExpanded] = useState(false)

  const scored = items
    .filter((item): item is RankedBarItem & { value: number } => item.value != null)
    .sort((a, b) => b.value - a.value)
  const withoutValue = items.length - scored.length

  if (scored.length === 0) {
    return (
      <p className={cn('text-muted-foreground py-10 text-center text-sm', className)}>
        {emptyMessage}
      </p>
    )
  }

  const canExpand = scored.length > initialVisible
  const visible = expanded ? scored : scored.slice(0, initialVisible)
  const percentOf = (value: number) => `${Math.min(100, Math.max(0, (value / max) * 100))}%`

  return (
    <div className={cn('space-y-3', className)}>
      {referenceValue != null && (
        <p className="text-muted-foreground flex items-center gap-2 text-xs">
          <span aria-hidden="true" className="bg-foreground/70 h-3 w-px" />
          {referenceLabel ?? 'Referencia'}: {referenceValue.toFixed(2)}
        </p>
      )}

      <ul className={cn('space-y-0.5', expanded && scored.length > 20 && 'max-h-112 overflow-y-auto pr-1')}>
        {visible.map((item) => {
          const row = (
            <>
              <span
                title={item.label}
                className="text-foreground group-hover:text-brand-700 dark:group-hover:text-brand-200 min-w-0 truncate text-sm transition-colors"
              >
                {item.label}
              </span>

              <span className="relative block h-2.5">
                <span className="bg-muted absolute inset-0 overflow-hidden rounded-full">
                  <span
                    className={cn(
                      'absolute inset-y-0 left-0 rounded-full',
                      getScoreToneBgClass(item.value),
                    )}
                    style={{ width: percentOf(item.value) }}
                  />
                </span>

                {referenceValue != null && (
                  <span
                    aria-hidden="true"
                    className="bg-foreground/70 absolute -inset-y-1 w-px"
                    style={{ left: percentOf(referenceValue) }}
                  />
                )}
              </span>

              <span className="text-foreground text-right text-sm font-semibold tabular-nums">
                {item.value.toFixed(2)}
              </span>
            </>
          )

          const layout =
            'grid grid-cols-[minmax(7rem,35%)_1fr_3rem] items-center gap-3 rounded-md px-3 py-2'

          return (
            <li key={item.key}>
              {onItemClick ? (
                <button
                  type="button"
                  onClick={() => onItemClick(item.key)}
                  className={cn(
                    layout,
                    'group hover:bg-brand-50 dark:hover:bg-brand-900/20 focus-visible:bg-brand-50 w-full text-left outline-none transition-colors',
                  )}
                >
                  {row}
                </button>
              ) : (
                <div className={cn(layout, 'group')}>{row}</div>
              )}

            </li>
          )
        })}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs">
          {withoutValue > 0
            ? `${withoutValue} ${itemsLabel} sin promedio en este periodo, no incluidos.`
            : `${scored.length} ${itemsLabel} comparados.`}
        </p>

        {canExpand && (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="text-brand-600 hover:text-brand-700 cursor-pointer text-xs font-medium transition-colors"
          >
            {expanded ? 'Ver menos' : `Ver todos (${scored.length})`}
          </button>
        )}
      </div>
    </div>
  )
}
