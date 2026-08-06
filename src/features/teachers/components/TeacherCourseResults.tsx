import { ChevronRight } from 'lucide-react'

import { ScoreProgress } from '@/components/common/ScoreProgress'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { dimensionColor } from '@/lib/dimensionLabel'
import { getScoreToneClass } from '@/lib/scoreTone'
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
        {teacher.courses.map((course) => (
          <CourseRow key={`${course.course_code}-${course.group_name}`} course={course} />
        ))}
      </div>
    </section>
  )
}

function CourseRow({ course }: { course: CourseDetail }) {
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
          <span
            className={`text-lg font-semibold tabular-nums ${getScoreToneClass(course.overall_average)}`}
          >
            {course.overall_average.toFixed(2)}
          </span>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="divide-border divide-y px-6 pb-2">
          {course.dimensions.map((dimension) => (
            <DimensionRow key={dimension.dimension} dimension={dimension} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function DimensionRow({ dimension }: { dimension: DimensionDetail }) {
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

        <span
          className={`shrink-0 text-sm font-semibold tabular-nums ${getScoreToneClass(dimension.average)}`}
        >
          {dimension.average.toFixed(2)}
        </span>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="space-y-6 py-4 pl-5.5">
          {dimension.questions.map((question) => (
            <div key={question.code}>
              <div className="mb-1 flex items-baseline justify-between gap-4">
                <span className="text-sm">
                  {question.code} - {question.text}
                </span>

                <span className="shrink-0 text-sm font-medium tabular-nums">
                  {question.score.toFixed(2)}
                </span>
              </div>

              <ScoreProgress value={question.score} label={question.text} />
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
