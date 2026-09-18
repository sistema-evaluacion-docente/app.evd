import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'

import { ScoreBadge } from '@/components/common/ScoreBadge'
import { cn } from '@/lib/utils'

export interface OverviewRowProps {
  /** Glyph shown inside the round badge on the left. */
  icon: ReactNode
  title: string
  subtitle: string
  /** Position in the ranking, shown as `#n`. Omit to hide it. */
  rank?: number
  /** Average to show on the right; the badge is left out when there is none. */
  score?: number | null
  onClick: () => void
  className?: string
}

/**
 * One clickable line of a ranked overview (faculties, departments): rank,
 * icon, name, period and score. Tinted in the brand color with an accent bar
 * and a nudging chevron on hover, so it reads as something to open instead of
 * a flat table row.
 *
 * @example
 * <OverviewRow icon={<Building2 />} title="Ingeniería" subtitle="Periodo 2026-1" rank={1} score={4.2} onClick={open} />
 */
export function OverviewRow({
  icon,
  title,
  subtitle,
  rank,
  score,
  onClick,
  className,
}: OverviewRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group hover:bg-brand-50 dark:hover:bg-brand-900/20 focus-visible:bg-brand-50 dark:focus-visible:bg-brand-900/20 border-l-2 border-transparent hover:border-l-brand-500 focus-visible:border-l-brand-500 flex w-full items-center justify-between gap-4 px-5 py-4 text-left outline-none transition-colors',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-4">
        {rank != null && (
          <span className="text-muted-foreground group-hover:text-brand-600 w-6 shrink-0 text-sm font-semibold tabular-nums">
            #{rank}
          </span>
        )}

        <div className="bg-muted text-muted-foreground group-hover:bg-brand-500/10 group-hover:text-brand-600 flex size-10 shrink-0 items-center justify-center rounded-full transition-colors [&_svg]:size-5">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-foreground group-hover:text-brand-700 dark:group-hover:text-brand-200 truncate font-medium transition-colors">
            {title}
          </p>
          <p className="text-muted-foreground text-xs">{subtitle}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {score != null && <ScoreBadge value={score} tone="auto" size="lg" />}

        <ChevronRight
          className="text-muted-foreground/60 group-hover:text-brand-600 size-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </div>
    </button>
  )
}
