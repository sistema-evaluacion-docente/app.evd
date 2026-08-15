import { useState } from 'react'
import {
  Download,
  FileCheck2,
  FileText,
  FileType2,
  Lock,
  LockOpen,
  RefreshCw,
  Upload,
} from 'lucide-react'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { FileDropzone } from '@/components/common/FileDropzone'
import { LoadingButton } from '@/components/common/LoadingButton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import formatDate from '@/lib/formatDate'
import {
  useCloseActa,
  useDownloadDocument,
  useDownloadDocumentWord,
  useGenerateDocument,
  useReopenActa,
  useUploadSignedDocument,
} from '../api'
import { PLAN_FORMATS } from '../lib/planStatus'
import type { Plan, PlanFormatSlug } from '../types'
import { ActaStatusBadge } from './PlanStatusBadge'

interface PlanDocumentsProps {
  plan: Plan
  /** Only a manager of the plan can generate documents or upload signed copies. */
  canManage: boolean
  /** Reopening a closed acta is restricted to admins. */
  isAdmin?: boolean
}

/**
 * The three official forms of a plan: generate them filled with the plan data,
 * download them for the handwritten signatures, and upload the signed scan back.
 *
 * The acta (Formato 2) drives its own lifecycle — it must be closed before the
 * signed copy can be uploaded, and uploading it marks the acta as FIRMADA.
 *
 * @example
 * <PlanDocuments plan={plan} canManage={isDirector} />
 */
