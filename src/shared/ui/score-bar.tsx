import { cn } from '@/shared/lib/utils'

export interface ScoreBarProps {
  /** Score on a 0–100 scale. */
  score: number
  threshold?: number
  width?: number | string
}

/** Numeric score with a colored progress bar (green / amber / red by threshold). */
export function ScoreBar({ score, threshold = 70, width = 120 }: ScoreBarProps) {
  const pct = Math.max(0, Math.min(100, score))
  let color = 'bg-emerald-500'
  if (score < threshold) color = 'bg-brand-600'
  else if (score < threshold + 10) color = 'bg-amber-500'

  return (
    <div className="flex items-center gap-3">
      <span className="num w-10 text-[13px] font-medium tabular-nums text-ink-900">
        {score.toFixed(1)}
      </span>
      <div
        className="h-[6px] overflow-hidden rounded-full bg-ink-100"
        style={{ width }}
      >
        <div
          className={cn('h-full rounded-full transition-all', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
