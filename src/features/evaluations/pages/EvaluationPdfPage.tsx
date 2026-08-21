import { useState } from 'react'
import { useRoute } from 'wouter'

import { BackButton } from '@/components/common/BackButton'
import { PageTitle } from '@/components/common/PageTitle'
import { SegmentedControl } from '@/components/common/SegmentedControl'
import { useAuthStore } from '@/features/auth'
import { ApiError } from '@/lib/apiError'
import { MODALITIES, MODALITY_LABEL, type CourseModality } from '@/lib/modality'
import { EvaluationPdfViewer } from '../components'
import { useEvaluationPdfUrl } from '../hooks'

/**
 * Turns the API failure into what the reader can actually do about it. With a
 * modality selected, a 404 is far more likely to mean "this evaluation only
 * has the other document" than a lost file, so it says that instead.
 */
function messageFor(error: unknown, modalityLabel?: string) {
  const status = error instanceof ApiError ? error.status : undefined

  if (status === 403) {
    return 'No tiene permiso para ver este documento.'
  }

  if (status === 404) {
    return modalityLabel
      ? `Esta evaluación no tiene documento de ${modalityLabel.toLowerCase()}. Puede que solo se haya cargado el de la otra modalidad.`
      : 'No se encontró el PDF de esta evaluación. Es posible que el archivo se haya eliminado del servidor.'
  }

  return 'No fue posible cargar el documento. Intente de nuevo en unos minutos.'
}

/**
 * Full page showing the source PDF of an evaluation. The director reads the
 * whole document (`/evaluations/{id}/pdf`) and switches between the presencial
 * and distancia versions of it; the teacher reads their own report out of it
 * (`/teachers/{teacher_id}/evaluations/{id}/report`), the split the backend
 * builds for them, which already covers whatever modality they taught.
 * Route: `/evaluaciones/:id/pdf`
 */
export default function EvaluationPdfPage() {
  const [, params] = useRoute('/evaluaciones/:id/pdf')
  const selectedRole = useAuthStore((state) => state.selectedRole)
  const teacherId = useAuthStore((state) => state.user?.teacher_id) ?? undefined

  const isTeacher = selectedRole === 'DOCENTE'
  const evaluationId = params?.id ? Number(params.id) : undefined

  const [modality, setModality] = useState<CourseModality>('PRESENCIAL')
  const modalityLabel = MODALITY_LABEL[modality]

  const { url, isPending, isError, error } = useEvaluationPdfUrl({
    evaluationId,
    teacherId: isTeacher ? teacherId : undefined,
    modality: isTeacher ? undefined : modality,
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
        error={isError ? messageFor(error, isTeacher ? undefined : modalityLabel) : null}
        fileName={
          isTeacher
            ? `evaluacion-${evaluationId}.pdf`
            : `evaluacion-${evaluationId}-${modality.toLowerCase()}.pdf`
        }
        title={isTeacher ? 'Documento de la evaluación' : `Evaluación #${evaluationId}`}
        actions={
          isTeacher ? undefined : (
            // Both documents are always offered: the API doesn't announce which
            // ones exist, so an evaluation holding a single one answers 404 for
            // the other and the viewer explains it.
            <SegmentedControl
              ariaLabel="Modalidad del documento"
              options={MODALITIES}
              value={modality}
              onValueChange={setModality}
            />
          )
        }
      />
    </div>
  )
}
