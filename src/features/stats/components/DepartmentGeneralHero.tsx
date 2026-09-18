import { CalendarRange, ClipboardList } from 'lucide-react'

import { ScoreBadge } from '@/components/common/ScoreBadge'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { DepartmentGlobalAverage } from '../types'

export interface DepartmentGeneralHeroProps {
  /** The department's most recent period average — the one the hero highlights. */
  latest: DepartmentGlobalAverage
  /** The department's average in the period right before `latest`, if any — renders a growth/decrease indicator next to the score. */
  previousValue?: number
  className?: string
}

/**
 * Flat, typographic hero for a department's global average — same visual
 * language as `FacultyStatsHero`, one level down. Deliberately limited to
 * the average and participation counts: unlike `DepartmentStatsHero` (the
 * director's own view), it has no comments or dimensions breakdown and no
 * link into individual evaluations, since this is the read-only view
 * VICERRECTOR ACADEMICO and DECANO get for a department they don't manage.
 *
 * @example
 * <DepartmentGeneralHero latest={averages[averages.length - 1]} />
 */
export function DepartmentGeneralHero({
  latest,
  previousValue,
  className,
}: DepartmentGeneralHeroProps) {
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
            Departamento
          </p>

          <h2 className="mt-1 truncate text-2xl font-bold tracking-tight uppercase sm:text-3xl">
            {latest.department_name}
          </h2>
        </div>

        <div className="relative text-right">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Promedio general
          </p>

          <ScoreBadge
            value={latest.global_average ?? undefined}
            previousValue={previousValue}
            tone="auto"
            size="5xl"
            decimals={2}
            className="leading-none"
          />
        </div>
      </div>

      <div className="bg-muted/40 flex items-center gap-2 px-6 py-3">
        <ClipboardList className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />

        <p className="text-muted-foreground text-xs">
          <span className="text-foreground font-semibold">{latest.evaluation_count}</span>{' '}
          {latest.evaluation_count === 1 ? 'evaluación registrada' : 'evaluaciones registradas'}
          {' · '}
          <span className="text-foreground font-semibold">{latest.total_respondents}</span>{' '}
          {latest.total_respondents === 1 ? 'respondiente' : 'respondientes'}
        </p>
      </div>
    </section>
  )
}
