import { ChevronRight } from 'lucide-react'

import { ScoreBadge } from '@/components/common/ScoreBadge'
import { ScoreProgress } from '@/components/common/ScoreProgress'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { dimensionColor } from '@/lib/dimensionLabel'
import type { CourseDetail, DimensionDetail, TeacherDetail } from '../types'

interface TeacherCourseResultsProps {
  teacher: TeacherDetail
}

/**
 * Flat, hairline-separated list of a teacher's evaluated courses. Clicking a
 * row expands it in place to reveal its individual questions, each with its
 * score and a thin gray progress bar.
 *
 * @example
 * <TeacherCourseResults teacher={teacher} />
 */
export function TeacherCourseResults({ teacher }: TeacherCourseResultsProps) {
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
}: {
  course: CourseDetail
  previousCourse?: CourseDetail
}) {
  return (
    <Collapsible className="group/row relative">
      <CollapsibleTrigger className="hover:bg-muted/40 group flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-colors">
        <div className="flex min-w-0 items-center gap-3">
          <ChevronRight
            aria-hidden="true"
            className="text-muted-foreground size-4 shrink-0 transition-transform group-data-panel-open:rotate-90"
          />

          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{course.course_name}</p>
            <p className="text-muted-foreground text-xs">Grupo {course.group_name}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-6">
          <ScoreBadge
            size="lg"
            value={course.overall_average}
            previousValue={previousCourse?.overall_average}
            previousLabel="periodo anterior"
          />
        </div>
      </CollapsibleTrigger>

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
