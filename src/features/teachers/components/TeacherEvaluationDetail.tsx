import type { ReactNode, RefObject } from 'react'

import { DimensionComparisonChart } from '@/components/common/DimensionComparisonChart'
import { PeriodAverageTrend } from '@/features/periods'
import { dimensionColor } from '@/lib/dimensionLabel'
import { cn } from '@/lib/utils'
import type { CourseDetail, TeacherDetail } from '../types'
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
  return (
    <div className={cn('space-y-6', className)}>
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

      {/* The same twenty-one indicators the asignaturas below break down, but
          for the teacher as a whole. They were in the payload all along and
          nowhere on screen: the chart above only carries the four dimension
          averages, so a question dragging every course at once had no place it
          could be read. */}
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
          className="px-6 pb-2"
        />
      </section>

      <TeacherCourseResults teacher={teacher} getCourseHref={getCourseHref} />

      {!hideComments && (
        <TeacherComments
          evaluationId={teacher.evaluation_id}
          teacherId={teacher.teacher_id}
          title={commentsTitle}
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
    </div>
  )
}
