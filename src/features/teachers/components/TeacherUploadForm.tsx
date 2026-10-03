import { ChevronRight, Download, Info, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { DismissibleNotice } from '@/components/common/DismissibleNotice'
import { FileDropzone } from '@/components/common/FileDropzone'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { MAX_UPLOAD_SIZE } from '@/config'
import { useFileUpload } from '@/hooks/useFileUpload'
import { useNavigate } from '@/hooks/useNavigate'
import { cn } from '@/lib/utils'

import { useUploadTeachers } from '../api'
import { COUNTER_TONE_CLASS, EMAIL_IMPORT_COUNTERS, EMAIL_IMPORT_STATUS } from '../config'
import type { TeacherEmailImportSummary, TeacherUploadData } from '../types'

/**
 * The import usually answers in a few hundred milliseconds, which made the
 * result pop in abruptly. The skeleton stays up at least this long.
 */
const MIN_RESULT_DELAY_MS = 1000

const STATUSES_BY_ORDER = Object.entries(EMAIL_IMPORT_STATUS).sort(
  ([, a], [, b]) => a.order - b.order,
)

/**
 * Form that uploads a CSV/XLSX with two columns — institutional code and
 * institutional email — for the director's teachers. A teacher first seen in
 * an evaluation PDF carries a placeholder email and can't log in until this
 * import gives them the real one.
 *
 * The import is synchronous, so its result arrives with the response and is
 * shown right below the form: counters per outcome, a legend of what each
 * outcome means, then every row with its reason, the ones that need
 * attention first.
 *
 * @example
 * <TeacherUploadForm />
 */
export function TeacherUploadForm() {
  const navigate = useNavigate()
  const upload = useUploadTeachers()
  const [isProcessing, setIsProcessing] = useState(false)
  const { file, error, handleFile } = useFileUpload({
    accept: ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    extensions: ['.csv', '.xlsx'],
    maxSize: MAX_UPLOAD_SIZE,
  })

  const uploadError = isProcessing ? null : upload.error?.message || null
  const displayedError = error ?? uploadError
  const result = isProcessing ? undefined : upload.data?.data

  const handleSubmit = () => {
    if (!file) return

    const startedAt = Date.now()
    setIsProcessing(true)

    upload.mutate(file, {
      onSettled: (response) => {
        const remaining = Math.max(0, MIN_RESULT_DELAY_MS - (Date.now() - startedAt))

        setTimeout(() => {
          setIsProcessing(false)
          if (response) announce(response.data.summary)
        }, remaining)
      },
    })
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Registrar correos de docentes</CardTitle>

          <CardDescription>
            Sube un archivo CSV o XLSX con el código y el correo institucional de los docentes de tu
            departamento. Con su correo registrado podrán iniciar sesión en la plataforma.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <Alert variant="destructive" className="border-destructive/40 bg-destructive/5">
            <TriangleAlert className="size-4" aria-hidden="true" />
            <AlertTitle>Antes de subir el archivo</AlertTitle>

            <AlertDescription>
              <ul className="list-disc space-y-1 pl-4">
                <li>
                  La <strong>primera fila</strong> debe ser el encabezado con las columnas{' '}
                  <strong>codigo</strong> y <strong>correo</strong>. Sin ese encabezado el archivo
                  se rechaza.
                </li>
                <li>
                  El correo debe ser <strong>institucional</strong>, terminado en{' '}
                  <strong>@ufps.edu.co</strong>. Las filas con otro dominio se marcan como error.
                </li>
              </ul>
            </AlertDescription>
          </Alert>

          <DismissibleNotice storageKey="teachers-email-import-format">
            {/* The dark variants are not decoration: without them this is
                blue-800 text on a blue-50 card in a dark theme. */}
            <Alert className="border-blue-200 bg-blue-50 pr-10 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
              <Info className="size-4" aria-hidden="true" />
              <AlertTitle>¿No conoces el formato?</AlertTitle>

              <AlertDescription className="flex flex-wrap items-center gap-2">
                Descarga el ejemplo y reemplaza sus filas por las de tus docentes. Los que aún no
                aparecen en una evaluación se registran igual: su nombre se completa al subir su
                evaluación.
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
            maxSize={MAX_UPLOAD_SIZE}
            disabled={isProcessing}
            isUploading={isProcessing}
            subtitle="Arrastra y suelta o haz clic · CSV o XLSX · Máximo 20 MB"
          />

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => navigate('/docentes')}>
              Cancelar
            </Button>

            <Button type="button" onClick={handleSubmit} disabled={!file || isProcessing}>
              {isProcessing ? 'Registrando…' : 'Registrar correos docentes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isProcessing && <ImportResultSkeleton />}
      {result && <ImportResult result={result} />}
    </div>
  )
}

/** Toast with the outcome once the result is on screen. */
function announce(summary: TeacherEmailImportSummary) {
  const applied = summary.created + summary.updated

  if (summary.errors > 0) {
    toast.warning(`Carga completada con ${summary.errors} fila(s) con error`)
  } else if (applied > 0) {
    toast.success(`${applied} docente(s) ya pueden iniciar sesión con su correo`)
  }
}

/** Placeholder with the shape of `ImportResult` while the file is processed. */
function ImportResultSkeleton() {
  return (
    <Card className="bg-card" aria-busy="true" aria-label="Procesando el archivo">
      <CardHeader className="space-y-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {EMAIL_IMPORT_COUNTERS.map((counter) => (
            <Skeleton key={counter.key} className="h-[4.5rem] rounded-lg" />
          ))}
        </div>

        <div className="space-y-2 rounded-lg border p-3">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/** Counters per outcome, the legend of outcomes and every row with its reason. */
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
          {EMAIL_IMPORT_COUNTERS.map((counter) => {
            const count = summary[counter.key]
            // Color only where something happened; an empty outcome stays grey
            // so the eye goes straight to the counters that matter.
            const tone = count > 0 ? EMAIL_IMPORT_STATUS[counter.status].tone : 'neutral'
            const Icon = counter.icon

            return (
              <div
                key={counter.key}
                className={cn(
                  'rounded-lg border px-4 py-3 transition-colors',
                  COUNTER_TONE_CLASS[tone],
                )}
              >
                <dt className="flex items-center gap-1.5 text-xs font-medium">
                  <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                  {counter.label}
                </dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums">{count}</dd>
              </div>
            )
          })}
        </dl>

        <ResultLegend />

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

