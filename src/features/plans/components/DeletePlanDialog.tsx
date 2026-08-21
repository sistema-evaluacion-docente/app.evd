import { Trash2 } from 'lucide-react'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useDeletePlan } from '../api'
import { hasSignedActa } from '../lib/planStatus'
import type { Plan } from '../types'

interface DeletePlanDialogProps {
  /** The plan waiting for confirmation, or `null` when nothing is pending. */
  plan: Plan | null
  onOpenChange: (open: boolean) => void
  /** Run once the plan is gone — to navigate away, or clear a selection. */
  onDeleted?: (planId: number) => void
}

/**
 * Confirms deleting a plan, from wherever it is asked for.
 *
 * Shared between the directory and the plan itself so both spell out the same
 * consequences: the deletion takes the commitments, the seguimientos, the
 * evidence the teacher already submitted and the signed forms with it, and none
 * of it comes back.
 *
 * A signed agreement does not block the deletion — a plan drawn up for the
 * wrong teacher has to be undoable — but it is called out, because at that
 * point the plan is in force and the teacher is working against it.
 *
 * @example
 * <DeletePlanDialog plan={target} onOpenChange={() => setTarget(null)} />
 */
export function DeletePlanDialog({ plan, onOpenChange, onDeleted }: DeletePlanDialogProps) {
  const remove = useDeletePlan()

  const inForce = plan ? hasSignedActa(plan) : false

  return (
    <ConfirmDialog
      open={plan !== null}
      onOpenChange={onOpenChange}
      title="¿Eliminar el plan de mejoramiento?"
      description={
        plan && (
          <>
            {inForce && (
              <span className="mb-2 block rounded-md bg-amber-50 px-3 py-2 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                Este plan tiene la <strong>Ficha de acuerdo firmada</strong> y está en vigencia: el
                acuerdo con el docente queda sin efecto.
              </span>
            )}
            Se eliminará «<strong>{plan.title}</strong>»
            {plan.teacher_name && (
              <>
                {' '}
                de <strong>{plan.teacher_name}</strong>
              </>
            )}
            , junto con sus compromisos, seguimientos, evidencias entregadas y formatos.
            <br />
            Esta acción no se puede deshacer.
          </>
        )
      }
      confirmLabel="Eliminar"
      pendingLabel="Eliminando…"
      confirmVariant="destructive"
      confirmIcon={<Trash2 />}
      isPending={remove.isPending}
      onConfirm={() => {
        if (!plan) return

        remove.mutate(plan.id, {
          onSuccess: () => {
            onOpenChange(false)
            onDeleted?.(plan.id)
          },
        })
      }}
    />
  )
}
