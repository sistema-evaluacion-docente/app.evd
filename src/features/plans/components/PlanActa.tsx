import { useState } from 'react'
import { Info, Stamp } from 'lucide-react'

import { DatePicker } from '@/components/common/DatePicker'
import { LoadingButton } from '@/components/common/LoadingButton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import formatDate from '@/lib/formatDate'
import { useUpdatePlan } from '../api'
import type { Plan } from '../types'

interface PlanActaProps {
  plan: Plan
  /** Only the director of the plan records the acta; everyone else reads it. */
  canManage: boolean
}

/**
 * "ACTO ADMINISTRATIVO: ACTA No. ___ FECHA: ___" — the two blanks the Ficha de
 * acuerdo (Formato 2) prints at the foot of the agreement.
 *
 * They live here and not in the creation form because they come from the
 * Consejo de Departamento session, which happens after the plan is drafted; the
 * API refuses to close the acta until both are recorded.
 *
 * @example
 * <PlanActa plan={plan} canManage={isDirector} />
 */
export function PlanActa({ plan, canManage }: PlanActaProps) {
  const [number, setNumber] = useState(plan.acta_number ?? '')
  const [date, setDate] = useState(plan.acta_date ?? '')

  const update = useUpdatePlan(plan.id)

  const editable = canManage && !plan.acta_locked
  const dirty = number.trim() !== (plan.acta_number ?? '') || date !== (plan.acta_date ?? '')

  // Nothing to record and nothing recorded: the teacher doesn't need an empty
  // section on his own plan.
  if (!editable && !plan.acta_number && !plan.acta_date) return null

  function save() {
    update.mutate(
      {
        acta_number: number.trim() || undefined,
        acta_date: date || undefined,
      },
      {
        // The API leaves blanks untouched, so the fields are put back in sync
        // with what was actually stored.
        onSuccess: (response) => {
          const saved = response.data

          if (!saved) return

          setNumber(saved.acta_number ?? '')
          setDate(saved.acta_date ?? '')
        },
      },
    )
  }

  return (
    <section className="border-border bg-background overflow-hidden rounded-md border">
      <header className="border-b px-6 py-4">
        <h2 className="flex items-center gap-2 font-semibold">
          <Stamp className="text-muted-foreground size-4" aria-hidden="true" />
          Acto administrativo
        </h2>
        <p className="text-muted-foreground text-sm">
          Número y fecha del acta del Consejo de Departamento que respalda el acuerdo. Se imprimen
          en la Ficha de acuerdo (Formato 2).
        </p>
      </header>

      {editable ? (
        <div className="space-y-3 px-6 py-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-40 space-y-1.5">
              <Label htmlFor="acta-number">Acta N.º</Label>
              <Input
                id="acta-number"
                value={number}
                onChange={(event) => setNumber(event.target.value)}
                placeholder="Ej. 012"
                className="num"
              />
            </div>

            <div className="min-w-56 space-y-1.5">
              <Label htmlFor="acta-date">Fecha del acta</Label>
              <DatePicker id="acta-date" value={date} onChange={setDate} />
            </div>

            <LoadingButton
              onClick={save}
              disabled={!dirty}
              pending={update.isPending}
              pendingLabel="Guardando…"
            >
              Guardar
            </LoadingButton>
          </div>

          {(!plan.acta_number || !plan.acta_date) && (
            <p className="text-muted-foreground flex items-start gap-2 text-xs">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              Debes registrar ambos datos antes de cerrar el acta.
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap gap-x-8 gap-y-2 px-6 py-4 text-sm">
          <p>
            <span className="text-muted-foreground">Acta N.º</span>{' '}
            <span className="num font-semibold">{plan.acta_number ?? '—'}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Fecha</span>{' '}
            <span className="font-semibold">
              {formatDate(plan.acta_date, 'D [de] MMMM [de] YYYY')}
            </span>
          </p>

          {plan.acta_locked && canManage && (
            <p className="text-muted-foreground w-full text-xs">
              El acta está cerrada: su contenido ya no se puede modificar.
            </p>
          )}
        </div>
      )}
    </section>
  )
}
