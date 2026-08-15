import { useState } from 'react'
import { Check, Download, MessageSquare, Paperclip, Plus, Send, X } from 'lucide-react'

import { DatePicker } from '@/components/common/DatePicker'
import { FileDropzone } from '@/components/common/FileDropzone'
import { LoadingButton } from '@/components/common/LoadingButton'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import formatDate from '@/lib/formatDate'
import { cn } from '@/lib/utils'
import {
  useAddEvidenceComment,
  useCreateEvidenceRequest,
  useDownloadEvidence,
  useGetEvidenceRequests,
  useReviewEvidence,
  useUploadEvidence,
} from '../api'
import type { Plan, PlanEvidenceRequest } from '../types'
import { EvidenceRequestBadge, EvidenceStatusBadge } from './PlanStatusBadge'

interface PlanEvidencesProps {
  plan: Plan
  /** A manager requests and reviews; the teacher submits and replies. */
  canManage: boolean
}

/**
 * The deliverable loop: the director asks for specific evidence, the teacher
 * uploads it, both discuss it in the request thread, and the director approves
 * it or sends it back for a new submission.
 *
 * @example
 * <PlanEvidences plan={plan} canManage={isDirector} />
 */
export function PlanEvidences({ plan, canManage }: PlanEvidencesProps) {
  const [creating, setCreating] = useState(false)
  const { data, isPending } = useGetEvidenceRequests(plan.id)
  const requests = data?.data ?? []

  return (
    <section className="border-border bg-background overflow-hidden rounded-md border">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4">
        <div>
          <h2 className="font-semibold">Evidencias</h2>
          <p className="text-muted-foreground text-sm">
            Entregables solicitados al docente y su revisión.
          </p>
        </div>

        {canManage && (
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Solicitar evidencia
          </Button>
        )}
      </header>

      {isPending ? (
        <p className="text-muted-foreground px-6 py-4 text-sm">Cargando…</p>
      ) : requests.length === 0 ? (
        <p className="text-muted-foreground px-6 py-4 text-sm">
          Aún no se han solicitado evidencias en este plan.
        </p>
      ) : (
        <ul className="divide-border divide-y">
          {requests.map((request) => (
            <RequestBlock
              key={request.id}
              planId={plan.id}
              request={request}
              canManage={canManage}
            />
          ))}
        </ul>
      )}

      <NewRequestDialog planId={plan.id} plan={plan} open={creating} onOpenChange={setCreating} />
    </section>
  )
}

