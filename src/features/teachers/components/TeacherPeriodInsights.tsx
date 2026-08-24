import { useState } from 'react'

import { PeriodSelect, type PeriodSelectOption } from '@/components/common/PeriodSelect'
import { MoverBadge } from '@/components/common/MoverBadge'
import { useAuthStore } from '@/features/auth'
import { useGetTeacherHistory } from '@/features/periods'
import { useGetTeacherDetail } from '../api'
import type { CourseDetail } from '../types'
import { TeacherCommentsSummary } from './TeacherCommentsSummary'
import { TeacherQuestionMatrix } from './TeacherQuestionMatrix'

export interface TeacherPeriodInsightsProps {
  /** Teacher these insights belong to. Defaults to the authenticated teacher. */
  teacherId?: number
  className?: string
}

interface CourseMover {
  course: CourseDetail
  delta: number
}

/** Same pair already used elsewhere (`PeriodCourseDetailPage`) to identify one materia. */
function courseKey(course: Pick<CourseDetail, 'course_code' | 'group_name'>) {
  return `${course.course_code}-${course.group_name}`
}

/**
 * One shared period picker driving both the comments summary and the
 * question matrix — the two only make sense read together against the same
 * period, so a single control replaces what would otherwise be two
 * independent (and easy to desync) pickers. Also surfaces the two materias
 * that moved the most against the immediately preceding evaluated period —
 * always that one period, never a user-picked one, to keep this a quick
 * summary rather than duplicating the free comparison already available per
 * materia (`CourseTeacherDetail`). Self-contained like `PeriodAverageTrend`:
 * resolves the authenticated teacher when no `teacherId` is passed.
 *
 * @example
 * <TeacherPeriodInsights />
 */
export function TeacherPeriodInsights({ teacherId, className }: TeacherPeriodInsightsProps) {
  const authTeacherId = useAuthStore((state) => state.user?.teacher_id) ?? undefined
  const effectiveTeacherId = teacherId ?? authTeacherId

  const { data: historyData, isPending: isHistoryPending } = useGetTeacherHistory({
    teacherId: effectiveTeacherId,
    limit: 50,
    sort_by: 'period_code_desc',
  })
  const periods = historyData?.data ?? []

  const periodOptions: PeriodSelectOption[] = periods.map((period) => ({
    id: period.period_id,
    name: period.period_name ?? period.period_code,
    code: period.period_code,
  }))

  const [periodId, setPeriodId] = useState<number | undefined>(undefined)
  const selectedPeriod = periods.find((period) => period.period_id === periodId) ?? periods.at(0)
  const selectedIndex = periods.findIndex(
    (period) => period.period_id === selectedPeriod?.period_id,
  )
  const previousPeriod = selectedIndex >= 0 ? periods.at(selectedIndex + 1) : undefined

  const { data: teacherDetail } = useGetTeacherDetail({
    teacherId: effectiveTeacherId,
    periodName: selectedPeriod?.period_code,
  })
  const { data: previousTeacherDetail } = useGetTeacherDetail({
    teacherId: effectiveTeacherId,
    periodName: previousPeriod?.period_code,
  })

  if (!isHistoryPending && periods.length === 0) return null

  const courses = teacherDetail?.data.courses ?? []
  const previousCourses = previousTeacherDetail?.data.courses ?? []
  const previousByKey = new Map(previousCourses.map((course) => [courseKey(course), course]))

  const courseDeltas: CourseMover[] = courses
    .map((course) => {
      const previous = previousByKey.get(courseKey(course))
      return previous ? { course, delta: course.overall_average - previous.overall_average } : null
    })
    .filter((entry): entry is CourseMover => entry != null)

  const bestCourseMover = courseDeltas.reduce<CourseMover | null>(
    (best, current) => (best == null || current.delta > best.delta ? current : best),
    null,
  )
  const worstCourseMover = courseDeltas.reduce<CourseMover | null>(
    (worst, current) => (worst == null || current.delta < worst.delta ? current : worst),
    null,
  )
  const showBestCourse = bestCourseMover != null && bestCourseMover.delta > 0
  const showWorstCourse =
    worstCourseMover != null &&
    worstCourseMover.delta < 0 &&
    worstCourseMover.course !== bestCourseMover?.course

  return (
    <div className={className}>
      <div className="space-y-6">
        {periodOptions.length > 1 && (
          <div className="flex items-center gap-3">
            <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Periodo
            </h2>

            <PeriodSelect
              options={periodOptions}
              value={selectedPeriod?.period_id}
              onValueChange={setPeriodId}
              size="sm"
              ariaLabel="Periodo del resumen de comentarios y preguntas"
            />
          </div>
        )}

        {(showBestCourse || showWorstCourse) && (
          <div className="flex flex-wrap gap-3">
            {showBestCourse && bestCourseMover && (
              <MoverBadge direction="up" size="md">
                {bestCourseMover.course.course_name} (+
                {bestCourseMover.delta.toFixed(2)})
              </MoverBadge>
            )}

            {showWorstCourse && worstCourseMover && (
              <MoverBadge direction="down" size="md">
                Requiere atención: {worstCourseMover.course.course_name} (
                {worstCourseMover.delta.toFixed(2)})
              </MoverBadge>
            )}
          </div>
        )}

        <TeacherCommentsSummary
          evaluationId={selectedPeriod?.evaluation_id}
          previousEvaluationId={previousPeriod?.evaluation_id}
          teacherId={effectiveTeacherId}
        />

        <TeacherQuestionMatrix
          teacherId={effectiveTeacherId}
          evaluationId={selectedPeriod?.evaluation_id}
          dimensions={teacherDetail?.data.dimensions ?? []}
        />
      </div>
    </div>
  )
}
