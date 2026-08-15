import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link, useRoute } from 'wouter'

import { BackButton } from '@/components/common/BackButton'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/features/auth'
import { CourseTeacherDetail, useGetTeacherDetail } from '@/features/teachers'
import { courseHref } from '../config'

/**
 * Detail page for a single subject ("materia") within one of the
 * authenticated teacher's periods, reached from the "Materias" sidebar
 * submenu or the "Ver detalle" link on a course row. Thin wrapper: owns only
 * the back link and the prev/next-subject navigation (both specific to
 * browsing one's own periods); the actual report is `CourseTeacherDetail`,
 * shared with the director's read of any teacher.
 * Route: `/periodos/:period/materias/:courseCode/:groupName`.
 */
export default function PeriodCourseDetailPage() {
  const [, params] = useRoute('/periodos/:period/materias/:courseCode/:groupName')
  const teacherId = useAuthStore((state) => state.user?.teacher_id) ?? undefined

  const period = params?.period ? decodeURIComponent(params.period) : undefined
  const courseCode = params?.courseCode ? decodeURIComponent(params.courseCode) : undefined
  const groupName = params?.groupName ? decodeURIComponent(params.groupName) : undefined

  const { data, isLoading } = useGetTeacherDetail({ teacherId, periodName: period })
  const periodCourses = data?.data.courses ?? []

  const courseIndex = periodCourses.findIndex(
    (item) => item.course_code === courseCode && item.group_name === groupName,
  )
  const prevCourseInPeriod = courseIndex > 0 ? periodCourses[courseIndex - 1] : undefined
  const nextCourseInPeriod =
    courseIndex >= 0 && courseIndex < periodCourses.length - 1
      ? periodCourses[courseIndex + 1]
      : undefined

  const backHref = period ? `/periodos/${encodeURIComponent(period)}` : '/periodos'

  if (isLoading) {
    return (
      <>
        <BackButton href={backHref} label="Volver al periodo" className="mb-4" />
        <p className="text-muted-foreground py-10 text-center text-sm">Cargando…</p>
      </>
    )
  }

  if (courseIndex < 0 || !teacherId || !period || !courseCode || !groupName) {
    return (
      <>
        <BackButton href={backHref} label="Volver al periodo" className="mb-4" />
        <p className="text-muted-foreground py-10 text-center text-sm">
          No se encontró información para esta materia en el periodo indicado.
        </p>
      </>
    )
  }

  return (
    <div className="space-y-6">
      <BackButton href={backHref} label="Volver al periodo" className="mb-4" />

      {(prevCourseInPeriod || nextCourseInPeriod) && (
        <nav
          aria-label="Materias del periodo"
          className="border-border flex items-center justify-between gap-3 border-y py-1.5"
        >
          {prevCourseInPeriod ? (
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              className="text-muted-foreground hover:text-foreground h-auto min-w-0 gap-1.5 px-2 py-1"
              render={
                <Link
                  href={courseHref(
                    period,
                    prevCourseInPeriod.course_code,
                    prevCourseInPeriod.group_name,
                  )}
                />
              }
            >
              <ChevronLeft className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="flex min-w-0 items-baseline gap-1.5">
                <span className="shrink-0 text-[11px] font-medium tracking-wide uppercase">
                  Materia anterior
                </span>
                <span className="truncate text-xs normal-case opacity-80">
                  {prevCourseInPeriod.course_name}
                </span>
              </span>
            </Button>
          ) : (
            <span />
          )}

          {nextCourseInPeriod ? (
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              className="text-muted-foreground hover:text-foreground h-auto min-w-0 gap-1.5 px-2 py-1"
              render={
                <Link
                  href={courseHref(
                    period,
                    nextCourseInPeriod.course_code,
                    nextCourseInPeriod.group_name,
                  )}
                />
              }
            >
              <span className="flex min-w-0 items-baseline gap-1.5">
                <span className="truncate text-xs normal-case opacity-80">
                  {nextCourseInPeriod.course_name}
                </span>
                <span className="shrink-0 text-[11px] font-medium tracking-wide uppercase">
                  Materia siguiente
                </span>
              </span>
              <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />
            </Button>
          ) : (
            <span />
          )}
        </nav>
      )}

      <CourseTeacherDetail
        teacherId={teacherId}
        courseCode={courseCode}
        groupName={groupName}
        period={period}
      />
    </div>
  )
}
