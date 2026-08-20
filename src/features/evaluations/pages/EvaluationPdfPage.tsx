import { useRoute } from 'wouter'

import { BackButton } from '@/components/common/BackButton'
import { PageTitle } from '@/components/common/PageTitle'
import { useAuthStore } from '@/features/auth'
import { ApiError } from '@/lib/apiError'
import { EvaluationPdfViewer } from '../components'
import { useEvaluationPdfUrl } from '../hooks'

/** Turns the API failure into what the reader can actually do about it. */
function messageFor(error: unknown) {
  const status = error instanceof ApiError ? error.status : undefined

  if (status === 403) {
    return 'No tiene permiso para ver este documento.'
  }

  if (status === 404) {
    return 'No se encontró el PDF de esta evaluación. Es posible que el archivo se haya eliminado del servidor.'
  }

  return 'No fue posible cargar el documento. Intente de nuevo en unos minutos.'
}

/**
 * Full page showing the source PDF of an evaluation. The director reads the
 * whole document (`/evaluations/{id}/pdf`); the teacher reads their own report
 * out of it (`/teachers/{teacher_id}/evaluations/{id}/report`), the split the
 * backend builds for them.
 * Route: `/evaluaciones/:id/pdf`
 */
export default function EvaluationPdfPage() {
  const [, params] = useRoute('/evaluaciones/:id/pdf')
  const selectedRole = useAuthStore((state) => state.selectedRole)
  const teacherId = useAuthStore((state) => state.user?.teacher_id) ?? undefined

  const isTeacher = selectedRole === 'DOCENTE'
  const evaluationId = params?.id ? Number(params.id) : undefined

  const { url, isPending, isError, error } = useEvaluationPdfUrl({
    evaluationId,
    teacherId: isTeacher ? teacherId : undefined,
  })

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

  if (isTeacher && teacherId == null) {
    return (
      <>
        <PageTitle>Documento de la evaluación</PageTitle>

        <p className="text-muted-foreground py-10 text-center text-sm">
          Su usuario no está vinculado a un registro de docente. Contacte al administrador del
          sistema.
        </p>
      </>
    )
  }

  return (
    <div className="space-y-4">
      {isTeacher ? (
        <BackButton fallbackHref="/periodos" label="Volver" />
      ) : (
        <BackButton href={`/evaluaciones/${evaluationId}`} label="Volver a la evaluación" />
      )}

      <EvaluationPdfViewer
        url={url}
        isPending={isPending}
        error={isError ? messageFor(error) : null}
        fileName={`evaluacion-${evaluationId}.pdf`}
        title={isTeacher ? 'Documento de la evaluación' : `Evaluación #${evaluationId}`}
      />
    </div>
  )
}
