import { ChevronRight } from 'lucide-react'

import { ScoreBadge } from '@/components/common/ScoreBadge'
import { ScoreProgress } from '@/components/common/ScoreProgress'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { dimensionColor } from '@/lib/dimensionLabel'
import { cn } from '@/lib/utils'
import type { DimensionDetail } from '../types'

export interface CourseComparisonSource {
  dimensions: Array<{
    dimension: string
    average?: number | null
    questions: Array<{ code: string; score?: number | null }>
  }>
}

export interface CourseDimensionBreakdownProps {
  /**
   * The dimensions to lay out. A course's own, or the teacher's across every
   * group he taught — the shape is the same and so is the reading, so the
   * profile's period-wide panel is this component with a different source.
   */
  dimensions: DimensionDetail[]
  /** The same set from another point of comparison, to show trends against. */
  previous?: CourseComparisonSource['dimensions']
  /** Label naming what `previous` represents. Defaults to `'periodo anterior'`. */
  previousLabel?: string
  className?: string
}

/**
 * Per-dimension breakdown: each dimension shows its average (with a trend
 * against `previous` when given) and expands to reveal its individual
 * questions with a score bar. Shared by the collapsed course row in
 * `TeacherCourseResults`, the full-page view of a single course, and the
 * period-wide panel of a teacher's profile.
 *
 * @example
 * <CourseDimensionBreakdown
 *   dimensions={course.dimensions}
 *   previous={previousCourse?.dimensions}
 * />
 *
 * @example
 * <CourseDimensionBreakdown
 *   dimensions={teacher.dimensions}
 *   previous={teacher.previous_period?.dimensions}
 * />
 */
export function CourseDimensionBreakdown({
  dimensions,
  previous,
  previousLabel = 'periodo anterior',
  className,
}: CourseDimensionBreakdownProps) {
  return (
    <div className={cn('divide-border divide-y', className)}>
      {dimensions.map((dimension) => {
        const previousDimension = previous?.find((entry) => entry.dimension === dimension.dimension)

        return (
          <DimensionRow
            key={dimension.dimension}
            dimension={dimension}
            previousDimension={previousDimension}
            previousLabel={previousLabel}
          />
        )
      })}
    </div>
  )
}

function DimensionRow({
  dimension,
  previousDimension,
  previousLabel,
}: {
  dimension: DimensionDetail
  previousDimension?: CourseComparisonSource['dimensions'][number]
  previousLabel: string
}) {
  return (
    <Collapsible>
      <CollapsibleTrigger className="hover:bg-muted/30 group flex w-full cursor-pointer items-center justify-between gap-4 py-3 text-left transition-colors">
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
          previousValue={previousDimension?.average ?? undefined}
          previousLabel={previousLabel}
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
                    previousValue={previousQuestion?.score ?? undefined}
                    previousLabel={previousLabel}
                    showTrend={false}
                    label={question.text}
                    className="min-w-20"
                  />

                  <ScoreBadge
                    value={question.score}
                    previousValue={previousQuestion?.score ?? undefined}
                    previousLabel={previousLabel}
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
