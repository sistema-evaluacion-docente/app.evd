import { ChevronRight } from 'lucide-react'

import { ScoreBadge } from '@/components/common/ScoreBadge'
import { ScoreProgress } from '@/components/common/ScoreProgress'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { IndicatorSelectionApi } from '@/features/plans/hooks/useIndicatorSelection'
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
  /**
   * Turns every row into something a director can mark for an improvement
   * plan. Omitted, the breakdown is the read-only panel it has always been —
   * which is what the teacher reading their own report gets.
   */
  selection?: IndicatorSelectionApi
  /**
   * The asignatura these rows belong to, or `null` when they are the teacher's
   * own averages across every group. It is what tells a mark whether it is a
   * commitment about one course or about the teacher.
   */
  subjectKey?: string | null
  /** How that asignatura reads, for the selection bar to say where a mark came from. */
  subjectLabel?: string | null
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
 * // Selectable, on the director's read of a teacher.
 * <CourseDimensionBreakdown
 *   dimensions={teacher.dimensions}
 *   selection={selection}
 *   subjectKey={null}
 * />
 */
export function CourseDimensionBreakdown({
  dimensions,
  previous,
  previousLabel = 'periodo anterior',
  selection,
  subjectKey = null,
  subjectLabel = null,
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
            selection={selection}
            subjectKey={subjectKey}
            subjectLabel={subjectLabel}
          />
        )
      })}
    </div>
  )
}

/** Says the same indicator is already marked somewhere else, so two commitments
 *  are not filed by accident where one was meant. */
function ElsewhereHint({ count }: { count: number }) {
  if (count === 0) return null

  return (
    <span className="text-muted-foreground shrink-0 text-xs">
      ya marcado en {count === 1 ? 'otra asignatura' : `otras ${count} asignaturas`}
    </span>
  )
}

function DimensionRow({
  dimension,
  previousDimension,
  previousLabel,
  selection,
  subjectKey,
  subjectLabel,
}: {
  dimension: DimensionDetail
  previousDimension?: CourseComparisonSource['dimensions'][number]
  previousLabel: string
  selection?: IndicatorSelectionApi
  subjectKey: string | null
  subjectLabel: string | null
}) {
  const picked = selection?.isSelected('dimension', dimension.dimension, subjectKey) ?? false

  return (
    <Collapsible>
      <div className="flex items-center gap-3">
        {/* Outside the trigger on purpose: the trigger is the whole row, and a
            checkbox nested in a button is invalid markup whose click the
            button would swallow. */}
        {selection && (
          <Checkbox
            checked={picked}
            onCheckedChange={() =>
              selection.toggle({
                kind: 'dimension',
                ref: dimension.dimension,
                subjectKey,
                label: dimension.dimension,
                subjectLabel,
              })
            }
            aria-label={`${picked ? 'Quitar' : 'Seleccionar'} ${dimension.dimension}`}
          />
        )}

        <CollapsibleTrigger className="hover:bg-muted/30 group flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-4 py-3 text-left transition-colors">
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

          <span className="flex shrink-0 items-center gap-3">
            {selection && (
              <ElsewhereHint
                count={selection.markedElsewhere('dimension', dimension.dimension, subjectKey)}
              />
            )}

            <ScoreBadge
              size="lg"
              value={dimension.average}
              previousValue={previousDimension?.average ?? undefined}
              previousLabel={previousLabel}
            />
          </span>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent>
        <div className={cn('space-y-6 py-4 pl-5.5', selection && 'pl-11')}>
          {dimension.questions.map((question) => {
            const previousQuestion = previousDimension?.questions.find(
              (previous) => previous.code === question.code,
            )

            return (
              <QuestionRow
                key={question.code}
                question={question}
                previousScore={previousQuestion?.score ?? undefined}
                previousLabel={previousLabel}
                selection={selection}
                subjectKey={subjectKey}
                subjectLabel={subjectLabel}
              />
            )
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function QuestionRow({
  question,
  previousScore,
  previousLabel,
  selection,
  subjectKey,
  subjectLabel,
}: {
  question: DimensionDetail['questions'][number]
  previousScore?: number
  previousLabel: string
  selection?: IndicatorSelectionApi
  subjectKey: string | null
  subjectLabel: string | null
}) {
  const label = `${question.code} · ${question.text}`
  const picked = selection?.isSelected('question', question.code, subjectKey) ?? false

  function toggle() {
    selection?.toggle({
      kind: 'question',
      ref: question.code,
      subjectKey,
      label,
      subjectLabel,
    })
  }

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
      <div className="flex min-w-0 items-baseline gap-3">
        {selection && (
          <Checkbox
            checked={picked}
            onCheckedChange={toggle}
            aria-label={`${picked ? 'Quitar' : 'Seleccionar'} ${label}`}
          />
        )}

        {/* Nothing else claims this row, so the text is a target of its own —
            the phrasing is what the director is reading, not the box. */}
        {selection ? (
          <button type="button" onClick={toggle} className="cursor-pointer text-left text-sm">
            {question.code}. {question.text}
          </button>
        ) : (
          <span className="text-sm">
            {question.code}. {question.text}
          </span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-4">
        {selection && (
          <ElsewhereHint count={selection.markedElsewhere('question', question.code, subjectKey)} />
        )}

        <ScoreProgress
          value={question.score}
          previousValue={previousScore}
          previousLabel={previousLabel}
          showTrend={false}
          label={question.text}
          className="min-w-20"
        />

        <ScoreBadge
          value={question.score}
          previousValue={previousScore}
          previousLabel={previousLabel}
        />
      </div>
    </div>
  )
}
