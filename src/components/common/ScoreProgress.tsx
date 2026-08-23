import type { CSSProperties, ReactNode } from 'react'

import { Minus, TrendingDown, TrendingUp } from 'lucide-react'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { getScoreTone, SCORE_TONE_BG_CLASS } from '@/lib/scoreTone'
import { TREND_TEXT_CLASS } from '@/lib/trendTone'
import { cn } from '@/lib/utils'

type ScoreProgressTone = 'primary' | 'auto' | 'success' | 'warning' | 'danger' | 'neutral'
type ScoreProgressSize = 'xs' | 'sm' | 'md'
type ScoreTrendDirection = 'up' | 'down' | 'flat'

export interface ScoreProgressProps {
  /** Current score, on a 0–`max` scale. */
  value: number
  /** Maximum possible score. Defaults to 5. */
  max?: number
  /**
   * Fill color. `primary` uses the brand color, `auto` color-codes the fill
   * by value (danger/warning/success, same thresholds as `ScoreBadge`), or
   * force one of the fixed tones. Defaults to `primary`. Ignored when `color`
   * is set.
   */
  tone?: ScoreProgressTone
  /**
   * Raw CSS color (hex, `var(...)`, etc.) overriding `tone` entirely — for
   * identity-coded bars (e.g. one color per teacher in a comparison), where
   * the color isn't one of the fixed semantic tones.
   */
  color?: string
  /** Track height. Defaults to `sm`. */
  size?: ScoreProgressSize
  /** Accessible label describing what this progress represents (e.g. the question text). */
  label?: string
  /** Decimals used for the score. Defaults to 2. */
  decimals?: number
  /** Hover/focus tooltip with the percentage. Defaults to `true`. */
  showTooltip?: boolean
  /** Override the tooltip body entirely. */
  tooltipContent?: ReactNode
  /** Click opens a popover with the breakdown. Defaults to `true`. */
  interactive?: boolean
  /** Heading of the popover; defaults to `label`. */
  detailsTitle?: string
  /** Extra content appended inside the popover (comparisons, history, actions…). */
  details?: ReactNode
  /**
   * Score from an earlier point in time (e.g. the previous semester), on the
   * same 0–`max` scale, to compare the current `value` against. When given,
   * a compact growth/decrease indicator renders next to the bar and the
   * breakdown popover gets a comparison line.
   */
  previousValue?: number
  /** Label naming what `previousValue` represents. Defaults to `'periodo anterior'`. */
  previousLabel?: string
  /**
   * Show the inline trend indicator next to the bar. Set to `false` to keep
   * the comparison in the popover only. Has no effect without `previousValue`.
   * Defaults to `true`.
   */
  showTrend?: boolean
  /** Extra classes merged onto the root element (e.g. width, margin). */
  className?: string
}

/** Track height, keyed through the shadcn `Progress` primitive's internal track slot. */
const SIZE_CLASS: Record<ScoreProgressSize, string> = {
  xs: '**:data-[slot=progress-track]:h-0.5',
  sm: '**:data-[slot=progress-track]:h-1',
  md: '**:data-[slot=progress-track]:h-1.5',
}

/** Reaches the fill through the shadcn `Progress` primitive's internal slot. */
const INDICATOR = '**:data-[slot=progress-indicator]:'

/**
 * Fill color. The three semaphore tones are read off `scoreTone` rather than
 * written out again: the bar and the number above it are the same reading, and
 * they used to be two copies of the palette free to drift apart.
 */
const TONE_INDICATOR_CLASS: Record<Exclude<ScoreProgressTone, 'auto'>, string> = {
  primary: `${INDICATOR}bg-primary`,
  success: `${INDICATOR}${SCORE_TONE_BG_CLASS.success}`,
  warning: `${INDICATOR}${SCORE_TONE_BG_CLASS.warning}`,
  danger: `${INDICATOR}${SCORE_TONE_BG_CLASS.danger}`,
  neutral: `${INDICATOR}bg-foreground`,
}

const TREND_ICON: Record<ScoreTrendDirection, typeof TrendingUp> = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
}

const TREND_WORD: Record<ScoreTrendDirection, string> = {
  up: 'aumentó',
  down: 'disminuyó',
  flat: 'se mantuvo igual',
}

