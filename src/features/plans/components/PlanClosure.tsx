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
import { useClosePlan, useEvaluatePlan } from '../api'
import { PLAN_STATUS_LABEL } from '../lib/planStatus'
import type { CloseResult, Plan } from '../types'

interface PlanClosureProps {
  plan: Plan
  /** Closing a plan belongs to the director who followed it up. */
  canManage: boolean
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
  {
    value: 'MANUAL',
    label: 'Cierre manual',
    hint: 'Se cierra por otra razón: traslado, retiro, caso remitido a otra instancia.',
  },
]

/**
 * Closing of an improvement plan, the last step of the process.
 *
 * The plan runs for the semester and is settled once the Formato 3 — the
 * seguimiento matrix the teacher signs at the end — is filed signed. What is
 * *not* automatic is the verdict: the API needs a result, and comparing the
 * agreed targets against the verification period only *suggests* one, so the
 * director is the one who states whether the teacher complied.
 *
 * @example
 * <PlanClosure plan={plan} canManage={isDirector} />
 */
export function PlanClosure({ plan, canManage }: PlanClosureProps) {
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState<CloseResult | null>(null)
  const [reason, setReason] = useState('')

  const evaluate = useEvaluatePlan(plan.id)
  const closePlan = useClosePlan(plan.id)

  if (!canManage) return null

  const followup = plan.documents.find((entry) => entry.format_type === 'FORMATO_3')
  const signedFollowup = Boolean(followup?.has_signed)

  // `suggested_result` only comes back on the answer of `evaluate`, so it is
  // there once the verification has been run at least once.
  const suggested = plan.suggested_result as CloseResult | null
  const chosen = result ?? suggested ?? null

  function confirm() {
    if (!chosen) return

    closePlan.mutate(
      { result: chosen, reason: reason.trim() || undefined },
      { onSuccess: () => setOpen(false) },
    )
  }

  return (
    <section className="border-border bg-background overflow-hidden rounded-md border">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4">
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
            <div className="border-border space-y-2 rounded-md border p-3">
              <p className="text-sm">
                <span className="text-muted-foreground">Resultado sugerido:</span>{' '}
                <span className="font-semibold">
                  {suggested ? RESULT_OPTIONS.find((o) => o.value === suggested)?.label : '—'}
                </span>
              </p>
              <p className="text-muted-foreground text-xs">
                Se calcula comparando las metas acordadas con las notas del periodo de verificación
                {plan.verification_period_code ? ` (${plan.verification_period_code})` : ''}.
              </p>

              <LoadingButton
                size="sm"
                variant="outline"
                onClick={() => evaluate.mutate()}
                pending={evaluate.isPending}
                pendingLabel="Verificando…"
              >
                Verificar cumplimiento
              </LoadingButton>
            </div>

            <RadioGroup
              value={chosen}
              onValueChange={(value) => setResult(value as CloseResult)}
              aria-label="Resultado del plan"
            >
              {RESULT_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-start gap-2.5">
                  <RadioGroupItem value={option.value} id={`result-${option.value}`} />
                  <div className="grid gap-0.5">
                    <Label htmlFor={`result-${option.value}`}>{option.label}</Label>
                    <p className="text-muted-foreground text-xs">{option.hint}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>

            <div className="space-y-1.5">
              <Label htmlFor="close-reason">Motivo</Label>
              <Textarea
                id="close-reason"
                rows={2}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Opcional, salvo en un cierre manual"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={closePlan.isPending}>
              Cancelar
            </Button>
            <LoadingButton
              onClick={confirm}
              disabled={!chosen}
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
    <section className="border-border bg-background overflow-hidden rounded-md border">
      <header className="border-b px-6 py-4">
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
