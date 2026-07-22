import { useEffect, useState } from 'react'
import { toast } from 'sonner'

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
      connect(evaluationId)
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

      <UploadDropzone key={dropzoneKey} busy={busy} onFile={handleFile} onError={handleError} />

      {status !== 'idle' && (
        <UploadStatusCard status={status} fileName={fileName} fileSize={fileSize} error={error} />
      )}
    </>
  )
}

export default UploadEvaluationsContent
