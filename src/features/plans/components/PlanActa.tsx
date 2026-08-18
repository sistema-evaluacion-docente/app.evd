import { Stamp } from 'lucide-react'

import formatDate from '@/lib/formatDate'
import type { Plan } from '../types'

interface PlanActaProps {
  plan: Plan
  /** Only a manager is told about the lock; the teacher just reads the data. */
  canManage: boolean
}

/**
 * "ACTO ADMINISTRATIVO: ACTA No. ___ FECHA: ___" — the two blanks the Ficha de
 * acuerdo (Formato 2) prints at the foot of the agreement.
 *
 * Read-only on purpose: both are asked for in the creation form, where the rest
 * of the plan is drawn up, instead of being one more thing to fill in from the
 * screen that manages the formats.
 *
 * @example
 * <PlanActa plan={plan} canManage={isDirector} />
 */
export function PlanActa({ plan, canManage }: PlanActaProps) {
  // Nothing recorded and nobody to nag about it: the teacher doesn't need an
  // empty section on his own plan.
  if (!canManage && !plan.acta_number && !plan.acta_date) return null

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
    </section>
  )
}
