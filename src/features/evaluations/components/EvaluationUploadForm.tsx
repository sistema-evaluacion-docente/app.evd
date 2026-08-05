import { Info } from 'lucide-react'
import { toast } from 'sonner'

import { FileDropzone } from '@/components/common/FileDropzone'
import { TransitionLink } from '@/components/common/TransitionLink'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useFileUpload } from '@/hooks/useFileUpload'
import { useNavigate } from '@/hooks/useNavigate'

import { evaluationsKeys, useUploadEvaluation } from '../api'
import { useEvaluationLogs } from '../hooks'

/**
 * Form that uploads the teacher-evaluation PDF of a period: file picker with
 * PDF/10 MB validation, an informational notice linking to the teacher upload
 * page, and submit/cancel actions. On success it opens the progress WebSocket
 * so the global `FloatingLogs` panel streams the processing logs.
 *
 * @example
 * <EvaluationUploadForm />
 */
export function EvaluationUploadForm() {
  const navigate = useNavigate()
  const { connect } = useEvaluationLogs()
  const upload = useUploadEvaluation()
  const { file, error, handleFile } = useFileUpload()

  const uploadError = upload.error?.message || null
  const displayedError = error ?? uploadError

  const handleSubmit = () => {
    if (!file) return

    upload.mutate(file, {
      onSuccess: (result) => {
        connect({
          evaluationId: result.data.id,
          queryKeysToInvalidate: [evaluationsKeys.lists()],
          detailsUrl: '/evaluations',
        })
        toast.success('Evaluación subida. El procesamiento continúa en segundo plano.')
      },
    })
  }

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>Subir evaluación docente</CardTitle>
        <CardDescription>
          Carga el PDF con las evaluaciones de los docentes de tu departamento para el período
          académico.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <Alert className="border-blue-200 bg-blue-50 text-blue-800">
          <Info className="size-4" aria-hidden="true" />
          <AlertTitle>Asegúrate de haber subido los docentes previamente</AlertTitle>

          <AlertDescription>
            Para evitar problemas al procesar la evaluación, verifica que los docentes ya estén
            registrados antes de continuar.{' '}
            <TransitionLink href="/teachers/upload">Ir a cargar docentes</TransitionLink>
          </AlertDescription>
        </Alert>

        <FileDropzone
          file={file}
          error={displayedError}
          onFileChange={handleFile}
          disabled={upload.isPending}
          isUploading={upload.isPending}
          subtitle="Arrastra y suelta o haz clic · Máximo 10 MB"
        />

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => navigate('/evaluations')}>
            Cancelar
          </Button>

          <Button type="button" onClick={handleSubmit} disabled={!file || upload.isPending}>
            {upload.isPending ? 'Subiendo…' : 'Subir evaluación'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
