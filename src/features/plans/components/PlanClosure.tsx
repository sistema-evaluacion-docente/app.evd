import { useState } from 'react'
import { CheckCircle2, FileCheck2, Gavel } from 'lucide-react'

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
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import formatDate from '@/lib/formatDate'
import { useClosePlan } from '../api'
import { PLAN_STATUS_LABEL } from '../lib/planStatus'
import type { CloseResult, Plan } from '../types'

interface PlanClosureProps {
  plan: Plan
}

const RESULT_OPTIONS: { value: CloseResult; label: string; hint: string }[] = [
  {
    value: 'CUMPLIDO',
    label: 'Cumplido',
    hint: 'El docente alcanzó lo acordado.',
  },
  {
    value: 'NO_CUMPLIDO',
    label: 'No cumplido',
    hint: 'Quedaron compromisos sin alcanzar.',
  },
]

/**
 * Closing of an improvement plan, the last step of the process.
 *
 * The plan runs for the semester and is settled once the Formato 3 — the
 * seguimiento matrix the teacher signs at the end — is filed signed. The
 * verdict is the director's alone. Whether the agreed targets were actually
 * met can only be told by the grades of the *following* semester, which do not
 * exist yet at this point: that verification runs on its own once those grades
 * are uploaded, and never gates the closing.
 *
 * Closing a plan belongs to the director who followed it up, so the caller is
 * the one that decides whether to draw it at all — it used to take a
 * `canManage` flag and answer it by rendering nothing, which meant mounting a
 * dialog, its state and its mutation for a teacher who could never open it.
 *
 * @example
 * {canManage && <PlanClosure plan={plan} />}
 */
export function PlanClosure({ plan }: PlanClosureProps) {
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState<CloseResult | null>(null)
  const [reason, setReason] = useState('')

  const closePlan = useClosePlan(plan.id)

  const followup = plan.documents.find((entry) => entry.format_type === 'FORMATO_3')
  const signedFollowup = Boolean(followup?.has_signed)

  function confirm() {
    if (!result) return

    closePlan.mutate(
      { result, reason: reason.trim() || undefined },
      { onSuccess: () => setOpen(false) },
    )
  }

  return (
    <section className="border-border bg-card overflow-hidden rounded-md border">
      <header className="bg-muted/50 flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4">
        <div>
          <h2 className="flex items-center gap-2 font-semibold">
            <Gavel className="text-muted-foreground size-4" aria-hidden="true" />
            Cierre del plan
          </h2>
          <p className="text-muted-foreground text-sm">
            Se cierra cuando el Plan de seguimiento (Formato 3) queda firmado por el docente.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setOpen(true)}
          disabled={!signedFollowup}
          title={
            signedFollowup
              ? undefined
              : 'Sube el Formato 3 firmado por el docente antes de cerrar el plan'
          }
        >
          <CheckCircle2 className="size-4" aria-hidden="true" />
          Cerrar plan
        </Button>
      </header>

      <div className="px-6 py-4 text-sm">
        {signedFollowup ? (
          <p className="text-muted-foreground flex flex-wrap items-center gap-2">
            <FileCheck2 className="size-4 shrink-0" aria-hidden="true" />
            Formato 3 firmado
            {followup?.signed_at && <> el {formatDate(followup.signed_at)}</>}. Ya puedes registrar
            el resultado.
          </p>
        ) : (
          <p className="text-muted-foreground">
            Falta el Formato 3 firmado. Registra los dos seguimientos, descárgalo, recoge la firma
            del docente y súbelo en «Formatos oficiales».
          </p>
        )}
      </div>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) setOpen(false)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Cerrar el plan?</DialogTitle>
            <DialogDescription>
              Queda registrado el resultado del acompañamiento. Los seguimientos y las evidencias
              pasan a solo lectura.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <RadioGroup
              value={result}
              onValueChange={(value) => setResult(value as CloseResult)}
              aria-label="Resultado del plan"
            >
              {RESULT_OPTIONS.map((option) => (
                <Label
                  key={option.value}
                  htmlFor={`result-${option.value}`}
                  className="flex cursor-pointer items-start gap-2.5"
                >
                  {/* `border-foreground` and not a literal black: on the dark
                      card a black ring is invisible, and an unchecked radio
                      nobody can make out is a control that isn't there. */}
                  <RadioGroupItem
                    value={option.value}
                    id={`result-${option.value}`}
                    className="border-foreground border-2"
                  />
                  <span className="grid gap-0.5">
                    <span>{option.label}</span>
                    <span className="text-muted-foreground block text-xs font-normal">
                      {option.hint}
                    </span>
                  </span>
                </Label>
              ))}
            </RadioGroup>

            <div className="space-y-1.5">
              <Label htmlFor="close-reason">Información adicional</Label>
              <Textarea
                id="close-reason"
                rows={2}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Opcional: agrega un comentario sobre el cierre del plan"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={closePlan.isPending}>
              Cancelar
            </Button>
            <LoadingButton
              onClick={confirm}
              disabled={!result}
              pending={closePlan.isPending}
              pendingLabel="Cerrando…"
            >
              Cerrar plan
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

/** How a closed plan reads once there is nothing left to do with it. */
export function PlanClosedSummary({ plan }: { plan: Plan }) {
  return (
    <section className="border-border bg-card overflow-hidden rounded-md border">
      <header className="bg-muted/50 border-b px-6 py-4">
        <h2 className="flex items-center gap-2 font-semibold">
          <Gavel className="text-muted-foreground size-4" aria-hidden="true" />
          Plan cerrado
        </h2>
      </header>

      <div className="flex flex-wrap gap-x-8 gap-y-2 px-6 py-4 text-sm">
        <p>
          <span className="text-muted-foreground">Resultado</span>{' '}
          <span className="font-semibold">{PLAN_STATUS_LABEL[plan.status]}</span>
        </p>
        {plan.closed_at && (
          <p>
            <span className="text-muted-foreground">Fecha</span>{' '}
            <span className="font-semibold">{formatDate(plan.closed_at)}</span>
          </p>
        )}
        {plan.close_reason && (
          <p className="w-full">
            <span className="text-muted-foreground">Motivo</span> {plan.close_reason}
          </p>
        )}
      </div>
    </section>
  )
}
