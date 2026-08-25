import type { ReactNode, RefObject } from 'react'

import { Checkbox } from '@/components/ui/checkbox'
import { DimensionComparisonChart } from '@/components/common/DimensionComparisonChart'
import { IndicatorSelectionBar } from '@/features/plans/components/IndicatorSelectionBar'
import { TeacherPlanAction } from '@/features/plans/components/TeacherPlanAction'
import {
  useIndicatorSelection,
  type SelectionEntry,
} from '@/features/plans/hooks/useIndicatorSelection'
import { PeriodAverageTrend } from '@/features/periods'
import { dimensionColor } from '@/lib/dimensionLabel'
import { cn } from '@/lib/utils'
import type { CourseDetail, TeacherDetail } from '../types'
import { CommentCard } from './CommentCard'
import { CourseDimensionBreakdown } from './CourseDimensionBreakdown'
import { TeacherComments } from './TeacherComments'
import { TeacherCourseResults } from './TeacherCourseResults'
import { TeacherOverview } from './TeacherOverview'

export interface TeacherEvaluationDetailProps {
  teacher: TeacherDetail
  /** Heading of the comments panel. Defaults to "Comentarios de los estudiantes". */
  commentsTitle?: ReactNode
  /** Hide the comments panel — e.g. on a read-only summary. Defaults to `false`. */
  hideComments?: boolean
  /** Forwarded to `TeacherCourseResults` — see its own docs. */
  getCourseHref?: (course: CourseDetail) => string
  /** Attaches to the "Perfil por dimensiones" card — e.g. to snapshot it for a PDF report. */
  dimensionsChartRef?: RefObject<HTMLElement | null>
  /** Attaches to the "Evolución del promedio por periodo" card — e.g. to snapshot it for a PDF report. */
  trendChartRef?: RefObject<HTMLElement | null>
  /** Extra action(s) next to "Descargar evaluación" in the overview header — see `TeacherOverview`. */
  overviewActions?: ReactNode
  className?: string
}

/**
 * Full evaluation report of a teacher for one academic period: the hero with
 * the period and averages, the dimensions-per-course chart, the per-course
 * results and the student comments. Shared by every screen that shows this
 * report — the director's teacher detail and the teacher's own period detail —
 * so both stay identical as sections are added.
 *
 * It also owns the indicator selection, because it is the only common parent of
 * the three sections a plan is drawn from and of the strip that starts it.
 * `useIndicatorSelection` stays idle for anyone who is not the department
 * director, so the teacher reading their own report sees the page unchanged.
 *
 * @example
 * <TeacherEvaluationDetail teacher={teacher} />
 *
 * @example
 * <TeacherEvaluationDetail teacher={teacher} commentsTitle="Comentarios recibidos" />
 */
export function TeacherEvaluationDetail({
  teacher,
  commentsTitle = 'Comentarios de los estudiantes',
  hideComments = false,
  getCourseHref,
  dimensionsChartRef,
  trendChartRef,
  overviewActions,
  className,
}: TeacherEvaluationDetailProps) {
  const selection = useIndicatorSelection({
    teacherId: teacher.teacher_id,
    periodCode: teacher.period_code,
  })

  const active = selection.active ? selection : undefined

  /**
   * The questions of the period that sit at or below the institutional
   * threshold, at teacher level. With twenty-one indicators, the three to six
   * that are actually low is the whole answer nine times out of ten — which is
   * what the bar's shortcut offers.
   */
  const weakEntries: SelectionEntry[] = selection.active
    ? teacher.dimensions.flatMap((dimension) =>
        dimension.questions
          .filter((question) => question.score != null && question.score <= selection.threshold)
          .map((question) => ({
            kind: 'question' as const,
            ref: question.code,
            subjectKey: null,
            label: `${question.code} · ${question.text}`,
            subjectLabel: null,
          })),
      )
    : []

  return (
    <div className={cn('space-y-6', selection.active && 'pb-24', className)}>
      <TeacherOverview teacher={teacher} extraActions={overviewActions} />

      <section ref={dimensionsChartRef} className="border-border bg-background rounded-md border">
        <h2 className="border-border text-muted-foreground border-b px-6 py-4 text-sm font-medium">
          Perfil por dimensiones
        </h2>

        <div className="px-6 py-4">
          <DimensionComparisonChart
            series={[
              {
                id: 'teacher',
                label: teacher.name,
                scores: teacher.dimensions.map((dimension) => ({
                  dimension: dimension.dimension,
                  value: dimension.average,
                })),
              },
            ]}
            dimensions={teacher.dimensions.map((dimension) => ({
              key: dimension.dimension,
              color: dimensionColor(dimension.dimension),
            }))}
            referenceValue={teacher.overall_average}
            referenceLabel="Promedio general"
          />
        </div>
      </section>

      <TeacherPlanAction
        teacherId={teacher.teacher_id}
        teacherName={teacher.name}
        periodCode={teacher.period_code}
        selecting={selection.active}
        onStartSelection={selection.start}
      />

      <section className="border-border bg-background rounded-md border">
        <div className="border-border border-b px-6 py-4">
          <h2 className="text-sm font-medium">Indicadores del periodo</h2>
          <p className="text-muted-foreground text-xs">
            Promedio de cada indicador en todos los grupos que dictó, sin separar por asignatura.
          </p>
        </div>

        <CourseDimensionBreakdown
          dimensions={teacher.dimensions}
          previous={teacher.previous_period?.dimensions}
          selection={active}
          subjectKey={null}
          className="px-6 pb-2"
        />
      </section>

      <TeacherCourseResults teacher={teacher} getCourseHref={getCourseHref} selection={active} />

      {!hideComments && (
        <TeacherComments
          evaluationId={teacher.evaluation_id}
          teacherId={teacher.teacher_id}
          title={commentsTitle}
          // The panel already renders one card per comment; the checkbox rides
          // in the card's own actions slot, so nothing about the comments
          // themselves had to change to become selectable.
          renderComment={
            selection.active
              ? (comment, index) => {
                  const picked = selection.isSelected('comment', String(comment.id), null)

                  return (
                    <CommentCard
                      comment={comment}
                      index={index}
                      highlighted={picked}
                      actions={
                        <Checkbox
                          checked={picked}
                          onCheckedChange={() =>
                            selection.toggle({
                              kind: 'comment',
                              ref: String(comment.id),
                              subjectKey: null,
                              label: `Comentario${comment.course_name ? ` · ${comment.course_name}` : ''}`,
                              subjectLabel: null,
                            })
                          }
                          aria-label={`${picked ? 'Quitar' : 'Seleccionar'} el comentario ${comment.id}`}
                        />
                      }
                    />
                  )
                }
              : undefined
          }
        />
      )}

      <section ref={trendChartRef} className="border-border bg-background rounded-md border">
        <h2 className="border-border text-muted-foreground border-b px-6 py-4 text-sm font-medium">
          Evolución del promedio por periodo
        </h2>

        <div className="px-6 py-4">
          <PeriodAverageTrend teacherId={teacher.teacher_id} title={null} />
        </div>
      </section>

      {selection.active && (
        <IndicatorSelectionBar selection={selection} weakEntries={weakEntries} />
      )}
    </div>
  )
}
