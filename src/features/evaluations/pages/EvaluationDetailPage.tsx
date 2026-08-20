import { ListChecks } from 'lucide-react'
import { Link, useRoute } from 'wouter'

import { BackButton } from '@/components/common/BackButton'
import { PageTitle } from '@/components/common/PageTitle'
import { ScoreBadge } from '@/components/common/ScoreBadge'
import EvaluationDetailSkeleton from '@/components/skeletons/EvaluationDetailSkeleton'
import { Button } from '@/components/ui/button'
import { useAcademicPeriodsStore } from '@/features/periods'
import { TeacherAveragesTable } from '@/features/teachers'
import { useNavigate } from '@/hooks/useNavigate'
import { useGetEvaluation } from '../api'
import {
  EvaluationDimensionDetailCard,
  EvaluationDimensionsChart,
  EvaluationOverview,
} from '../components'
import type { EvaluationDimensionDetail } from '../types'

/**
 * Full page displaying the summary of a single evaluation.
 * Route: `/evaluaciones/:id` where `:id` is the evaluation id.
 */
export default function EvaluationDetailPage() {
  const [, params] = useRoute('/evaluaciones/:id')
  const evaluationId = params?.id ? Number(params.id) : undefined
  const navigate = useNavigate()
  const periods = useAcademicPeriodsStore((state) => state.periods)

  const { data, isLoading } = useGetEvaluation(evaluationId)
  const evaluation = data?.data

  if (isLoading) return <EvaluationDetailSkeleton />

  if (!evaluation) {
    return (
      <>
        <PageTitle>Detalle de la evaluación</PageTitle>

        <p className="text-muted-foreground text-center">No se encontró la evaluación.</p>

        <div className="flex justify-center">
          <BackButton href="/evaluaciones" label="Volver a evaluaciones" />
        </div>
      </>
    )
  }

  const comparison = evaluation.comparison

  const previousDimensions: EvaluationDimensionDetail[] | undefined = comparison?.dimensions.map(
    (dim) => ({
      dimension: dim.dimension,
      average: dim.old_average,
      question_count: dim.questions.length,
      questions: dim.questions.map((q) => ({ code: q.code, text: q.text, average: q.old_average })),
      best_teacher: null,
      worst_teacher: null,
    }),
  )

  const currentDimensions: EvaluationDimensionDetail[] | undefined =
    evaluation?.dimension_averages?.map((dim) => ({
      dimension: dim.dimension,
      average: dim.average,
      question_count: dim.questions.length,
      questions: dim.questions.map((q) => ({
        code: q.code,
        text: q.text,
        average: q.score,
      })),
      best_teacher: null,
      worst_teacher: null,
    }))

  return (
    <div className="space-y-6">
      <BackButton href="/evaluaciones" label="Volver a evaluaciones" className="mb-4" />

      <EvaluationOverview
        evaluation={evaluation}
        pdfHref={`/evaluaciones/${evaluation.id}/pdf`}
        actions={
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href={`/evaluaciones/${evaluation.id}/materias`} />}
            className="bg-background"
          >
            <ListChecks className="size-4" aria-hidden="true" />
            Revisar materias
          </Button>
        }
      />

      <section className="border-border bg-background rounded-md border">
        <div className="border-border flex items-center justify-between gap-4 border-b px-6 py-4">
          <h2 className="text-muted-foreground text-sm font-medium">
            Promedios por dimensión pedagógica
          </h2>

          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href={`/evaluaciones/${evaluation.id}/dimensiones`} />}
          >
            Ver detalle
          </Button>
        </div>

        <div className="px-6 py-4">
          <EvaluationDimensionsChart
            dimensionAverages={evaluation.dimension_averages}
            // compareAverages={previousDimensions}
            compareLabel={comparison?.previous_period_name}
            referenceValue={evaluation.overall_average}
            referenceLabel="Promedio general"
          />
        </div>
      </section>

      {currentDimensions && (
        <section className="border-border bg-background rounded-md border">
          <div className="border-border flex flex-wrap items-center justify-between gap-2 border-b px-6 py-4">
            <h2 className="text-muted-foreground text-sm font-medium">
              Dimensiones pedagógicas{' '}
              {comparison && `comparadas con ${comparison?.previous_period_name}`}
            </h2>

            {comparison && (
              <ScoreBadge
                value={comparison.current_average}
                previousValue={comparison.old_average}
                previousLabel={comparison.previous_period_name}
                tone="auto"
              />
            )}
          </div>

          <div className="divide-border divide-y">
            {currentDimensions.map((dimension) => (
              <EvaluationDimensionDetailCard
                key={dimension.dimension}
                dimension={dimension}
                overallDimension={previousDimensions?.find(
                  (item) => item.dimension === dimension.dimension,
                )}
                previousLabel={comparison?.previous_period_name}
              />
            ))}
          </div>
        </section>
      )}

      <TeacherAveragesTable
        departmentId={evaluation.department_id}
        defaultPeriodId={evaluation.academic_period_id}
        onTeacherClick={(teacher, periodId) => {
          const period = periods.find((p) => p.id === periodId)
          navigate(`/docentes/${teacher.id}?period=${period?.name}`)
        }}
      />
    </div>
  )
}
