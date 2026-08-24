import { Building2, Stamp } from 'lucide-react'

import formatDate from '@/lib/formatDate'
import type { Plan } from '../types'

/**
 * Las dos franjas que cierran la tarjeta de identidad de un plan, iguales en la
 * vista del director y en la del docente.
 *
 * La primera es el encabezado que imprimen los formatos oficiales — facultad,
 * departamento y programa académico. Se hereda del registro del docente
 * evaluado, así que el formulario dejó de preguntarlo; aquí es donde se lee, al
 * lado del acta, que es lo otro que identifica al plan más allá de su contenido.
 *
 * La segunda es el acto administrativo que respalda el acuerdo: dos casillas que
 * la Ficha de acuerdo imprime, y que pertenecen a la identidad del plan antes
 * que a una sección propia.
 *
 * @example
 * <PlanIdentityStrips plan={plan} />
 */
export function PlanIdentityStrips({ plan }: { plan: Plan }) {
  const header = ["Facultad " + plan.faculty_name, "Departamento " + plan.department_name].filter(Boolean)

  return (
    <>
      {header.length > 0 && (
        <p className="text-muted-foreground flex flex-wrap items-center gap-2 border-t px-6 py-3 text-sm">
          <Building2 className="size-4 shrink-0" aria-hidden="true" />
          {header.join(' · ')}
        </p>
      )}

      {(plan.acta_number || plan.acta_date) && (
        <p className="text-muted-foreground flex flex-wrap items-center gap-2 border-t px-6 py-3 text-sm">
          <Stamp className="size-4 shrink-0" aria-hidden="true" />
          Acta N.º{' '}
          <span className="num text-foreground font-semibold">{plan.acta_number ?? '—'}</span>
          {plan.acta_date && ` · ${formatDate(plan.acta_date, 'D [de] MMMM [de] YYYY')}`}
        </p>
      )}
    </>
  )
}
