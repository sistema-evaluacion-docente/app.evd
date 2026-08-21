import { CheckCircle2, Info, ListChecks } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { InlineError } from '@/components/common/InlineError'
import { MultiFileDropzone } from '@/components/common/MultiFileDropzone'
import { TransitionLink } from '@/components/common/TransitionLink'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useMultiFileUpload } from '@/hooks/useFileUpload'
import { useNavigate } from '@/hooks/useNavigate'

import { evaluationsKeys, useUploadEvaluation } from '../api'
import { useEvaluationLogs } from '../hooks'

/**
 * Form that uploads the teacher-evaluation PDFs of a period: a picker taking up
 * to two documents (presencial and distancia) with PDF/10 MB validation, an
 * informational notice linking to the teacher upload page, and submit/cancel
 * actions. Only one document is required — the backend reads the modality out
 * of each PDF, so either one can travel alone — but both must belong to the
 * same academic period and department, since they are merged into a single
 * evaluation. On success it opens the progress WebSocket so the global
 * `FloatingLogs` panel streams the processing logs, and swaps the picker for
 * the review step — the PDF cuts long materia names off, so the director is
 * sent straight to correcting them.
 *
 * @example
 * <EvaluationUploadForm />
 */
export function EvaluationUploadForm() {
  const navigate = useNavigate()
  const { connect } = useEvaluationLogs()
  const upload = useUploadEvaluation()
  const { files, error, addFiles, removeFile } = useMultiFileUpload({ maxFiles: 2 })
  const [uploadedId, setUploadedId] = useState<number | null>(null)

  const uploadError = upload.error?.message || null

  const handleSubmit = () => {
    if (files.length === 0) return

    upload.mutate(files, {
      onSuccess: (result) => {
        setUploadedId(result.data.id)

        connect({
          evaluationId: result.data.id,
          queryKeysToInvalidate: [evaluationsKeys.lists()],
          detailsUrl: `/evaluaciones/${result.data.id}`,
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
          académico. Si tu departamento evalúa en las dos modalidades, puedes cargar los dos
          documentos de presencial y distancia en una sola evaluación.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {uploadedId != null ? (
          <>
            <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
              <CheckCircle2 className="size-4" aria-hidden="true" />
              <AlertTitle>Evaluación subida</AlertTitle>

              <AlertDescription>
                El procesamiento continúa en segundo plano. Cuando termine, revisa los nombres de
                las materias: el PDF suele cortarlos cuando son largos.
              </AlertDescription>
            </Alert>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => navigate('/evaluaciones')}>
                Ir a evaluaciones
              </Button>

              <Button
                type="button"
                onClick={() => navigate(`/evaluaciones/${uploadedId}/materias`)}
              >
                <ListChecks className="size-4" aria-hidden="true" />
                Revisar materias
              </Button>
            </div>
          </>
        ) : (
          <>
            <Alert className="border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
              <Info className="size-4" aria-hidden="true" />
              <AlertTitle>Asegúrate de haber subido los docentes previamente</AlertTitle>

              <AlertDescription>
                Para evitar problemas al procesar la evaluación, verifica que los docentes ya estén
                registrados antes de continuar.{' '}
                <TransitionLink href="/docentes/cargar">Ir a cargar docentes</TransitionLink>
              </AlertDescription>
            </Alert>

            <MultiFileDropzone
              label="PDF de la evaluación (uno o dos)"
              files={files}
              error={error}
              onFilesAdded={addFiles}
              onRemove={removeFile}
              maxFiles={2}
              disabled={upload.isPending}
              isUploading={upload.isPending}
              title="Selecciona uno o dos PDF"
              subtitle="Arrastra y suelta o haz clic · Máximo 10 MB por archivo"
            />

            <p className="text-muted-foreground text-sm">
              Con un solo documento basta. El segundo es opcional y solo tiene sentido si tu
              departamento evalúa en las dos modalidades: la modalidad se detecta del contenido del
              PDF, así que da igual en qué orden los cargues. Si cargas los dos,{' '}
              <span className="text-foreground font-medium">
                deben ser del mismo periodo académico y del mismo departamento
              </span>
              : se procesan juntos como una sola evaluación.
            </p>

            {uploadError && <InlineError message={uploadError} />}

            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate('/evaluaciones')}
                disabled={upload.isPending}
              >
                Cancelar
              </Button>

              <Button
                type="button"
                onClick={handleSubmit}
                disabled={files.length === 0 || upload.isPending}
              >
                {upload.isPending ? 'Subiendo…' : 'Subir evaluación'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
