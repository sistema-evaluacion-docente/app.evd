import { CheckCircle2, Info, ListChecks } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { DismissibleNotice } from '@/components/common/DismissibleNotice'
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
          Carga el PDF con las evaluaciones de tu departamento para el periodo académico. Si el
          departamento tiene grupos presenciales y a distancia, sube un PDF por modalidad — el
          sistema los combina automáticamente en una sola evaluación.
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
                las materias: el PDF suele cortarlos cuando son largos. Luego entra a "Ver
                evaluación" para iniciar el análisis con IA — ahí verás un botón "Analizar" junto al
                estado del análisis.
              </AlertDescription>
            </Alert>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate(`/evaluaciones/${uploadedId}`)}
              >
                Ver evaluación
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
            <DismissibleNotice storageKey="evaluation-upload-teachers-first">
              <Alert className="border-blue-200 bg-blue-50 pr-10 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
                <Info className="size-4" aria-hidden="true" />
                <AlertTitle>Asegúrate de haber subido los docentes previamente</AlertTitle>

                <AlertDescription>
                  Para evitar problemas al procesar la evaluación, verifica que los docentes ya
                  estén registrados antes de continuar.{' '}
                  <TransitionLink href="/docentes/cargar">Ir a cargar docentes</TransitionLink>
                </AlertDescription>
              </Alert>
            </DismissibleNotice>

            <MultiFileDropzone
              label="PDF de la evaluación (uno por modalidad)"
              files={files}
              error={error}
              onFilesAdded={addFiles}
              onRemove={removeFile}
              maxFiles={2}
              disabled={upload.isPending}
              isUploading={upload.isPending}
              title="Selecciona los PDF"
              subtitle="Arrastra y suelta o haz clic · Máximo 10 MB por archivo"
            />

            <p className="text-muted-foreground text-sm">
              La modalidad de cada PDF se detecta automáticamente por su contenido, así que da igual
              en qué orden los subas. Eso sí: si cargas los dos,{' '}
              <span className="text-foreground font-medium">
                deben ser del mismo periodo académico y del mismo departamento
              </span>
              .
            </p>

            {uploadError && <InlineError message={uploadError} onDismiss={() => upload.reset()} />}

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
