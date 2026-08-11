import { CalendarRange } from 'lucide-react'

import { ScoreBadge } from '@/components/common/ScoreBadge'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { DepartmentPeriodRangeStats } from '../types'

export interface DepartmentStatsHeroProps {
  stats: DepartmentPeriodRangeStats
  className?: string
}

/**
 * Flat, typographic hero for a department's period-range report: a context
 * strip naming the selected range, the overall average as the single large
 * figure, and respondent/evaluation/period counts as hairline-separated
 * columns — same visual language as `EvaluationOverview`/`TeacherOverview`.
 *
 * @example
 * <DepartmentStatsHero stats={stats} />
 */
export function DepartmentStatsHero({ stats, className }: DepartmentStatsHeroProps) {
  const rangeLabel =
    stats.start_period_code === stats.end_period_code
      ? stats.start_period_code
      : `${stats.start_period_code} — ${stats.end_period_code}`

  return (
    <section
      className={cn(
        'divide-border border-border bg-background divide-y overflow-hidden rounded-md border',
        className,
      )}
    >
      <div className="bg-brand-50 dark:bg-brand-900/20 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-3">
        <p className="text-brand-700 dark:text-brand-200 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <CalendarRange
            className="text-brand-600 dark:text-brand-300 size-4 shrink-0"
            aria-hidden="true"
          />

          <span className="text-brand-700/80 dark:text-brand-300/80 text-xs font-medium tracking-wide uppercase">
            Periodo evaluado
          </span>

          <Badge className="text-sm font-bold">{rangeLabel}</Badge>
        </p>
      </div>

      <div className="relative flex flex-wrap items-end justify-between gap-6 overflow-hidden p-6">
        <div
          aria-hidden="true"
          className="from-brand-500/10 pointer-events-none absolute -top-24 -right-24 size-56 rounded-full bg-radial to-transparent blur-2xl"
        />

        <div className="relative min-w-0">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Departamento
          </p>

          <h2 className="mt-1 truncate text-2xl font-bold tracking-tight uppercase sm:text-3xl">
            {stats.department_name}
          </h2>
        </div>

        <div className="relative text-right">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Promedio general
          </p>

          <ScoreBadge
            value={stats.overall_average}
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
