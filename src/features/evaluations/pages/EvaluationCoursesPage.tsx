import { Info } from 'lucide-react'
import { useRoute } from 'wouter'

import { BackButton } from '@/components/common/BackButton'
import { PageTitle } from '@/components/common/PageTitle'
import { SegmentedControl } from '@/components/common/SegmentedControl'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { useModalityFilter } from '@/hooks/useModalityFilter'
import { ALL_MODALITIES, MODALITY_SEGMENTS } from '@/lib/modality'
import { useGetEvaluation } from '../api'
import { EvaluationCoursesReview, ModalityNotice } from '../components'

/**
 * Review step that follows an evaluation upload: lists the materias the PDF
 * extraction produced so the director can fix the names it cut off. An
 * evaluation can hold a presencial and a distancia document, so the list can be
 * read one modality at a time (`?modality=`) — handy right after uploading the
 * second one, to review only what it added.
 * Route: `/evaluaciones/:id/materias`.
 */
export default function EvaluationCoursesPage() {
  const [, params] = useRoute('/evaluaciones/:id/materias')
  const evaluationId = params?.id ? Number(params.id) : undefined

  const { modality, setModality } = useModalityFilter()

  const { data, isLoading } = useGetEvaluation(evaluationId)
  const evaluation = data?.data

  if (isLoading) {
    return (
      <>
        <PageTitle>Revisar materias</PageTitle>

        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </>
    )
  }

  if (!evaluation) {
    return (
      <>
        <PageTitle>Revisar materias</PageTitle>

        <p className="text-muted-foreground text-center">No se encontró la evaluación.</p>

        <div className="flex justify-center">
          <BackButton href="/evaluaciones" label="Volver a evaluaciones" />
        </div>
      </>
    )
  }

  return (
    <>
      <PageTitle
        action={
          <SegmentedControl
            ariaLabel="Modalidad"
            options={MODALITY_SEGMENTS}
            value={modality ?? ALL_MODALITIES}
            onValueChange={setModality}
            size="sm"
          />
        }
      >
        Revisar materias · {evaluation.academic_period_name}
      </PageTitle>

      <div className="space-y-5">
        <ModalityNotice modality={modality} />

        <Alert className="border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
          <Info className="size-4" aria-hidden="true" />
          <AlertTitle>Corrige los nombres que el PDF haya cortado</AlertTitle>

          <AlertDescription>
            Los nombres se extraen del PDF y suelen quedar cortados cuando son largos. Haz clic en
            el lápiz junto a un nombre para escribirlo completo; el código de la materia es el dato
            que no cambia.
          </AlertDescription>
        </Alert>

        {evaluation.status === 'PROCESSING' ? (
          <div className="border-border bg-background flex flex-col items-center gap-3 rounded-md border px-6 py-12 text-center">
            <Spinner className="text-muted-foreground size-6" />

            <p className="text-sm font-medium">Procesando la evaluación…</p>

            <p className="text-muted-foreground max-w-md text-sm">
              Las materias aparecerán aquí en cuanto termine la extracción. Puedes seguir el avance
              en el panel de registros.
            </p>
          </div>
        ) : evaluation.status === 'FAILED' ? (
          <p className="text-muted-foreground border-border bg-background rounded-md border px-6 py-12 text-center text-sm">
            El procesamiento de esta evaluación falló, así que no hay materias que revisar.
          </p>
        ) : (
          <EvaluationCoursesReview
            periodCode={evaluation.academic_period_code}
            modality={modality}
          />
        )}
      </div>
    </>
  )
}
