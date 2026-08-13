import { AverageTrendChart, type TrendSeries } from '@/components/common/AverageTrendChart'
import { useAuthStore } from '@/features/auth'
import { useGetTeacherCourseHistory } from '../api'

export interface CourseAverageTrendProps {
  /** Course to plot, identified by its code. */
  courseCode: string
  /** Teacher to plot. Defaults to the authenticated one. */
  teacherId?: number
  /** How many periods to plot, oldest first. Defaults to 12. */
  limit?: number
  /** Section heading; pass `null` to render the bare chart. */
  title?: string | null
  chartClassName?: string
  className?: string
}

/**
 * Evolution of one specific course across every period the teacher taught
 * it, against the department's average for the same course each period —
 * built on the shared `AverageTrendChart`, fed by
 * `useGetTeacherCourseHistory`.
 *
 * @example
 * <CourseAverageTrend courseCode={course.course_code} />
 *
 * @example
 * <CourseAverageTrend courseCode={course.course_code} teacherId={teacher.teacher_id} limit={6} />
 */
export function CourseAverageTrend({
  courseCode,
  teacherId,
  limit = 12,
  title = 'Evolución en esta asignatura',
  chartClassName,
  className,
}: CourseAverageTrendProps) {
  const authTeacherId = useAuthStore((state) => state.user?.teacher_id)
  const effectiveTeacherId = teacherId ?? authTeacherId ?? undefined

  const { data, isPending, error } = useGetTeacherCourseHistory({
    teacherId: effectiveTeacherId,
    courseCode,
    limit,
  })

  const items = [...(data?.data.items ?? [])].sort((a, b) =>
    a.period_code.localeCompare(b.period_code),
  )

  const hasDepartmentAverage = items.some((item) => item.department_average != null)

  const series: TrendSeries[] = [
    {
      id: 'overall_average',
      label: 'Su promedio',
      data: items.map((item) => ({
        x: item.period_name ?? item.period_code,
        value: item.overall_average,
      })),
    },
  ]

  if (hasDepartmentAverage) {
    series.push({
      id: 'department_average',
      label: 'Promedio del departamento',
      variant: 'dashed',
      data: items.map((item) => ({
        x: item.period_name ?? item.period_code,
        value: item.department_average,
      })),
    })
  }

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
        emptyMessage="Aún no hay historial de esta asignatura en otros periodos."
        chartClassName={chartClassName}
      />
    </section>
  )
}
