import { cn } from '@/lib/utils'

type ScoreBadgeTone = 'auto' | 'success' | 'warning' | 'danger' | 'neutral'

export interface ScoreBadgeProps {
  /** Score to display, or null to render the placeholder. */
  value: number | null
  /** Maximum possible score, shown after the slash. Defaults to 5. */
  max?: number
  /** Number of decimals for both the value and the max. Defaults to 1. */
  decimals?: number
  /**
   * Color scheme. `auto` picks a tone from the value thresholds; the other
   * options force a fixed tone. Defaults to `auto`.
   */
  tone?: ScoreBadgeTone
  /** Above this value the `auto` tone turns success. Defaults to 3.6. */
  successMin?: number
  /** Below this value the `auto` tone turns danger. Defaults to 3. */
  dangerMax?: number
  /** Placeholder rendered when value is null. Defaults to "—". */
  placeholder?: string
  /** Extra classes merged onto the score text to override styling. */
  className?: string
}

const TONE_CLASS: Record<Exclude<ScoreBadgeTone, 'auto'>, string> = {
  success: 'text-green-500',
  warning: 'text-amber-500',
  danger: 'text-red-500',
  neutral: 'text-foreground',
}

/**
 * Displays a score as "2.8 / 5.0" with automatic or fixed coloring, with a
 * muted placeholder for missing values. The `auto` tone colors the score by
 * value: danger below `dangerMax` (3), warning in between, success above
 * `successMin` (3.6).
 *
 * @example
 * <ScoreBadge value={2.8} />
 * <ScoreBadge value={3.4} tone="warning" />
 * <ScoreBadge value={92.5} max={100} decimals={1} tone="success" />
 * <ScoreBadge value={null} placeholder="Sin nota" />
 */
export function ScoreBadge({
  value,
  max = 5,
  decimals = 1,
  tone = 'auto',
  successMin = 3.6,
  dangerMax = 3,
  placeholder = '—',
  className,
}: ScoreBadgeProps) {
  if (value == null) {
    return <span className={cn('text-muted-foreground text-sm', className)}>{placeholder}</span>
  }

  const toneClass =
    tone !== 'auto'
      ? TONE_CLASS[tone]
      : value > successMin
        ? TONE_CLASS.success
        : value < dangerMax
          ? TONE_CLASS.danger
          : TONE_CLASS.warning

  return (
    <span className={cn('text-sm font-semibold tabular-nums', toneClass, className)}>
      {value.toFixed(decimals)}
      <span className="text-muted-foreground font-medium"> / {max.toFixed(decimals)}</span>
    </span>
  )
}