/** Collapsible explanation of what each outcome in the table means. */
function ResultLegend() {
  return (
    // Only the header wears the primary red, like the app's buttons, so it
    // reads as something to click. The body is a light grey with the rows on
    // the card colour, so each badge keeps its own tone.
    <Collapsible className="overflow-hidden rounded-lg border">
      <CollapsibleTrigger className="group bg-primary text-primary-foreground hover:bg-primary-hover flex w-full items-center gap-1.5 px-4 py-2.5 text-left text-sm font-semibold transition-colors">
        <ChevronRight
          aria-hidden="true"
          className="size-4 shrink-0 transition-transform group-data-panel-open:rotate-90"
        />
        ¿Qué significa cada resultado?
      </CollapsibleTrigger>

      <CollapsibleContent>
        <dl className="bg-muted/60 space-y-2 px-4 py-3">
          {STATUSES_BY_ORDER.map(([key, status]) => (
            <div
              key={key}
              className="bg-card grid gap-1.5 rounded-md px-3 py-2.5 sm:grid-cols-[10rem_1fr] sm:items-center sm:gap-3"
            >
              <dt>
                <Badge className={cn('font-medium', status.className)}>{status.label}</Badge>
              </dt>
              <dd className="text-foreground/80 text-sm">{status.description}</dd>
            </div>
          ))}
        </dl>
      </CollapsibleContent>
    </Collapsible>
  )
}
