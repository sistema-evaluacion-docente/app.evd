import { CalendarRange } from 'lucide-react'

import { ScoreBadge } from '@/components/common/ScoreBadge'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { FacultyPeriodAverage } from '../types'

export interface FacultyStatsHeroProps {
  /** The faculty's most recent period average — the one the hero highlights. */
  latest: FacultyPeriodAverage
  className?: string
}

/**
 * Flat, typographic hero for a faculty's global average in its most recent
 * evaluated period — same visual language as `DepartmentStatsHero`, one
 * level up: combines every department of the faculty instead of one.
 *
 * @example
 * <FacultyStatsHero latest={averages[averages.length - 1]} />
 */
export function FacultyStatsHero({ latest, className }: FacultyStatsHeroProps) {
  return (
    <section
      className={cn(
        'divide-border border-border bg-background divide-y overflow-hidden rounded-md border',
        className,
      )}
    >
      <div className="bg-brand-50 dark:bg-brand-900/20 flex flex-wrap items-center gap-x-2 gap-y-0.5 px-6 py-3">
        <CalendarRange
          className="text-brand-600 dark:text-brand-300 size-4 shrink-0"
          aria-hidden="true"
        />

        <span className="text-brand-700/80 dark:text-brand-300/80 text-xs font-medium tracking-wide uppercase">
          Periodo evaluado
        </span>

        <Badge className="text-sm font-bold">
          {latest.academic_period_name || latest.academic_period_code}
        </Badge>
      </div>

      <div className="relative flex flex-wrap items-end justify-between gap-6 overflow-hidden p-6">
        <div
          aria-hidden="true"
          className="from-brand-500/10 pointer-events-none absolute -top-24 -right-24 size-56 rounded-full bg-radial to-transparent blur-2xl"
        />

        <div className="relative min-w-0">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Facultad
          </p>

          <h2 className="mt-1 truncate text-2xl font-bold tracking-tight uppercase sm:text-3xl">
            {latest.faculty_name}
          </h2>
        </div>

        <div className="relative text-right">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Promedio general
          </p>

          <ScoreBadge
            value={latest.global_average ?? undefined}
            tone="auto"
            size="5xl"
            decimals={2}
            className="leading-none"
          />
        </div>
      </div>
    </section>
  )
}
