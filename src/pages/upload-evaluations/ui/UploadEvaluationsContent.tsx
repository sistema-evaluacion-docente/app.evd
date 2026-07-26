import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { InfoIcon, Upload } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Link } from 'wouter'

import {
  UploadDropzone,
  UploadStatusCard,
  useEvaluationLogsContext,
  useUploadEvaluation,
} from '@/features/evaluations'
import { PageHeader } from '@/shared/ui'

/**
 * UploadEvaluationsContent component provides the UI for uploading evaluation files.
 * It includes a dropzone for file selection, status display, and real-time log updates via WebSocket.
 *
 * @returns {JSX.Element} The rendered UploadEvaluationsContent component.
 */
function UploadEvaluationsContent() {
  const [dropzoneKey] = useState(0)

  const { status, fileName, fileSize, error, upload, evaluationId } = useUploadEvaluation()

  const { connect, clearLogs } = useEvaluationLogsContext()

  useEffect(() => {
    if (evaluationId !== null) {
      connect(
        evaluationId,
        [['evaluations'], ['evaluation', String(evaluationId)]],
        `/evaluations/${evaluationId}`,
      )
    }
  }, [evaluationId, connect])

  useEffect(() => {
    if (status === 'idle') {
      clearLogs()
    }
  }, [status, clearLogs])

  const handleFile = (file: File | undefined) => {
    if (!file) return
    upload(file)
  }

  const handleError = (message: string) => {
    toast.error(message)
  }

  const busy = status === 'uploading'

  return (
    <>
      <PageHeader title="Carga de Evaluaciones Docentes" />

      <Alert className="flex items-center justify-between border bg-amber-50 p-4">
        <div className="flex items-start gap-4">
          <InfoIcon />

          <div>
            <AlertTitle className="text-base font-semibold">Carga de docentes</AlertTitle>

            <AlertDescription className="text-muted-foreground text-sm">
              Recuerde crear los docentes antes de cargar las evaluaciones. Para ello, haga clic en "Subir docentes" y cargue el archivo CSV. Una vez completado este paso, podrá proceder a subir las evaluaciones.
            </AlertDescription>
          </div>
        </div>

        <div>
          <Link href="/teachers/upload">
            <Button
              variant="outline"
              size="sm"
              className="border border-amber-300 bg-amber-200/50 text-amber-700 hover:bg-amber-300/70 hover:text-amber-700"
            >
              <Upload size={14} /> Subir docentes
            </Button>
          </Link>
        </div>
      </Alert>

      <UploadDropzone key={dropzoneKey} busy={busy} onFile={handleFile} onError={handleError} />

      {status !== 'idle' && (
        <UploadStatusCard status={status} fileName={fileName} fileSize={fileSize} error={error} />
      )}
    </>
  )
}

export default UploadEvaluationsContent
