import { Minus, TrendingDown, TrendingUp } from 'lucide-react'

import { getScoreTone } from '@/lib/scoreTone'
import { cn } from '@/lib/utils'

type ScoreBadgeTone = 'auto' | 'success' | 'warning' | 'danger' | 'neutral'
type ScoreTrendDirection = 'up' | 'down' | 'flat'

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
  /**
   * Score from an earlier point in time (e.g. the previous semester), on the
   * same scale as `value`, to compare against. When given (and `value` isn't
   * null), a compact growth/decrease indicator renders next to the score.
   */
  previousValue?: number
  /** Label naming what `previousValue` represents, used in the accessible description. Defaults to `'periodo anterior'`. */
  previousLabel?: string
  /**
   * Show the inline trend indicator. Set to `false` to compute nothing extra
   * and render just the score. Has no effect without `previousValue`.
   * Defaults to `true`.
   */
  showTrend?: boolean
}

const TONE_CLASS: Record<Exclude<ScoreBadgeTone, 'auto'>, string> = {
  success: 'text-green-500',
  warning: 'text-amber-500',
  danger: 'text-red-500',
  neutral: 'text-foreground',
}

const TREND_ICON: Record<ScoreTrendDirection, typeof TrendingUp> = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
}

const TREND_TEXT_CLASS: Record<ScoreTrendDirection, string> = {
  up: 'text-green-600 dark:text-green-400',
  down: 'text-red-600 dark:text-red-400',
  flat: 'text-muted-foreground',
}

const TREND_WORD: Record<ScoreTrendDirection, string> = {
  up: 'aumentó',
  down: 'disminuyó',
  flat: 'se mantuvo igual',
}

/**
 * Displays a score as "2.8 / 5.0" with automatic or fixed coloring, with a
 * muted placeholder for missing values. The `auto` tone colors the score by
 * value: danger below `dangerMax` (3), warning in between, success above
 * `successMin` (3.6).
 *
 * Passing `previousValue` (e.g. the same metric from the previous semester)
 * adds a compact icon + signed delta next to the score, so growth or
 * decrease against that baseline is visible at a glance — same comparison
 * API as `ScoreProgress`.
 *
 * @example
 * <ScoreBadge value={2.8} />
 * <ScoreBadge value={3.4} tone="warning" />
 * <ScoreBadge value={92.5} max={100} decimals={1} tone="success" />
 * <ScoreBadge value={null} placeholder="Sin nota" />
 *
 * @example
 * <ScoreBadge value={4.2} previousValue={3.9} previousLabel="semestre anterior" />
 */
export function ScoreBadge({
  value,
  decimals = 1,
  tone = 'auto',
  successMin = 3.6,
  dangerMax = 3,
  placeholder = '—',
  className,
  previousValue,
  previousLabel = 'periodo anterior',
  showTrend = true,
}: ScoreBadgeProps) {
  if (value == null) {
    return <span className={cn('text-muted-foreground text-sm', className)}>{placeholder}</span>
  }

  const toneClass =
    tone !== 'auto' ? TONE_CLASS[tone] : TONE_CLASS[getScoreTone(value, { successMin, dangerMax })]

  /** Narrowed once so every later check is a plain `!= null` the compiler can track. */
  const comparisonValue =
    previousValue != null && Number.isFinite(previousValue) ? previousValue : null
  const delta = comparisonValue != null ? Number((value - comparisonValue).toFixed(decimals)) : null
  const trend: ScoreTrendDirection = !delta ? 'flat' : delta > 0 ? 'up' : 'down'
  /** No point flagging a trend when the score didn't actually move. */
  const showTrendBadge = comparisonValue != null && showTrend && delta !== 0

  const score = (
    <span
      className={cn('text-sm font-semibold tabular-nums', toneClass, !showTrendBadge && className)}
    >
      {value.toFixed(decimals)}
    </span>
  )

  if (!showTrendBadge) return score

  const Icon = TREND_ICON[trend]
  const sign = delta && delta > 0 ? '+' : ''

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      {score}

      <span
        aria-label={`El puntaje ${TREND_WORD[trend]} ${Math.abs(delta ?? 0).toFixed(decimals)} puntos respecto al ${previousLabel}`}
        className={cn(
          'inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold tabular-nums',
          TREND_TEXT_CLASS[trend],
        )}
      >
        <Icon className="size-3 shrink-0" aria-hidden="true" />
        {sign}
        {(delta ?? 0).toFixed(decimals)}
      </span>
    </span>
  )
}
