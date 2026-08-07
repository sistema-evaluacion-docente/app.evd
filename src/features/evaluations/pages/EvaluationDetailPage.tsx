import { useRoute } from 'wouter'

import { BackButton } from '@/components/common/BackButton'
import { PageTitle } from '@/components/common/PageTitle'
import EvaluationDetailSkeleton from '@/components/skeletons/EvaluationDetailSkeleton'
import { useGetEvaluation } from '../api'
import { EvaluationDimensionsChart, EvaluationOverview } from '../components'

/**
 * Full page displaying the summary of a single evaluation.
 * Route: `/evaluaciones/:id` where `:id` is the evaluation id.
 */
export default function EvaluationDetailPage() {
  const [, params] = useRoute('/evaluaciones/:id')
  const evaluationId = params?.id ? Number(params.id) : undefined

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

  return (
    <div className="space-y-6">
      <BackButton href="/evaluaciones" label="Volver a evaluaciones" className="mb-4" />

      <EvaluationOverview evaluation={evaluation} pdfHref={`/evaluaciones/${evaluation.id}/pdf`} />

      <section className="border-border bg-background rounded-md border">
        <h2 className="border-border text-muted-foreground border-b px-6 py-4 text-sm font-medium">
          Promedios por dimensión pedagógica
        </h2>

        <div className="px-6 py-4">
          <EvaluationDimensionsChart
            dimensionAverages={evaluation.dimension_averages}
            referenceValue={evaluation.overall_average}
            referenceLabel="Promedio general"
          />
        </div>
      </section>
    </div>
  )
}
