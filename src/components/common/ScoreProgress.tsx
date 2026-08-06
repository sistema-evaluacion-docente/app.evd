import { Progress } from '@/components/ui/progress'
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
 * evaluation question's rating or a dimension average. Wraps the shadcn
 * `Progress` primitive with score-oriented defaults (a `bg-primary` fill on
 * a muted track) while staying fully variant-driven for tone and size, so
 * it can be dropped in anywhere a score needs a visual bar.
 *
 * @example
 * <ScoreProgress value={question.score} label={question.text} />
 *
 * @example
 * <ScoreProgress value={dimension.average} tone="auto" size="md" />
 *
 * @example
 * <ScoreProgress value={82} max={100} tone="success" size="xs" className="w-32" />
 */
export function ScoreProgress({
  value,
  max = 5,
  tone = 'primary',
  size = 'sm',
  label,
  className,
}: ScoreProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  const indicatorClass = TONE_INDICATOR_CLASS[tone === 'auto' ? getScoreTone(value) : tone]

  return (
    <Progress
      value={percentage}
      aria-label={label}
      aria-valuetext={`${value.toFixed(1)} de ${max}`}
      className={cn(
        '**:data-[slot=progress-track]:bg-muted',
        SIZE_CLASS[size],
        indicatorClass,
        className,
      )}
    />
  )
}