export function PlanDocuments({ plan, canManage, isAdmin = false }: PlanDocumentsProps) {
  const [uploadFor, setUploadFor] = useState<PlanFormatSlug | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [confirmClose, setConfirmClose] = useState(false)
  const [confirmReopen, setConfirmReopen] = useState(false)

  const generate = useGenerateDocument(plan.id)
  const download = useDownloadDocument(plan.id)
  const downloadWord = useDownloadDocumentWord(plan.id)
  const uploadSigned = useUploadSignedDocument(plan.id)
  const closeActa = useCloseActa(plan.id)
  const reopenActa = useReopenActa(plan.id)

  const documentFor = (key: string) => plan.documents.find((d) => d.format_type === key)

  function submitSigned() {
    if (!uploadFor || !file) return

    uploadSigned.mutate(
      { format: uploadFor, file },
      {
        onSuccess: () => {
          setUploadFor(null)
          setFile(null)
        },
      },
    )
  }

  return (
    <section className="border-border bg-background overflow-hidden rounded-md border">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4">
        <div>
          <h2 className="font-semibold">Formatos oficiales</h2>
          <p className="text-muted-foreground text-sm">
            Genera el formato, descárgalo para firmarlo y súbelo firmado.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ActaStatusBadge status={plan.acta_status} />

          {canManage && plan.acta_status === 'BORRADOR' && (
            <Button size="sm" variant="outline" onClick={() => setConfirmClose(true)}>
              <Lock className="size-4" aria-hidden="true" />
              Cerrar acta
            </Button>
          )}

          {isAdmin && plan.acta_status !== 'BORRADOR' && (
            <Button size="sm" variant="ghost" onClick={() => setConfirmReopen(true)}>
              <LockOpen className="size-4" aria-hidden="true" />
              Reabrir acta
            </Button>
          )}
        </div>
      </header>

      {plan.acta_locked && (
        <p className="bg-amber-50 px-6 py-2 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          El acta está cerrada: su contenido ya no se puede modificar. El resto del plan sigue
          editable.
        </p>
      )}

      <ul className="divide-border divide-y">
        {PLAN_FORMATS.map((format) => {
          const document = documentFor(format.key)
          const isActa = format.slug === 'formato-2'

          return (
            <li key={format.slug} className="flex flex-wrap items-center gap-4 px-6 py-4">
              <FileText className="text-muted-foreground size-5 shrink-0" aria-hidden="true" />

              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                  {format.name}
                  {document?.has_signed && (
                    <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <FileCheck2 className="size-3" aria-hidden="true" />
                      Firmado
                    </Badge>
                  )}
                </p>
                <p className="text-muted-foreground text-xs">{format.description}</p>

                {document?.generated_at && (
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    Generado el {formatDate(document.generated_at)}
                    {document.signed_at && ` · firmado el ${formatDate(document.signed_at)}`}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {/* All three are scoped to their own row: acting on one format
                    must not put the other two rows in a pending state. */}
                {canManage && (
                  <LoadingButton
                    size="sm"
                    variant="outline"
                    onClick={() => generate.mutate(format.slug)}
                    disabled={generate.isPending}
                    pending={generate.isPending && generate.variables === format.slug}
                    pendingLabel="Generando…"
                  >
                    <RefreshCw className="size-4" aria-hidden="true" />
                    {document?.has_generated ? 'Regenerar' : 'Generar'}
                  </LoadingButton>
                )}

                <LoadingButton
                  size="sm"
                  variant="secondary"
                  onClick={() => download.mutate(format.slug)}
                  disabled={!document?.has_generated}
                  pending={download.isPending && download.variables === format.slug}
                  pendingLabel="Descargando…"
                >
                  <Download className="size-4" aria-hidden="true" />
                  Descargar
                </LoadingButton>

                {/* Rendered on the fly, so it works before the PDF exists. */}
                {canManage && (
                  <LoadingButton
                    size="sm"
                    variant="ghost"
                    onClick={() => downloadWord.mutate(format.slug)}
                    pending={downloadWord.isPending && downloadWord.variables === format.slug}
                    pendingLabel="Generando…"
                    title="Descarga una copia editable para corregirla antes de firmarla"
                  >
                    <FileType2 className="size-4" aria-hidden="true" />
                    Word
                  </LoadingButton>
                )}

                {canManage && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setUploadFor(format.slug)}
                    disabled={isActa && plan.acta_status === 'BORRADOR'}
                    title={
                      isActa && plan.acta_status === 'BORRADOR'
                        ? 'Debes cerrar el acta antes de subir la versión firmada'
                        : undefined
                    }
                  >
                    <Upload className="size-4" aria-hidden="true" />
                    Subir firmado
                  </Button>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      <Dialog
        open={uploadFor !== null}
        onOpenChange={(open) => {
          if (!open) {
            setUploadFor(null)
            setFile(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subir formato firmado</DialogTitle>
            <DialogDescription>
              Adjunta el PDF escaneado con las firmas. Reemplaza cualquier versión firmada anterior.
            </DialogDescription>
          </DialogHeader>

          <FileDropzone file={file} onFileChange={setFile} isUploading={uploadSigned.isPending} />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUploadFor(null)}
              disabled={uploadSigned.isPending}
            >
              Cancelar
            </Button>
            <LoadingButton
              onClick={submitSigned}
              disabled={!file}
              pending={uploadSigned.isPending}
              pendingLabel="Subiendo…"
            >
              Subir
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmClose}
        onOpenChange={setConfirmClose}
        title="¿Cerrar el acta?"
        description="Se congelará el contenido del acta (compromisos, asignaturas, número y fecha) para poder imprimirla y firmarla. El resto del plan seguirá editable."
        confirmLabel="Cerrar acta"
        pendingLabel="Cerrando…"
        confirmVariant="default"
        isPending={closeActa.isPending}
        onConfirm={() => closeActa.mutate(undefined, { onSuccess: () => setConfirmClose(false) })}
      />

      <ConfirmDialog
        open={confirmReopen}
        onOpenChange={setConfirmReopen}
        title="¿Reabrir el acta?"
        description="El acta volverá a estado borrador y su contenido podrá modificarse de nuevo."
        confirmLabel="Reabrir"
        pendingLabel="Reabriendo…"
        confirmVariant="destructive"
        isPending={reopenActa.isPending}
        onConfirm={() => reopenActa.mutate(undefined, { onSuccess: () => setConfirmReopen(false) })}
      />
    </section>
  )
}
