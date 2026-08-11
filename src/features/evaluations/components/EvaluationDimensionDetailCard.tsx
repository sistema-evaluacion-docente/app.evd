import { ChevronRight } from 'lucide-react'

import { ScoreBadge } from '@/components/common/ScoreBadge'
import { ScoreProgress } from '@/components/common/ScoreProgress'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { dimensionColor } from '@/lib/dimensionLabel'
import type { EvaluationDimensionDetail } from '../types'

export interface EvaluationDimensionDetailCardProps {
  dimension: EvaluationDimensionDetail
  /**
   * Same dimension computed at department level, for comparison. Passed only
   * when the page is filtered by teacher and/or course — shows a trend badge
   * next to the dimension and question averages.
   */
  overallDimension?: EvaluationDimensionDetail
}

/**
 * Collapsible row for one pedagogical dimension of an evaluation — a row
 * inside the shared bordered list, same interaction as `TeacherCourseResults`.
 * Collapsed, it shows the dimension name, question count and average.
 * Expanded, it adds the best/worst performing teacher, every question's
 * score, and the full ranking of teachers on that dimension. When
 * `overallDimension` is given, every average shows a delta against the
 * department's.
 *
 * @example
 * <EvaluationDimensionDetailCard dimension={dimension} />
 *
 * @example
 * <EvaluationDimensionDetailCard dimension={dimension} overallDimension={departmentDimension} />
 */
export function EvaluationDimensionDetailCard({
  dimension,
  overallDimension,
}: EvaluationDimensionDetailCardProps) {
  return (
    <Collapsible className="group/row">
      <CollapsibleTrigger className="hover:bg-muted/40 group flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-colors">
        <div className="flex min-w-0 items-center gap-3">
          <ChevronRight
            aria-hidden="true"
            className="text-muted-foreground size-4 shrink-0 transition-transform group-data-panel-open:rotate-90"
          />

          <span
            aria-hidden="true"
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: dimensionColor(dimension.dimension) }}
          />

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{dimension.dimension}</p>
            <p className="text-muted-foreground text-xs">{dimension.question_count} preguntas</p>
          </div>
        </div>

        <ScoreBadge
          size="lg"
          value={dimension.average}
          previousValue={overallDimension?.average}
          previousLabel="promedio del departamento"
        />
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="space-y-6 px-6 pb-6">
          <div className="space-y-4">
            <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Preguntas
            </h3>

            {dimension.questions.map((question) => {
              const overallQuestion = overallDimension?.questions.find(
                (item) => item.code === question.code,
              )

              return (
                <div
                  key={question.code}
                  className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-4"
                >
                  <span className="text-sm">
                    {question.code}. {question.text}
                  </span>

                  <div className="flex shrink-0 items-center gap-4">
                    <ScoreProgress
                      value={question.average ?? 0}
                      previousValue={overallQuestion?.average ?? undefined}
                      previousLabel="promedio del departamento"
                      label={question.text}
                      className="min-w-20"
                    />

                    <ScoreBadge value={question.average} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
