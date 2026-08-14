import { useState } from 'react'
import { CalendarCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useUpdateCheckpoint } from '../api'
import { CHECKPOINT_HINT, CHECKPOINT_LABEL, CHECKPOINT_ORDER } from '../lib/planStatus'
import type { Plan, PlanAspect, PlanCheckpoint } from '../types'

interface PlanCheckpointsProps {
  plan: Plan
  aspects: PlanAspect[]
  canManage: boolean
}

/**
 * The two formal follow-ups of the official form — week 8 and weeks 15/16 —
 * each recorded aspect by aspect, exactly like the matrix of Formato 3.
 *
 * @example
 * <PlanCheckpoints plan={plan} aspects={aspects} canManage={isDirector} />
 */
export function PlanCheckpoints({ plan, aspects, canManage }: PlanCheckpointsProps) {
  const ordered = CHECKPOINT_ORDER.map((stage) =>
    plan.checkpoints.find((checkpoint) => checkpoint.stage === stage),
  ).filter((checkpoint): checkpoint is PlanCheckpoint => Boolean(checkpoint))

  return (
    <section className="border-border bg-background overflow-hidden rounded-md border">
      <header className="border-b px-6 py-4">
        <h2 className="font-semibold">Seguimientos</h2>
        <p className="text-muted-foreground text-sm">
          El plan tiene dos cortes de seguimiento durante el semestre.
        </p>
      </header>

      <div className="divide-border divide-y">
        {ordered.map((checkpoint) => (
          <CheckpointBlock
            key={checkpoint.id}
            planId={plan.id}
            checkpoint={checkpoint}
            aspects={aspects}
            canManage={canManage}
          />
        ))}
      </div>
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

  const update = useUpdateCheckpoint(planId)

  function save() {
    update.mutate(
      {
        checkpointId: checkpoint.id,
        payload: {
          scheduled_date: date || undefined,
          aspect_notes: aspects.map((aspect) => ({
            aspect: aspect.aspect,
            note: notes[aspect.aspect] ?? '',
          })),
        },
      },
      { onSuccess: () => setEditing(false) },
    )
  }

  const filled = checkpoint.aspect_notes.filter((note) => note.note?.trim()).length

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
              Registrar
            </Button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="space-y-3">
          <div className="max-w-56 space-y-1.5">
            <Label htmlFor={`date-${checkpoint.id}`} className="text-xs">
              Fecha del seguimiento
            </Label>
            <Input
              id={`date-${checkpoint.id}`}
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>

          {aspects.map((aspect) => (
            <div key={aspect.aspect} className="space-y-1.5">
              <Label htmlFor={`note-${checkpoint.id}-${aspect.aspect}`} className="text-xs">
                {aspect.aspect}. {aspect.label}
              </Label>
              <Textarea
                id={`note-${checkpoint.id}-${aspect.aspect}`}
                rows={2}
                value={notes[aspect.aspect] ?? ''}
                onChange={(event) =>
                  setNotes((current) => ({ ...current, [aspect.aspect]: event.target.value }))
                }
                placeholder="Observación de este aspecto en el seguimiento"
              />
            </div>
          ))}

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={save} disabled={update.isPending}>
              {update.isPending ? 'Guardando…' : 'Guardar'}
            </Button>
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
