import { CalendarRange } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface PeriodBannerProps {
  /** Small uppercase label describing what the period refers to (e.g. "Periodo seleccionado"). */
  label: string
  /** Period name (or code) to highlight. Renders nothing when null/undefined. */
  period?: string | null
  className?: string
}

/**
 * Brand-tinted strip that keeps the current academic period visible and
 * unambiguous — same visual language as the period strip on
 * `EvaluationOverview`/`TeacherOverview`/`DepartmentStatsHero`, extracted so
 * a page whose own period selector can scroll out of view (e.g. a filters
 * toolbar) still always shows which period is active.
 *
 * @example
 * <PeriodBanner label="Periodo seleccionado" period={period?.name} />
 */
export function PeriodBanner({ label, period, className }: PeriodBannerProps) {
  if (!period) return null

  return (
    <div
      className={cn(
        'bg-brand-50 dark:bg-brand-900/20 flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-md px-4 py-2.5',
        className,
      )}
    >
      <CalendarRange
        className="text-brand-600 dark:text-brand-300 size-4 shrink-0"
        aria-hidden="true"
      />

      <span className="text-brand-700/80 dark:text-brand-300/80 text-xs font-medium tracking-wide uppercase">
        {label}
      </span>

      <Badge className="text-sm font-bold">{period}</Badge>
    </div>
  )
}
