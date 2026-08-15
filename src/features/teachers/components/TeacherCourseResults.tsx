import { ArrowUpRight, ChevronRight } from 'lucide-react'
import { Link } from 'wouter'

import { ScoreBadge } from '@/components/common/ScoreBadge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { CourseDetail, TeacherDetail } from '../types'
import { CourseDimensionBreakdown } from './CourseDimensionBreakdown'

interface TeacherCourseResultsProps {
  teacher: TeacherDetail
  /**
   * Builds the URL to a course's own detail page, given the course. When
   * provided, each row gets a link to it alongside its in-place expansion.
   * Omit to keep rows expand-only (e.g. the director's read of another
   * teacher, which has no per-course detail page of its own yet).
   */
  getCourseHref?: (course: CourseDetail) => string
}

/**
 * Flat, hairline-separated list of a teacher's evaluated courses. Clicking a
 * row expands it in place to reveal its individual questions, each with its
 * score and a thin gray progress bar.
 *
 * @example
 * <TeacherCourseResults teacher={teacher} />
 *
 * @example
 * <TeacherCourseResults
 *   teacher={teacher}
 *   getCourseHref={(course) => courseHref(teacher.period_code, course.course_code, course.group_name)}
 * />
 */
export function TeacherCourseResults({ teacher, getCourseHref }: TeacherCourseResultsProps) {
  return (
    <section className="border-border bg-background rounded-md border">
      <h2 className="border-border text-muted-foreground border-b px-6 py-4 text-sm font-medium">
        Resultados por asignatura
      </h2>

      <div className="divide-border divide-y">
        {teacher.courses.map((course) => {
          const previousCourse = teacher.previous_period?.courses.find(
            (previous) =>
              previous.course_code === course.course_code &&
              previous.group_name === course.group_name,
          )

          return (
            <CourseRow
              key={`${course.course_code}-${course.group_name}`}
              course={course}
              previousCourse={previousCourse}
              href={getCourseHref?.(course)}
            />
          )
        })}
      </div>
    </section>
  )
}

function CourseRow({
  course,
  previousCourse,
  href,
}: {
  course: CourseDetail
  previousCourse?: CourseDetail
  href?: string
}) {
  return (
    <Collapsible className="group/row relative">
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <CollapsibleTrigger className="hover:bg-muted/40 group -m-2 flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-md p-2 text-left transition-colors">
          <ChevronRight
            aria-hidden="true"
            className="text-muted-foreground size-4 shrink-0 transition-transform group-data-panel-open:rotate-90"
          />

          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{course.course_name}</p>
            <p className="text-muted-foreground text-sm">
              {course.course_code} - {course.group_name}
            </p>
          </div>
        </CollapsibleTrigger>

        <div className="flex shrink-0 items-center gap-3">
          <ScoreBadge
            size="lg"
            value={course.overall_average}
            previousValue={previousCourse?.overall_average}
            previousLabel="periodo anterior"
          />

          {href && (
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              className="text-muted-foreground hover:text-primary gap-1 hover:bg-transparent"
              render={<Link href={href} />}
            >
              Ver detalle
              <ArrowUpRight aria-hidden="true" className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      <CollapsibleContent>
        <CourseDimensionBreakdown
          course={course}
          previousCourse={previousCourse}
          className="px-6 pb-2"
        />
      </CollapsibleContent>
    </Collapsible>
  )
}
