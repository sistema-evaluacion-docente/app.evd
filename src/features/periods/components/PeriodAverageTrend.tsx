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
  /** Y axis lower bound. Overrides `autoMin` when given. */
  min?: number
  /** When true, the Y axis lower bound is computed from the data instead of using the default 0. */
  autoMin?: boolean
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
 *
 * @example
 * <PeriodAverageTrend teacherId={teacher.teacher_id} autoMin={true} />
 *
 * @example
 * <PeriodAverageTrend teacherId={teacher.teacher_id} min={2} />
 */
export function PeriodAverageTrend({
  teacherId,
  limit = 12,
  title = 'Evolución de mi promedio',
  target,
  min,
  autoMin = false,
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

  /** Falls back to the chart's own fixed default (0) when there's nothing to measure. */
  const values = history
    .map((entry) => entry.overall_average)
    .filter((value): value is number => value != null)
  const effectiveMin = min ?? (autoMin && values.length > 0 ? Math.min(...values) - 0.5 : undefined)

  if (!effectiveTeacherId) return null

  return (
    <section className={`${className} bg-card border-border rounded-md border p-4`}>
      {title && (
        <h2 className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
          {title}
        </h2>
      )}

      <AverageTrendChart
        series={series}
        min={effectiveMin}
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
