import { useState } from 'react'
import { ClipboardCheck, Download, Info } from 'lucide-react'

import { PageTitle } from '@/components/common/PageTitle'
import { ScoreProgress } from '@/components/common/ScoreProgress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import formatDate from '@/lib/formatDate'
import { useDownloadDocument, useGetMyPlans, useGetPlanIndicators } from '../api'
import { PlanCheckpoints } from '../components/PlanCheckpoints'
import { PlanEvidences } from '../components/PlanEvidences'
import { ActaStatusBadge, PlanStatusBadge } from '../components/PlanStatusBadge'
import { PLAN_FORMATS } from '../lib/planStatus'
import type { Plan } from '../types'

/**
 * The teacher's own view of their improvement plan: what was agreed, what they
 * have to improve, the follow-ups and the evidence they still owe.
 *
 * Route: `/mis-planes`
 */
export default function MyPlansPage() {
  const { data, isPending } = useGetMyPlans()
  const { data: indicatorsResponse } = useGetPlanIndicators()

  const plans = data?.data ?? []
  const aspects = indicatorsResponse?.data?.aspects ?? []

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const plan = plans.find((entry) => entry.id === selectedId) ?? plans[0]

  if (isPending) {
    return (
      <>
        <PageTitle>Mi plan de mejoramiento</PageTitle>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </>
    )
  }

  if (!plan) {
    return (
      <>
        <PageTitle>Mi plan de mejoramiento</PageTitle>
        <div className="border-border text-muted-foreground flex flex-col items-center gap-2 rounded-md border border-dashed py-16 text-center">
          <ClipboardCheck className="size-8" aria-hidden="true" />
          <p className="font-medium">No tienes un plan de mejoramiento asignado.</p>
          <p className="text-sm">
            Si tu director del departamento crea uno, aparecerá aquí con los compromisos
            acordados.
          </p>
        </div>
      </>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      <PageTitle>Mi plan de mejoramiento</PageTitle>

      {plans.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {plans.map((entry) => (
            <Button
              key={entry.id}
              size="sm"
              variant={entry.id === plan.id ? 'default' : 'outline'}
              onClick={() => setSelectedId(entry.id)}
            >
              {entry.origin_period_code ?? entry.title}
            </Button>
          ))}
        </div>
      )}

      <PlanSummary plan={plan} />

      <section className="border-border bg-background overflow-hidden rounded-md border">
        <header className="border-b px-6 py-4">
          <h2 className="font-semibold">Qué debo mejorar</h2>
          <p className="text-muted-foreground text-sm">
            Compromisos acordados, agrupados por aspecto del formato oficial.
          </p>
        </header>

        <div className="divide-border divide-y">
          {aspects.map((aspect) => {
            const items = plan.items.filter((item) => item.aspect === aspect.aspect)

            if (items.length === 0) return null

            return (
              <div key={aspect.aspect} className="px-6 py-4">
                <h3 className="mb-2 text-sm font-semibold">
                  <span className="text-muted-foreground num mr-1.5">{aspect.aspect}.</span>
                  {aspect.label}
                </h3>

                <ul className="space-y-3">
                  {items.map((item) => (
                    <li key={item.id} className="border-border rounded-md border p-3">
                      <p className="text-sm">{item.description}</p>

                      {item.commitment && (
                        <p className="mt-1.5 text-sm">
                          <span className="text-muted-foreground">Mi compromiso:</span>{' '}
                          <span className="font-medium">{item.commitment}</span>
                        </p>
                      )}

                      <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-3 text-xs">
                        {item.baseline_value != null && (
                          <span>
                            Puntaje actual:{' '}
                            <span className="num font-semibold">
                              {item.baseline_value.toFixed(2)}
                            </span>
                          </span>
                        )}
                        {item.target_value != null && (
                          <span>
                            Meta:{' '}
                            <span className="num font-semibold">
                              {item.target_value.toFixed(2)}
                            </span>
                          </span>
                        )}
                        <Badge variant="outline">{item.status}</Badge>
                      </div>

                      {item.comments.length > 0 && (
                        <div className="mt-2">
                          <p className="text-muted-foreground text-xs font-medium">
                            Observaciones de los estudiantes:
                          </p>
                          <ul className="text-muted-foreground mt-1 space-y-1 text-xs">
                            {item.comments.map((comment) => (
                              <li key={comment.comment_id} className="italic">
                                “{comment.original_text}”
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </section>

      {/* A teacher reads the follow-ups but doesn't fill them in. */}
      <PlanCheckpoints plan={plan} aspects={aspects} canManage={false} />

      <PlanEvidences plan={plan} canManage={false} />

      <MyPlanDocuments plan={plan} />
    </div>
  )
}

function PlanSummary({ plan }: { plan: Plan }) {
  return (
    <section className="border-border bg-background overflow-hidden rounded-md border">
      <div className="flex flex-wrap items-start justify-between gap-4 p-6">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold">{plan.title}</h2>
          {plan.description && (
            <p className="text-muted-foreground mt-0.5 text-sm">{plan.description}</p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <PlanStatusBadge status={plan.status} />
            <ActaStatusBadge status={plan.acta_status} />
            {plan.origin_period_code && (
              <Badge variant="outline">Origen {plan.origin_period_code}</Badge>
            )}
            {plan.verification_period_code && (
              <Badge variant="outline">Se verifica en {plan.verification_period_code}</Badge>
            )}
          </div>
        </div>

        <div className="min-w-48">
          <p className="text-muted-foreground mb-1 text-xs tracking-wide uppercase">Avance</p>
          <ScoreProgress
            value={plan.progress}
            max={100}
            decimals={0}
            interactive={false}
            label="Avance del plan"
          />
        </div>
      </div>

      {plan.verification_period_code && (
        <p className="text-muted-foreground flex items-start gap-2 border-t px-6 py-3 text-sm">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          El cumplimiento se verifica con los resultados de la evaluación del periodo{' '}
          <span className="font-medium">{plan.verification_period_code}</span>.
        </p>
      )}

      {plan.acta_number && (
        <p className="text-muted-foreground border-t px-6 py-3 text-sm">
          Acta N.º <span className="num font-semibold">{plan.acta_number}</span>
          {plan.acta_date && ` · ${formatDate(plan.acta_date)}`}
        </p>
      )}
    </section>
  )
}

/** Read-only access to the signed forms of the plan. */
function MyPlanDocuments({ plan }: { plan: Plan }) {
  const download = useDownloadDocument(plan.id)

  const available = PLAN_FORMATS.filter((format) =>
    plan.documents.some((document) => document.format_type === format.key && document.has_generated),
  )

  if (available.length === 0) return null

  return (
    <section className="border-border bg-background overflow-hidden rounded-md border">
      <header className="border-b px-6 py-4">
        <h2 className="font-semibold">Documentos</h2>
        <p className="text-muted-foreground text-sm">Formatos del plan acordado.</p>
      </header>

      <ul className="divide-border divide-y">
        {available.map((format) => (
          <li key={format.slug} className="flex flex-wrap items-center gap-3 px-6 py-3">
            <span className="flex-1 text-sm">{format.name}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => download.mutate(format.slug)}
              disabled={download.isPending}
            >
              <Download className="size-4" aria-hidden="true" />
              Descargar
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}
