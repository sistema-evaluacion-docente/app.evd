import { toPercent } from '@/lib/formatPercent'
import { cn } from '@/lib/utils'

export interface PercentMeterProps {
  /** Score as a 0–1 ratio or a 0–100 value; both are normalized. */
  value?: number | null
  /** What the percentage measures — used for the accessible label. */
  label: string
  /** Fill color (hex or CSS var). Defaults to `currentColor`. */
  color?: string
  /** Render the hairline track next to the number. Defaults to `true`. */
  showBar?: boolean
  /** Track width. Defaults to `w-8`. */
  barClassName?: string
  className?: string
}

/**
 * Inline percentage readout: the number in tabular figures plus a short
 * hairline meter, so a confidence or intensity score can sit in a dense meta
 * line without turning into a chart. Renders nothing when there is no value.
 *
 * @example
 * <PercentMeter value={comment.risk_score} label="Probabilidad de acierto del riesgo" />
 *
 * @example
 * <PercentMeter value={0.82} label="Probabilidad de acierto" showBar={false} />
 */
export function PercentMeter({
  value,
  label,
  color,
  showBar = true,
  barClassName,
  className,
}: PercentMeterProps) {
  const percent = toPercent(value)

  if (percent == null) return null

  return (
    <span
      className={cn('inline-flex items-center gap-1.5', className)}
      role="img"
      aria-label={`${label}: ${percent}%`}
      title={`${label}: ${percent}%`}
    >
      <span className="num text-xs tabular-nums">{percent}%</span>

      {showBar && (
        <span
          aria-hidden="true"
          className={cn('bg-muted h-1 w-8 shrink-0 overflow-hidden rounded-full', barClassName)}
        >
          <span
            className="block h-full rounded-full"
            style={{ width: `${percent}%`, backgroundColor: color ?? 'currentColor' }}
          />
        </span>
      )}
    </span>
  )
}
