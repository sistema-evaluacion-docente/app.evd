import { Download, Info } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { DismissibleNotice } from '@/components/common/DismissibleNotice'
import { FileDropzone } from '@/components/common/FileDropzone'
import type { LogEntry } from '@/components/common/FloatingLogs'
import { FloatingLogs } from '@/components/common/FloatingLogs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useFileUpload } from '@/hooks/useFileUpload'
import { useNavigate } from '@/hooks/useNavigate'

import { useUploadTeachers } from '../api'

const MAX_SIZE = 5 * 1024 * 1024

/**
 * Form that uploads a CSV/XLSX file with teacher records: file picker with
 * CSV/XLSX/5 MB validation and submit/cancel actions. On success it maps the
 * created, skipped and error entries into a `FloatingLogs` panel so the user
 * can review the import results inline.
 *
 * @example
 * <TeacherUploadForm />
 */
export function TeacherUploadForm() {
  const navigate = useNavigate()
  const upload = useUploadTeachers()
  const { file, error, handleFile } = useFileUpload({
    accept: ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    extensions: ['.csv', '.xlsx'],
    maxSize: MAX_SIZE,
  })

  const [logs, setLogs] = useState<LogEntry[]>([])

  const uploadError = upload.error?.message || null
  const displayedError = error ?? uploadError
  const isFinished = logs.length > 0 && !upload.isPending

  const handleSubmit = () => {
    if (!file) return

    upload.mutate(file, {
      onSuccess: (result) => {
        const entries: LogEntry[] = []

        for (const [index, item] of (result.data.created ?? []).entries()) {
          const label = item['name'] ?? item['institutional_code'] ?? `Registro ${index + 1}`
          entries.push({
            id: `created-${index}`,
            level: 'success',
            message: `Creado: ${String(label)}`,
          })
        }

        for (const [index, item] of (result.data.skipped ?? []).entries()) {
          const label = item['name'] ?? item['institutional_code'] ?? `Registro ${index + 1}`
          const reason = item['reason'] ? ` — ${String(item['reason'])}` : ''
          entries.push({
            id: `skipped-${index}`,
            level: 'warning',
            message: `Omitido: ${String(label)}${reason}`,
          })
        }

        for (const [index, item] of (result.data.errors ?? []).entries()) {
          const label = item['name'] ?? item['institutional_code'] ?? `Registro ${index + 1}`
          const reason = item['reason'] ? ` — ${String(item['reason'])}` : ''
          entries.push({
            id: `error-${index}`,
            level: 'error',
            message: `Error: ${String(label)}${reason}`,
          })
        }

        if (entries.length === 0) {
          entries.push({
            id: 'empty',
            level: 'info',
            message: 'El archivo no contenía registros para procesar.',
          })
        }

        setLogs(entries)

        const createdCount = result.data.created?.length ?? 0
        const errorCount = result.data.errors?.length ?? 0

        if (errorCount > 0) {
          toast.warning(`Importación completada con ${errorCount} error(es)`)
        } else if (createdCount > 0) {
          toast.success(`${createdCount} docente(s) importado(s) exitosamente`)
        }
      },
    })
  }

  return (
    <>
      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Cargar docentes</CardTitle>

          <CardDescription>
            Sube un archivo CSV o XLSX con los docentes de tu departamento para el periodo
            académico.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <DismissibleNotice storageKey="teachers-upload-format">
            {/* The dark variants are not decoration: without them this is
                blue-800 text on a blue-50 card in a dark theme. */}
            <Alert className="border-blue-200 bg-blue-50 pr-10 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
              <Info className="size-4" aria-hidden="true" />
              <AlertTitle>¿No conoces el formato?</AlertTitle>

              <AlertDescription className="flex items-center gap-2">
                Descarga el archivo de ejemplo para ver cómo debe estar estructurado tu CSV o XLSX.
                <a
                  href="/DocentesEjemplo.csv"
                  download
                  className="inline-flex items-center gap-1 font-medium underline hover:no-underline"
                >
                  <Download className="size-3.5" aria-hidden="true" />
                  Descargar ejemplo
                </a>
              </AlertDescription>
            </Alert>
          </DismissibleNotice>

          <FileDropzone
            file={file}
            error={displayedError}
            onFileChange={handleFile}
            accept="text/csv,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xlsx"
            maxSize={MAX_SIZE}
            disabled={upload.isPending}
            isUploading={upload.isPending}
            subtitle="Arrastra y suelta o haz clic · CSV o XLSX · Máximo 5 MB"
          />

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => navigate('/docentes')}>
              Cancelar
            </Button>

            <Button type="button" onClick={handleSubmit} disabled={!file || upload.isPending}>
              {upload.isPending ? 'Subiendo…' : 'Subir docentes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <FloatingLogs
        logs={logs}
        title="Importación de docentes"
        isFinished={isFinished}
        onClear={() => setLogs([])}
      />
    </>
  )
}