function RequestBlock({
  planId,
  request,
  canManage,
}: {
  planId: number
  request: PlanEvidenceRequest
  canManage: boolean
}) {
  const [comment, setComment] = useState('')
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const addComment = useAddEvidenceComment(planId)
  const upload = useUploadEvidence(planId)
  const review = useReviewEvidence(planId)
  const download = useDownloadEvidence(planId)

  function submitFile() {
    if (!file) return

    upload.mutate(
      { file, requestId: request.id },
      {
        onSuccess: () => {
          setUploading(false)
          setFile(null)
        },
      },
    )
  }

  return (
    <li className="space-y-3 px-6 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-medium">
            {request.title}
            <EvidenceRequestBadge status={request.status} />
          </p>
          {request.description && (
            <p className="text-muted-foreground text-sm">{request.description}</p>
          )}
          {request.due_date && (
            <p className="text-muted-foreground text-xs">
              Fecha límite: {formatDate(request.due_date)}
            </p>
          )}
        </div>

        <Button size="sm" variant="outline" onClick={() => setUploading(true)}>
          <Paperclip className="size-4" aria-hidden="true" />
          Adjuntar
        </Button>
      </div>

      {request.evidences.length > 0 && (
        <ul className="divide-border border-border divide-y rounded-md border">
          {request.evidences.map((evidence) => (
            <li key={evidence.id} className="flex flex-wrap items-center gap-3 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">
                  {evidence.description || `Evidencia #${evidence.id}`}
                </p>
                <p className="text-muted-foreground text-xs">
                  {evidence.uploader_name ?? 'Usuario'} ·{' '}
                  {evidence.created_at ? formatDate(evidence.created_at) : ''}
                </p>
              </div>

              <EvidenceStatusBadge status={evidence.status} />

              {/* Scoped to this row: one download must not spin every button. */}
              <LoadingButton
                size="icon"
                variant="ghost"
                aria-label="Descargar evidencia"
                onClick={() => download.mutate(evidence.id)}
                pending={download.isPending && download.variables === evidence.id}
              >
                <Download className="size-4" aria-hidden="true" />
              </LoadingButton>

              {canManage && evidence.status === 'PENDIENTE' && (
                <div className="flex gap-1">
                  <LoadingButton
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      review.mutate({
                        evidenceId: evidence.id,
                        payload: { status: 'APROBADA' },
                      })
                    }
                    disabled={review.isPending}
                    pending={
                      review.isPending &&
                      review.variables?.evidenceId === evidence.id &&
                      review.variables.payload.status === 'APROBADA'
                    }
                    pendingLabel="Aprobando…"
                  >
                    <Check className="size-3.5" aria-hidden="true" />
                    Aprobar
                  </LoadingButton>
                  <LoadingButton
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      review.mutate({
                        evidenceId: evidence.id,
                        payload: {
                          status: 'RECHAZADA',
                          comment: comment.trim() || undefined,
                        },
                      })
                    }
                    disabled={review.isPending}
                    pending={
                      review.isPending &&
                      review.variables?.evidenceId === evidence.id &&
                      review.variables.payload.status === 'RECHAZADA'
                    }
                    pendingLabel="Rechazando…"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                    Rechazar
                  </LoadingButton>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {request.comments.length > 0 && (
        <ul className="space-y-1.5">
          {request.comments.map((entry) => (
            <li
              key={entry.id}
              className={cn('text-sm', entry.is_system && 'text-muted-foreground italic')}
            >
              <span className="font-medium">
                {entry.is_system ? 'Sistema' : (entry.author_name ?? 'Usuario')}:
              </span>{' '}
              {entry.body}
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <MessageSquare className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
        <Input
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Escribe un comentario…"
          onKeyDown={(event) => {
            if (event.key === 'Enter' && comment.trim()) {
              addComment.mutate(
                { requestId: request.id, body: comment.trim() },
                { onSuccess: () => setComment('') },
              )
            }
          }}
        />
        <LoadingButton
          size="icon"
          variant="ghost"
          aria-label="Enviar comentario"
          disabled={!comment.trim()}
          pending={addComment.isPending}
          onClick={() =>
            addComment.mutate(
              { requestId: request.id, body: comment.trim() },
              { onSuccess: () => setComment('') },
            )
          }
        >
          <Send className="size-4" aria-hidden="true" />
        </LoadingButton>
      </div>

      <Dialog
        open={uploading}
        onOpenChange={(open) => {
          setUploading(open)
          if (!open) setFile(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjuntar evidencia</DialogTitle>
            <DialogDescription>{request.title}</DialogDescription>
          </DialogHeader>

          <FileDropzone file={file} onFileChange={setFile} isUploading={upload.isPending} />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUploading(false)}
              disabled={upload.isPending}
            >
              Cancelar
            </Button>
            <LoadingButton
              onClick={submitFile}
              disabled={!file}
              pending={upload.isPending}
              pendingLabel="Subiendo…"
            >
              Adjuntar
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  )
}

function NewRequestDialog({
  planId,
  plan,
  open,
  onOpenChange,
}: {
  planId: number
  plan: Plan
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  /** `null` when the evidence isn't tied to a specific commitment. */
  const [itemId, setItemId] = useState<number | null>(null)

  const create = useCreateEvidenceRequest(planId)

  function submit() {
    if (!title.trim()) return

    create.mutate(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        due_date: dueDate || undefined,
        item_id: itemId ?? undefined,
      },
      {
        onSuccess: () => {
          setTitle('')
          setDescription('')
          setDueDate('')
          setItemId(null)
          onOpenChange(false)
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Solicitar evidencia</DialogTitle>
          <DialogDescription>
            El docente recibirá una notificación con el entregable solicitado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="req-title">Título</Label>
            <Input
              id="req-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ej. Listas de asistencia semanas 1-8"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="req-desc">Descripción</Label>
            <Textarea
              id="req-desc"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Detalla qué debe contener la evidencia"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="min-w-56 space-y-1.5">
              <Label htmlFor="req-due">Fecha límite</Label>
              <DatePicker id="req-due" value={dueDate} onChange={setDueDate} />
            </div>

            {plan.items.length > 0 && (
              <div className="min-w-56 flex-1 space-y-1.5">
                <Label htmlFor="req-item">Compromiso relacionado</Label>
                <Select value={itemId} onValueChange={(value) => setItemId(value as number | null)}>
                  <SelectTrigger id="req-item" className="w-full">
                    <SelectValue placeholder="Sin relacionar">
                      {itemId != null
                        ? plan.items.find((item) => item.id === itemId)?.description.slice(0, 60)
                        : undefined}
                    </SelectValue>
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value={null}>Sin relacionar</SelectItem>
                    {plan.items.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.description.slice(0, 60)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={create.isPending}>
            Cancelar
          </Button>
          {/* The dialog closes only once the list already shows the request. */}
          <LoadingButton
            onClick={submit}
            disabled={!title.trim()}
            pending={create.isPending}
            pendingLabel="Solicitando…"
          >
            Solicitar
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
