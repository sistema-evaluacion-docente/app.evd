import type { ReactNode } from 'react'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { getScoreTone } from '@/lib/scoreTone'
import { cn } from '@/lib/utils'

type ScoreProgressTone = 'primary' | 'auto' | 'success' | 'warning' | 'danger' | 'neutral'
type ScoreProgressSize = 'xs' | 'sm' | 'md'

export interface ScoreProgressProps {
  /** Current score, on a 0–`max` scale. */
  value: number
  /** Maximum possible score. Defaults to 5. */
  max?: number
  /**
   * Fill color. `primary` uses the brand color, `auto` color-codes the fill
   * by value (danger/warning/success, same thresholds as `ScoreBadge`), or
   * force one of the fixed tones. Defaults to `primary`.
   */
  tone?: ScoreProgressTone
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
  /** Extra classes merged onto the root element (e.g. width, margin). */
  className?: string
}

/** Track height, keyed through the shadcn `Progress` primitive's internal track slot. */
const SIZE_CLASS: Record<ScoreProgressSize, string> = {
  xs: '**:data-[slot=progress-track]:h-0.5',
  sm: '**:data-[slot=progress-track]:h-1',
  md: '**:data-[slot=progress-track]:h-1.5',
}

/** Fill color, keyed through the shadcn `Progress` primitive's internal indicator slot. */
const TONE_INDICATOR_CLASS: Record<Exclude<ScoreProgressTone, 'auto'>, string> = {
  primary: '**:data-[slot=progress-indicator]:bg-primary',
  success: '**:data-[slot=progress-indicator]:bg-green-500',
  warning: '**:data-[slot=progress-indicator]:bg-amber-500',
  danger: '**:data-[slot=progress-indicator]:bg-red-500',
  neutral: '**:data-[slot=progress-indicator]:bg-foreground',
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
 */
export function ScoreProgress({
  value,
  max = 5,
  tone = 'primary',
  size = 'sm',
  label,
  decimals = 2,
  showTooltip = true,
  tooltipContent,
  interactive = true,
  detailsTitle,
  details,
  className,
}: ScoreProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  const percentLabel = `${Math.round(percentage)}%`
  const scoreLabel = `${value.toFixed(decimals)} de ${max}`
  const indicatorClass = TONE_INDICATOR_CLASS[tone === 'auto' ? getScoreTone(value) : tone]

  const bar = (
    <Progress
      value={percentage}
      aria-label={label}
      aria-valuetext={`${scoreLabel} (${percentLabel})`}
      className={cn(
        '**:data-[slot=progress-track]:bg-[#aaa]',
        SIZE_CLASS[size],
        indicatorClass,
        className,
      )}
    />
  )

  if (!showTooltip && !interactive) return bar

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
    return (
      <TooltipProvider delay={150}>
        <Tooltip>
          <TooltipTrigger render={triggerElement}>{bar}</TooltipTrigger>
          {tooltip}
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
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
        </div>

        {details && <div className="px-4 py-3 text-xs leading-relaxed">{details}</div>}
      </PopoverContent>
    </Popover>
  )
}
