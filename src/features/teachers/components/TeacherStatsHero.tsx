import { CalendarRange } from 'lucide-react'

import { ScoreBadge } from '@/components/common/ScoreBadge'
import { TransitionLink } from '@/components/common/TransitionLink'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/features/auth'
import { useGetTeacherHistory } from '@/features/periods'
import { cn } from '@/lib/utils'
import { useGetTeacherDetail } from '../api'
import { TeacherStatsHeroSkeleton } from './TeacherStatsHeroSkeleton'

export interface TeacherStatsHeroProps {
  /** Teacher shown. Defaults to the authenticated teacher. */
  teacherId?: number
  className?: string
}

/**
 * Flat, typographic hero for the teacher's own dashboard: a context strip
 * naming the last evaluated period, the overall average as the single large
 * figure — compared against the immediately previous period — and
 * materia/respondent/period counts as hairline-separated columns. Same
 * visual language as `DepartmentStatsHero`, scoped to one teacher.
 *
 * Self-contained like `PeriodAverageTrend`: resolves the authenticated
 * teacher when no `teacherId` is passed, and reuses the very queries
 * `TeacherPeriodInsights` already runs (same history params, same detail for
 * the latest period), so it costs no extra request.
 *
 * @example
 * <TeacherStatsHero />
 *
 * @example
 * <TeacherStatsHero teacherId={12} />
 */
export function TeacherStatsHero({ teacherId, className }: TeacherStatsHeroProps) {
  const user = useAuthStore((state) => state.user)
  const effectiveTeacherId = teacherId ?? user?.teacher_id ?? undefined

  const { data: historyData, isPending } = useGetTeacherHistory({
    teacherId: effectiveTeacherId,
    limit: 50,
    sort_by: 'period_code_desc',
  })
  const periods = historyData?.data ?? []
  const latestPeriod = periods.at(0)
  const previousPeriod = periods.at(1)

  const { data: detailData } = useGetTeacherDetail({
    teacherId: effectiveTeacherId,
    periodName: latestPeriod?.period_code,
  })
  const detail = detailData?.data

  if (!effectiveTeacherId) return null

  if (isPending) return <TeacherStatsHeroSkeleton className={className} />

  // Nothing evaluated yet — the rest of the dashboard already says so; a hero
  // with an empty average would only repeat it louder.
  if (!latestPeriod) return null

  const periodLabel = latestPeriod.period_name ?? latestPeriod.period_code
  const teacherName = detail?.name ?? user?.name ?? ''
  const teacherCode = detail?.institutional_code

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
            Último periodo evaluado
          </span>

          <Badge className="text-sm font-bold">{periodLabel}</Badge>
        </p>

        <Button
          size="sm"
          nativeButton={false}
          render={
            <TransitionLink href={`/periodos/${encodeURIComponent(latestPeriod.period_code)}`} />
          }
        >
          Ver evaluación detallada
        </Button>
      </div>

      <div className="relative flex flex-wrap items-end justify-between gap-6 overflow-hidden p-6">
        <div
          aria-hidden="true"
          className="from-brand-500/10 pointer-events-none absolute -top-24 -right-24 size-56 rounded-full bg-radial to-transparent blur-2xl"
        />

        <div className="relative flex min-w-0 items-center gap-4">
          <Avatar className="size-14 shrink-0">
            <AvatarFallback>{teacherName.at(0)}</AvatarFallback>
            <AvatarImage
              src={detail?.avatar_url ?? user?.avatar_url}
              alt={teacherName ? `Foto de ${teacherName}` : ''}
            />
          </Avatar>

          <div className="min-w-0">
            <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
              {teacherCode}
            </p>

            <h2 className="mt-1 truncate text-2xl font-bold tracking-tight sm:text-3xl">
              {teacherName}
            </h2>
          </div>
        </div>

        <div className="relative text-right">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Promedio general del periodo
          </p>

          <ScoreBadge
            value={latestPeriod.overall_average ?? undefined}
            previousValue={previousPeriod?.overall_average ?? undefined}
            previousLabel="periodo anterior"
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
