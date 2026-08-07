import type { ReactNode } from 'react'

import { DimensionComparisonChart } from '@/components/common/DimensionComparisonChart'
import { PeriodAverageTrend } from '@/features/periods'
import { dimensionColor, shortenDimensionLabel } from '@/lib/dimensionLabel'
import { cn } from '@/lib/utils'
import type { TeacherDetail } from '../types'
import { TeacherComments } from './TeacherComments'
import { TeacherCourseResults } from './TeacherCourseResults'
import { TeacherOverview } from './TeacherOverview'

export interface TeacherEvaluationDetailProps {
  teacher: TeacherDetail
  /** Heading of the comments panel. Defaults to "Comentarios de los estudiantes". */
  commentsTitle?: ReactNode
  /** Hide the comments panel — e.g. on a read-only summary. Defaults to `false`. */
  hideComments?: boolean
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
  className,
}: TeacherEvaluationDetailProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <TeacherOverview teacher={teacher} />

      <section className="border-border bg-background rounded-md border">
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
            labelFormatter={shortenDimensionLabel}
            referenceValue={teacher.overall_average}
            referenceLabel="Promedio general"
          />
        </div>
      </section>

      <TeacherCourseResults teacher={teacher} />

      {!hideComments && (
        <TeacherComments
          evaluationId={teacher.evaluation_id}
          teacherId={teacher.teacher_id}
          title={commentsTitle}
        />
      )}

      <section className="border-border bg-background rounded-md border">
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
