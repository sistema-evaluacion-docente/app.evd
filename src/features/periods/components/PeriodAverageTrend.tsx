import { AverageTrendChart, type TrendSeries } from '@/components/common/AverageTrendChart'
import { useAuthStore } from '@/features/auth'
import { useGetTeacherHistory } from '../api'

export interface PeriodAverageTrendProps {
  /** Teacher to plot. Defaults to the authenticated one. */
  teacherId?: number
  /** How many periods to plot, oldest first. Defaults to 12. */
  limit?: number
  /** Section heading; pass `null` to render the bare chart. */
  title?: string | null
  /** Institutional target drawn as a dashed reference line. */
  target?: number
  chartClassName?: string
  className?: string
}

/**
 * Evolution of the authenticated teacher's overall average across their
 * evaluated periods, built on the shared `AverageTrendChart`. Feeds it the
 * teacher history the periods list already queries, so no new endpoint is
 * involved.
 *
 * @example
 * <PeriodAverageTrend />
 *
 * @example
 * <PeriodAverageTrend limit={6} target={4} title="Mi evolución reciente" />
 *
 * @example
 * <PeriodAverageTrend teacherId={teacher.teacher_id} title="Evolución del promedio" />
 */
export function PeriodAverageTrend({
  teacherId,
  limit = 12,
  title = 'Evolución de mi promedio',
  target,
  chartClassName,
  className,
}: PeriodAverageTrendProps) {
  const authTeacherId = useAuthStore((state) => state.user?.teacher_id)
  const effectiveTeacherId = teacherId ?? authTeacherId ?? undefined

  const { data, isPending, error } = useGetTeacherHistory({
    teacherId: effectiveTeacherId,
    page: 1,
    limit,
    sort_by: 'period_code_asc',
  })

  const history = data?.data ?? []

  const series: TrendSeries[] = [
    {
      id: 'overall_average',
      label: 'Promedio general',
      data: history.map((entry) => ({
        x: entry.period_name ?? entry.period_code,
        value: entry.overall_average,
      })),
    },
  ]

  if (!effectiveTeacherId) return null

  return (
    <section className={className}>
      {title && (
        <h2 className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
          {title}
        </h2>
      )}

      <AverageTrendChart
        series={series}
        isLoading={isPending}
        error={error ? error.message : null}
        referenceValue={target}
        referenceLabel={target != null ? 'Meta' : undefined}
        emptyMessage="Aún no hay periodos evaluados para dibujar una tendencia."
        chartClassName={chartClassName}
      />
    </section>
  )
}
