import { ArrowUpRight, ChevronRight } from 'lucide-react'
import { Link } from 'wouter'

import { ScoreBadge } from '@/components/common/ScoreBadge'
import { ScoreProgress } from '@/components/common/ScoreProgress'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { dimensionColor } from '@/lib/dimensionLabel'
import type { CourseDetail, DimensionDetail, TeacherDetail } from '../types'

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
        <CollapsibleTrigger className="hover:bg-muted/40 group -m-2 flex min-w-0 flex-1 items-center gap-3 rounded-md p-2 text-left transition-colors">
          <ChevronRight
            aria-hidden="true"
            className="text-muted-foreground size-4 shrink-0 transition-transform group-data-panel-open:rotate-90"
          />

          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{course.course_name}</p>
            <p className="text-muted-foreground text-xs">Grupo {course.group_name}</p>
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
        <div className="divide-border divide-y px-6 pb-2">
          {course.dimensions.map((dimension) => {
            const previousDimension = previousCourse?.dimensions.find(
              (previous) => previous.dimension === dimension.dimension,
            )

            return (
              <DimensionRow
                key={dimension.dimension}
                dimension={dimension}
                previousDimension={previousDimension}
              />
            )
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function DimensionRow({
  dimension,
  previousDimension,
}: {
  dimension: DimensionDetail
  previousDimension?: DimensionDetail
}) {
  return (
    <Collapsible>
      <CollapsibleTrigger className="hover:bg-muted/30 group flex w-full items-center justify-between gap-4 py-3 text-left transition-colors">
        <span className="flex min-w-0 items-center gap-2">
          <ChevronRight
            aria-hidden="true"
            className="text-muted-foreground size-3.5 shrink-0 transition-transform group-data-panel-open:rotate-90"
          />

          <span
            aria-hidden="true"
            className="size-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: dimensionColor(dimension.dimension) }}
          />

          <span className="text-muted-foreground truncate text-xs font-medium tracking-wide uppercase">
            {dimension.dimension}
          </span>
        </span>

        <ScoreBadge
          size="lg"
          value={dimension.average}
          previousValue={previousDimension?.average}
          previousLabel="periodo anterior"
        />
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="space-y-6 py-4 pl-5.5">
          {dimension.questions.map((question) => {
            const previousQuestion = previousDimension?.questions.find(
              (previous) => previous.code === question.code,
            )

            return (
              <div
                key={question.code}
                className="flex flex-col md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-sm">
                    {question.code}. {question.text}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <ScoreProgress
                    value={question.score}
                    previousValue={previousQuestion?.score}
                    previousLabel="periodo anterior"
                    showTrend={false}
                    label={question.text}
                    className="min-w-20"
                  />

                  <ScoreBadge
                    value={question.score}
                    previousValue={previousQuestion?.score}
                    previousLabel="periodo anterior"
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