/**
 * Thin horizontal progress bar for a score out of a maximum — e.g. an
 * evaluation question's rating or a dimension average. Hovering (or focusing)
 * shows the score and its percentage; clicking opens a popover with the
 * breakdown, plus whatever extra content the caller passes in `details`.
 *
 * Both layers are opt-out: `showTooltip={false}` / `interactive={false}` give
 * back the plain decorative bar.
 *
 * Passing `previousValue` (e.g. the same metric from the previous semester)
 * adds a compact trend indicator next to the bar and a comparison line in the
 * popover, so growth or decrease against that baseline is visible at a
 * glance without owning any fetching or business logic itself.
 *
 * @example
 * <ScoreProgress value={question.score} label={question.text} />
 *
 * @example
 * <ScoreProgress value={dimension.average} tone="auto" size="md" />
 *
 * @example
 * <ScoreProgress
 *   value={82}
 *   max={100}
 *   interactive={false}
 *   showTooltip={false}
 *   className="w-32"
 * />
 *
 * @example
 * <ScoreProgress
 *   value={teacher.overall_average}
 *   previousValue={teacher.previous_overall_average}
 *   previousLabel="semestre anterior"
 *   tone="auto"
 * />
 *
 * @example
 * // Identity-coded bar (e.g. one color per teacher in a comparison) — `color` overrides `tone`.
 * <ScoreProgress value={entry.average} color={teacherColor} label={entry.teacher_name} />
 */
export function ScoreProgress({
  value,
  max = 5,
  tone = 'primary',
  color,
  size = 'sm',
  label,
  decimals = 2,
  showTooltip = true,
  tooltipContent,
  interactive = true,
  detailsTitle,
  details,
  previousValue,
  previousLabel = 'periodo anterior',
  showTrend = true,
  className,
}: ScoreProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  const percentLabel = `${Math.round(percentage)}%`
  const scoreLabel = `${value.toFixed(decimals)} de ${max}`
  const indicatorClass = color
    ? '**:data-[slot=progress-indicator]:bg-(--score-color)'
    : TONE_INDICATOR_CLASS[tone === 'auto' ? getScoreTone(value) : tone]
  const indicatorStyle = color ? ({ '--score-color': color } as CSSProperties) : undefined

  /** Narrowed once so every later check is a plain `!= null` the compiler can track. */
  const comparisonValue =
    previousValue != null && Number.isFinite(previousValue) ? previousValue : null
  const delta = comparisonValue != null ? Number((value - comparisonValue).toFixed(decimals)) : null
  const trend: ScoreTrendDirection = !delta ? 'flat' : delta > 0 ? 'up' : 'down'
  const TrendIcon = TREND_ICON[trend]
  const percentChange =
    comparisonValue != null && comparisonValue !== 0
      ? ((value - comparisonValue) / comparisonValue) * 100
      : null
  /** No point flagging a trend when the score didn't actually move. */
  const showTrendBadge = comparisonValue != null && showTrend && delta !== 0

  /** Appends the trend indicator next to whichever bar/tooltip/popover variant is rendered below. */
  const withTrend = (node: ReactNode) => {
    if (!showTrendBadge) return node

    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="min-w-0 flex-1">{node}</div>
        <ScoreTrendBadge
          trend={trend}
          delta={delta ?? 0}
          percentChange={percentChange}
          previousValue={comparisonValue}
          previousLabel={previousLabel}
          decimals={decimals}
          max={max}
          showTooltip={showTooltip}
        />
      </div>
    )
  }

  const bar = (
    <Progress
      value={percentage}
      aria-label={label}
      aria-valuetext={`${scoreLabel} (${percentLabel})`}
      style={indicatorStyle}
      className={cn(
        'min-w-15 **:data-[slot=progress-track]:bg-[#aaa]',
        SIZE_CLASS[size],
        indicatorClass,
        !showTrendBadge && className,
      )}
    />
  )

  if (!showTooltip && !interactive) return withTrend(bar)

  /** The bar becomes a real control: focusable, labelled, with a hit area taller than the track. */
  const triggerElement = (
    <button
      type="button"
      aria-label={label ? `${label}: ${scoreLabel}` : scoreLabel}
      className={cn(
        'focus-visible:ring-ring/50 block w-full rounded-sm py-1.5 focus-visible:ring-2 focus-visible:outline-none',
        interactive && 'cursor-pointer',
      )}
    />
  )

  const tooltip = (
    <TooltipContent>
      {tooltipContent ?? (
        <span className="num tabular-nums">
          {value.toFixed(decimals)} / {max} · {percentLabel}
        </span>
      )}
    </TooltipContent>
  )

  if (!interactive) {
    return withTrend(
      <TooltipProvider delay={150}>
        <Tooltip>
          <TooltipTrigger render={triggerElement}>{bar}</TooltipTrigger>
          {tooltip}
        </Tooltip>
      </TooltipProvider>,
    )
  }

  return withTrend(
    <Popover>
      {showTooltip ? (
        <TooltipProvider delay={150}>
          <Tooltip>
            <PopoverTrigger render={<TooltipTrigger render={triggerElement} />}>
              {bar}
            </PopoverTrigger>
            {tooltip}
          </Tooltip>
        </TooltipProvider>
      ) : (
        <PopoverTrigger render={triggerElement}>{bar}</PopoverTrigger>
      )}

      <PopoverContent align="start" className="w-72 gap-0 p-0">
        <div className="border-border border-b px-4 py-3">
          {(detailsTitle || label) && (
            <p className="text-muted-foreground text-xs leading-relaxed font-medium">
              {detailsTitle ?? label}
            </p>
          )}

          <p className="mt-2 flex items-baseline gap-2">
            <span className="num text-2xl leading-none font-bold tabular-nums">
              {value.toFixed(decimals)}
            </span>

            <span className="text-muted-foreground text-xs tracking-wide uppercase">de {max}</span>

            <span className="num text-muted-foreground ml-auto text-sm tabular-nums">
              {percentLabel}
            </span>
          </p>

          <div className="mt-3">
            <ScoreProgress
              value={value}
              max={max}
              tone={tone}
              size="md"
              showTooltip={false}
              interactive={false}
            />
          </div>

          {comparisonValue != null && (
            <p className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
              <span className="capitalize">{previousLabel}:</span>
              <span className="num tabular-nums">{comparisonValue.toFixed(decimals)}</span>

              {delta !== 0 && (
                <span
                  className={cn(
                    'num ml-auto inline-flex items-center gap-0.5 font-semibold tabular-nums',
                    TREND_TEXT_CLASS[trend],
                    // Dimmer than the same arrow on `ScoreBadge`: here it sits
                    // beside the bar rather than in place of it.
                    trend !== 'flat' && 'opacity-70',
                  )}
                >
                  <TrendIcon className="size-3 shrink-0" aria-hidden="true" />
                  {delta && delta > 0 ? '+' : ''}
                  {(delta ?? 0).toFixed(decimals)}
                  {percentChange != null &&
                    ` (${percentChange > 0 ? '+' : ''}${percentChange.toFixed(0)}%)`}
                </span>
              )}
            </p>
          )}
        </div>

        {details && <div className="px-4 py-3 text-xs leading-relaxed">{details}</div>}
      </PopoverContent>
    </Popover>,
  )
}

