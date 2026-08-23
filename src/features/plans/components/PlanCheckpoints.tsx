import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CalendarCheck, Pencil } from 'lucide-react'

import { DatePicker } from '@/components/common/DatePicker'
import { FieldError } from '@/components/common/FieldError'
import { LoadingButton } from '@/components/common/LoadingButton'
import { Required } from '@/components/common/Required'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { fieldErrorId } from '@/lib/fieldErrorId'
import { useUpdateCheckpoint } from '../api'
import { checkpointErrors, checkpointFieldId, focusField } from '../lib/planValidation'
import {
  CHECKPOINT_HINT,
  CHECKPOINT_LABEL,
  CHECKPOINT_ORDER,
  isCheckpointRecorded,
} from '../lib/planStatus'
import type { Plan, PlanAspect, PlanCheckpoint } from '../types'

interface PlanCheckpointsProps {
  plan: Plan
  aspects: PlanAspect[]
  canManage: boolean
  /**
   * Whether the aspect catalogue is still on its way. The aspects arrive from
   * their own request, so without this the section would claim there is nothing
   * to follow up on while it waits — a lie that reads as a broken plan.
   */
  isLoading?: boolean
}

/**
 * The two formal follow-ups of the official form — week 8 and weeks 15/16 —
 * each recorded aspect by aspect, exactly like the matrix of Formato 3.
 *
 * @example
 * <PlanCheckpoints plan={plan} aspects={aspects} canManage={isDirector} />
 */
