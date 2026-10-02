import { Download, Info } from 'lucide-react'
import { toast } from 'sonner'

import { DismissibleNotice } from '@/components/common/DismissibleNotice'
import { FileDropzone } from '@/components/common/FileDropzone'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useFileUpload } from '@/hooks/useFileUpload'
import { useNavigate } from '@/hooks/useNavigate'
import { cn } from '@/lib/utils'

import { useUploadTeachers } from '../api'
import { EMAIL_IMPORT_COUNTERS, EMAIL_IMPORT_STATUS } from '../config'
import type { TeacherUploadData } from '../types'

const MAX_SIZE = 5 * 1024 * 1024

/**
 * Form that uploads a CSV/XLSX with two columns — institutional code and
 * institutional email — for the director's teachers. A teacher first seen in
 * an evaluation PDF carries a placeholder email and can't log in until this
 * import gives them the real one.
 *
 * The import is synchronous, so its result arrives with the response and is
 * shown right below the form: counters per outcome, then every row with its
 * reason, the ones that need attention first.
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

  const uploadError = upload.error?.message || null
  const displayedError = error ?? uploadError
  const result = upload.data?.data

  const handleSubmit = () => {
    if (!file) return

    upload.mutate(file, {
      onSuccess: ({ data }) => {
        const { summary } = data
        const applied = summary.created + summary.updated

        if (summary.errors > 0) {
          toast.warning(`Carga completada con ${summary.errors} fila(s) con error`)
        } else if (applied > 0) {
          toast.success(`${applied} docente(s) ya pueden iniciar sesión con su correo`)
        }
      },
    })
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Registrar correos de docentes</CardTitle>

          <CardDescription>
            Sube un archivo CSV o XLSX con dos columnas: el código y el correo institucional
            (@ufps.edu.co) de los docentes de tu departamento. Con su correo registrado podrán
            iniciar sesión en la plataforma.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <DismissibleNotice storageKey="teachers-email-import-format">
            {/* The dark variants are not decoration: without them this is
                blue-800 text on a blue-50 card in a dark theme. */}
            <Alert className="border-blue-200 bg-blue-50 pr-10 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
              <Info className="size-4" aria-hidden="true" />
              <AlertTitle>¿No conoces el formato?</AlertTitle>

              <AlertDescription className="flex flex-wrap items-center gap-2">
                Solo se necesitan las columnas «codigo» y «correo». Los docentes que aún no aparecen
                en una evaluación se registran igual: su nombre se completa al subir su evaluación.
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

      {result && <ImportResult result={result} />}
    </div>
  )
}

/** Counters per outcome plus every row of the file with its reason. */
function ImportResult({ result }: { result: TeacherUploadData }) {
  const { summary } = result

  if (summary.total === 0) {
    return (
      <Card className="bg-card">
        <CardContent className="text-muted-foreground py-6 text-sm">
          El archivo no contenía registros para procesar.
        </CardContent>
      </Card>
    )
  }

  const rows = [...result.rows].sort(
    (a, b) =>
      EMAIL_IMPORT_STATUS[a.status].order - EMAIL_IMPORT_STATUS[b.status].order || a.row - b.row,
  )

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>Resultado de la carga</CardTitle>

        <CardDescription>
          {summary.total} fila(s) procesada(s). Las que necesitan tu atención aparecen primero.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {EMAIL_IMPORT_COUNTERS.map((counter) => (
            <div
              key={counter.key}
              className={cn(
                'rounded-lg border px-4 py-3',
                summary[counter.key] === 0 && 'opacity-60',
              )}
            >
              <dt className="text-muted-foreground text-xs">{counter.label}</dt>
              <dd className="text-2xl font-semibold tabular-nums">{summary[counter.key]}</dd>
            </div>
          ))}
        </dl>

        <div className="max-h-[28rem] overflow-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Fila</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead>Detalle</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.map((row) => {
                const status = EMAIL_IMPORT_STATUS[row.status]

                return (
                  <TableRow key={row.row}>
                    <TableCell className="tabular-nums">{row.row}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {row.institutional_code || '—'}
                    </TableCell>
                    <TableCell className="text-xs">{row.email || '—'}</TableCell>
                    <TableCell>
                      <Badge className={cn('font-medium', status.className)}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-normal">
                      {row.detail}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