interface ScoreTrendBadgeProps {
  trend: ScoreTrendDirection
  delta: number
  percentChange: number | null
  previousValue: number
  previousLabel: string
  decimals: number
  max: number
  showTooltip: boolean
}

/** Compact icon + signed delta, e.g. `▲ +0.30`, shown next to the bar when a `previousValue` is given. */
function ScoreTrendBadge({
  trend,
  delta,
  percentChange,
  previousValue,
  previousLabel,
  decimals,
  max,
  showTooltip,
}: ScoreTrendBadgeProps) {
  const Icon = TREND_ICON[trend]
  const sign = delta > 0 ? '+' : ''
  const deltaLabel = `${sign}${delta.toFixed(decimals)}`

  const badge = (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold tabular-nums',
        TREND_TEXT_CLASS[trend],
        trend !== 'flat' && 'opacity-70',
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      {deltaLabel}
    </span>
  )

  if (!showTooltip) return badge

  return (
    <TooltipProvider delay={150}>
      <Tooltip>
        <TooltipTrigger
          render={
            <span
              tabIndex={0}
              aria-label={`El puntaje ${TREND_WORD[trend]} ${Math.abs(delta).toFixed(decimals)} puntos respecto al ${previousLabel}`}
              className="focus-visible:ring-ring/50 rounded-sm focus-visible:ring-2 focus-visible:outline-none"
            />
          }
        >
          {badge}
        </TooltipTrigger>

        <TooltipContent>
          <span className="num tabular-nums">
            {previousLabel}: {previousValue.toFixed(decimals)} / {max}
            {percentChange != null &&
              ` · ${percentChange > 0 ? '+' : ''}${percentChange.toFixed(0)}%`}
          </span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
