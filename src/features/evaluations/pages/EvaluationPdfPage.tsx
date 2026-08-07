import { useRoute } from 'wouter'

import { BackButton } from '@/components/common/BackButton'
import { PageTitle } from '@/components/common/PageTitle'
import { ApiError } from '@/lib/apiError'
import { EvaluationPdfViewer } from '../components'
import { useEvaluationPdfUrl } from '../hooks'

/** Turns the API failure into what the director can actually do about it. */
function messageFor(error: unknown) {
  const status = error instanceof ApiError ? error.status : undefined

  if (status === 403) {
    return 'No tiene permiso para ver este documento. Solo puede consultarlo el director del departamento al que pertenece la evaluación.'
  }

  if (status === 404) {
    return 'No se encontró el PDF de esta evaluación. Es posible que el archivo se haya eliminado del servidor.'
  }

  return 'No fue posible cargar el documento. Intente de nuevo en unos minutos.'
}

/**
 * Full page showing the source PDF of an evaluation. Restricted to the
 * department director: the route lives under `/evaluaciones`, which
 * `src/config/security.ts` grants to `DIRECTOR DE DEPARTAMENTO` only, and the
 * endpoint enforces the same rule server-side.
 * Route: `/evaluaciones/:id/pdf`
 */
export default function EvaluationPdfPage() {
  const [, params] = useRoute('/evaluaciones/:id/pdf')

  const evaluationId = params?.id ? Number(params.id) : undefined
  const { url, isPending, isError, error } = useEvaluationPdfUrl(evaluationId)

  if (evaluationId == null || Number.isNaN(evaluationId)) {
    return (
      <>
        <PageTitle>Documento de la evaluación</PageTitle>

        <p className="text-muted-foreground py-10 text-center text-sm">
          La evaluación solicitada no es válida.
        </p>
      </>
    )
  }

  return (
    <div className="space-y-4">
      <BackButton href={`/evaluaciones/${evaluationId}`} label="Volver a la evaluación" />

      <EvaluationPdfViewer
        url={url}
        isPending={isPending}
        error={isError ? messageFor(error) : null}
        fileName={`evaluacion-${evaluationId}.pdf`}
        title={`Evaluación #${evaluationId}`}
      />
    </div>
  )
}