export function PlanCheckpoints({
  plan,
  aspects,
  canManage,
  isLoading = false,
}: PlanCheckpointsProps) {
  const ordered = CHECKPOINT_ORDER.map((stage) =>
    plan.checkpoints.find((checkpoint) => checkpoint.stage === stage),
  ).filter((checkpoint): checkpoint is PlanCheckpoint => Boolean(checkpoint))

  /**
   * Only the aspects the plan actually commits to are followed up — plus any
   * that already carry a note, so nothing recorded earlier disappears from
   * view (or from the payload) when the commitments change.
   */
  const tracked = aspects.filter(
    (aspect) =>
      plan.items.some((item) => item.aspect === aspect.aspect) ||
      plan.checkpoints.some((checkpoint) =>
        checkpoint.aspect_notes.some((note) => note.aspect === aspect.aspect && note.note?.trim()),
      ),
  )

  return (
    <section className="border-border bg-card overflow-hidden rounded-md border">
      <header className="bg-muted/50 border-b px-6 py-4">
        <h2 className="font-semibold">Seguimientos</h2>
        <p className="text-muted-foreground text-sm">
          El plan tiene dos cortes de seguimiento durante el semestre.
        </p>
      </header>

      {isLoading ? (
        <CheckpointsSkeleton />
      ) : tracked.length === 0 ? (
        <p className="text-muted-foreground px-6 py-4 text-sm">
          No hay compromisos a los que hacer seguimiento todavía.
        </p>
      ) : (
        <div className="divide-border divide-y">
          {ordered.map((checkpoint) => (
            <CheckpointBlock
              key={checkpoint.id}
              planId={plan.id}
              checkpoint={checkpoint}
              aspects={tracked}
              canManage={canManage}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function CheckpointBlock({
  planId,
  checkpoint,
  aspects,
  canManage,
}: {
  planId: number
  checkpoint: PlanCheckpoint
  aspects: PlanAspect[]
  canManage: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [date, setDate] = useState(checkpoint.scheduled_date ?? '')
  const [notes, setNotes] = useState<Record<number, string>>(() =>
    Object.fromEntries(
      aspects.map((aspect) => [
        aspect.aspect,
        checkpoint.aspect_notes.find((note) => note.aspect === aspect.aspect)?.note ?? '',
      ]),
    ),
  )

  // Same bookkeeping as the plan form: a field goes red once it is left empty,
  // not while it is still waiting its turn, and a failed save turns every
  // pending error on at once.
  const [touched, setTouched] = useState<ReadonlySet<string>>(() => new Set())
  const [showAllErrors, setShowAllErrors] = useState(false)

  const update = useUpdateCheckpoint(planId)

  const errors = useMemo(
    () => checkpointErrors({ checkpointId: checkpoint.id, date, aspects, notes }),
    [checkpoint.id, date, aspects, notes],
  )

  const invalidFields = useMemo<ReadonlyMap<string, string>>(
    () =>
      new Map(
        errors
          .filter((error) => showAllErrors || touched.has(error.id))
          .map((error) => [error.id, error.message]),
      ),
    [errors, showAllErrors, touched],
  )

  function markTouched(id: string) {
    setTouched((current) => (current.has(id) ? current : new Set(current).add(id)))
  }

  /** Leaves the editor, and leaves the red behind with it. */
  function close() {
    setEditing(false)
    setTouched(new Set())
    setShowAllErrors(false)
  }

  function save() {
    if (errors.length > 0) {
      // The button stays live on purpose: a disabled one never says why. The
      // toast says what happened, the red says which fields, and the scroll
      // puts the cursor in the first of them.
      setShowAllErrors(true)
      toast.warning('Faltan campos obligatorios por completar.', {
        description: 'Revisa los campos marcados en rojo.',
      })
      focusField(errors[0].id)

      return
    }

    update.mutate(
      {
        checkpointId: checkpoint.id,
        payload: {
          scheduled_date: date,
          aspect_notes: aspects.map((aspect) => ({
            aspect: aspect.aspect,
            note: (notes[aspect.aspect] ?? '').trim(),
          })),
        },
      },
      { onSuccess: close },
    )
  }

  const filled = checkpoint.aspect_notes.filter((note) => note.note?.trim()).length

  // Once the cut is on the record the button stops asking for it and offers to
  // correct it instead — "Registrar" on a seguimiento already written up reads
  // as if nothing had been saved.
  const recorded = isCheckpointRecorded(checkpoint)

  return (
    <div className="space-y-3 px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <CalendarCheck className="text-muted-foreground size-4" aria-hidden="true" />
            {CHECKPOINT_LABEL[checkpoint.stage]}
          </h3>
          <p className="text-muted-foreground text-xs">{CHECKPOINT_HINT[checkpoint.stage]}</p>
        </div>

        <div className="flex items-center gap-3">
          <p className="text-muted-foreground text-xs">
            <span className="num font-semibold">{filled}</span>/{aspects.length} aspectos
            registrados
          </p>

          {canManage && !editing && (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              {recorded && <Pencil className="size-3.5" aria-hidden="true" />}
              {recorded ? 'Editar' : 'Registrar'}
            </Button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="space-y-3">
          <div className="max-w-56 space-y-1.5">
            <Label htmlFor={checkpointFieldId.date(checkpoint.id)} className="text-xs">
              Fecha del seguimiento <Required />
            </Label>
            <DatePicker
              id={checkpointFieldId.date(checkpoint.id)}
              value={date}
              onChange={setDate}
              invalid={invalidFields.has(checkpointFieldId.date(checkpoint.id))}
              describedBy={
                invalidFields.has(checkpointFieldId.date(checkpoint.id))
                  ? fieldErrorId(checkpointFieldId.date(checkpoint.id))
                  : undefined
              }
              onBlur={() => markTouched(checkpointFieldId.date(checkpoint.id))}
            />

            <FieldError
              fieldId={checkpointFieldId.date(checkpoint.id)}
              message={invalidFields.get(checkpointFieldId.date(checkpoint.id))}
            />
          </div>

          {aspects.map((aspect) => {
            const noteId = checkpointFieldId.note(checkpoint.id, aspect.aspect)

            return (
              <div key={aspect.aspect} className="space-y-1.5">
                <Label htmlFor={noteId} className="text-xs">
                  {aspect.aspect}. {aspect.label} <Required />
                </Label>
                <Textarea
                  id={noteId}
                  rows={2}
                  value={notes[aspect.aspect] ?? ''}
                  onChange={(event) =>
                    setNotes((current) => ({ ...current, [aspect.aspect]: event.target.value }))
                  }
                  onBlur={() => markTouched(noteId)}
                  aria-invalid={invalidFields.has(noteId)}
                  aria-describedby={invalidFields.has(noteId) ? fieldErrorId(noteId) : undefined}
                  placeholder="Observación de este aspecto en el seguimiento"
                />

                <FieldError fieldId={noteId} message={invalidFields.get(noteId)} />
              </div>
            )
          })}

          <div className="flex flex-wrap items-center justify-end gap-2">
            {showAllErrors && errors.length > 0 && (
              <p className="text-destructive mr-auto text-xs" role="alert">
                {errors.length === 1
                  ? 'Falta 1 campo obligatorio por completar.'
                  : `Faltan ${errors.length} campos obligatorios por completar.`}
              </p>
            )}

            <Button variant="outline" size="sm" onClick={close} disabled={update.isPending}>
              Cancelar
            </Button>
            {/* Stays open and spinning until the refreshed plan is on screen. */}
            <LoadingButton
              size="sm"
              onClick={save}
              pending={update.isPending}
              pendingLabel="Guardando…"
            >
              Guardar
            </LoadingButton>
          </div>
        </div>
      ) : (
        <ul className="space-y-1.5">
          {aspects.map((aspect) => {
            const note = checkpoint.aspect_notes.find((n) => n.aspect === aspect.aspect)?.note

            return (
              <li key={aspect.aspect} className="text-sm">
                <span className="text-muted-foreground">
                  {aspect.aspect}. {aspect.label}:
                </span>{' '}
                {note?.trim() ? (
                  note
                ) : (
                  <span className="text-muted-foreground italic">sin registro</span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/** Two cuts' worth of placeholder rows, drawn where the real ones will land. */
function CheckpointsSkeleton() {
  return (
    <div className="divide-border divide-y" role="status" aria-busy="true">
      <span className="sr-only">Cargando los seguimientos…</span>

      {CHECKPOINT_ORDER.map((stage) => (
        <div key={stage} className="space-y-3 px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
            <Skeleton className="h-3 w-32" />
          </div>

          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-10/12" />
            <Skeleton className="h-3.5 w-7/12" />
          </div>
        </div>
      ))}
    </div>
  )
}
