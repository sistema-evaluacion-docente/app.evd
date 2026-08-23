import { useRoute } from 'wouter'
import { Download, Eye, FileCheck2, Info, Stamp } from 'lucide-react'

import { PageTitle } from '@/components/common/PageTitle'
import { ScoreProgress } from '@/components/common/ScoreProgress'
import PlanDetailSkeleton from '@/components/skeletons/PlanDetailSkeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import formatDate from '@/lib/formatDate'
import { openPendingTab } from '@/lib/openPendingTab'
import { STATUS_TONE_CLASS } from '@/lib/statusTone'
import { InlineError } from '@/components/common/InlineError'
import {
  useDownloadDocument,
  useDownloadSignedDocument,
  useGetMyPlans,
  useGetPlanIndicators,
  usePreviewSignedDocument,
} from '../api'
import { PlanCheckpoints } from '../components/PlanCheckpoints'
import { PlanEvidences } from '../components/PlanEvidences'
import { ActaStatusBadge, PlanStatusBadge } from '../components/PlanStatusBadge'
import { PLAN_FORMATS, planProgress, planProgressStage } from '../lib/planStatus'
import type { Plan } from '../types'

/**
 * The teacher's own view of one of their improvement plans: what was agreed,
 * what they have to improve, the follow-ups and the evidence they still owe.
 *
 * The list it is reached from lives in `MyPlansPage`; this page resolves the
 * plan out of `GET /improvement-plans/my` rather than fetching it by id, so a
 * teacher can only ever land on a plan that is already theirs.
 *
 * Route: `/mis-planes/:id`
 */
export default function MyPlanDetailPage() {
  const [, params] = useRoute('/mis-planes/:id')
  const planId = params?.id ? Number(params.id) : undefined

  const { data, isPending } = useGetMyPlans()
  const { data: indicatorsResponse, isPending: aspectsPending } = useGetPlanIndicators()

  const plans = data?.data ?? []
  const aspects = indicatorsResponse?.data?.aspects ?? []

  const plan = plans.find((entry) => entry.id === planId)

  if (isPending) {
    return (
      <>
        <PageTitle>Mi plan de mejoramiento</PageTitle>
        <PlanDetailSkeleton />
      </>
    )
  }

  if (!plan) {
    return (
      <div className="space-y-6">
        <PageTitle>Mi plan de mejoramiento</PageTitle>
        <InlineError message="No encontramos este plan de mejoramiento entre los tuyos." />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      <PageTitle>Mi plan de mejoramiento</PageTitle>

      <PlanSummary plan={plan} />

      <section className="border-border bg-card overflow-hidden rounded-md border">
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
      <PlanCheckpoints plan={plan} aspects={aspects} canManage={false} isLoading={aspectsPending} />

      <PlanEvidences plan={plan} canManage={false} />

      <MyPlanDocuments plan={plan} />
    </div>
  )
}

function PlanSummary({ plan }: { plan: Plan }) {
  return (
    <section className="border-border bg-card overflow-hidden rounded-md border">
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
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <p className="text-muted-foreground text-xs tracking-wide uppercase">Avance</p>
            <p className="num text-sm font-semibold">{planProgress(plan)}%</p>
          </div>
          <ScoreProgress
            value={planProgress(plan)}
            max={100}
            decimals={0}
            interactive={false}
            label="Avance del plan"
            tooltipContent={planProgressStage(plan)}
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

      {(plan.acta_number || plan.acta_date) && (
        <p className="text-muted-foreground flex flex-wrap items-center gap-2 border-t px-6 py-3 text-sm">
          <Stamp className="size-4 shrink-0" aria-hidden="true" />
          Acta N.º{' '}
          <span className="num text-foreground font-semibold">{plan.acta_number ?? '—'}</span>
          {plan.acta_date && ` · ${formatDate(plan.acta_date, 'D [de] MMMM [de] YYYY')}`}
        </p>
      )}
    </section>
  )
}

/** Read-only access to the forms of the plan, signed copies included. */
function MyPlanDocuments({ plan }: { plan: Plan }) {
  // Formato 1 is the case the academic programme reported to the department
  // head: internal to them, and not the teacher's to read. Note this only takes
  // it off the screen — `GET /documents/{format}` is still open to any role.
  const available = PLAN_FORMATS.filter((format) => {
    if (format.slug === 'formato-1') return false

    const document = plan.documents.find((entry) => entry.format_type === format.key)

    return Boolean(document?.has_generated || document?.has_signed)
  })

  if (available.length === 0) return null

  return (
    <section className="border-border bg-card overflow-hidden rounded-md border">
      <header className="border-b px-6 py-4">
        <h2 className="font-semibold">Documentos</h2>
        <p className="text-muted-foreground text-sm">
          Formatos del plan acordado. Los que ya llevan firma aparecen aquí en cuanto la dirección
          del departamento los sube.
        </p>
      </header>

      <ul className="divide-border divide-y">
        {available.map((format) => (
          <MyPlanDocumentRow key={format.slug} plan={plan} format={format} />
        ))}
      </ul>
    </section>
  )
}

/**
 * One official form as the teacher sees it.
 *
 * The signed scan is what the plan actually is once the acta has been through
 * the Consejo — the generated PDF is only the draft it was printed from — so
 * when there is one it is what the buttons offer, and the copy says which of
 * the two is being handed over.
 */
function MyPlanDocumentRow({
  plan,
  format,
}: {
  plan: Plan
  format: (typeof PLAN_FORMATS)[number]
}) {
  const download = useDownloadDocument(plan.id)
  const downloadSigned = useDownloadSignedDocument(plan.id)
  const previewSigned = usePreviewSignedDocument(plan.id)

  const record = plan.documents.find((entry) => entry.format_type === format.key)
  const signed = Boolean(record?.has_signed)
  // Copies filed before the API kept the uploaded name fall back to a generic
  // one, so the download never saves an unnamed file.
  const signedName = record?.signed_filename ?? `${format.slug}_firmado.pdf`

  /**
   * The tab is opened on the click and not on the response — the file lives
   * behind the Bearer token, so it has no URL to link to and by the time the
   * blob lands the gesture is over and the popup blocker eats it.
   */
  function preview() {
    const tab = openPendingTab(`Abriendo ${signedName}…`)

    previewSigned.mutate(format.slug, { onSuccess: tab.settle, onError: tab.fail })
  }

  return (
    <li className="flex flex-wrap items-center gap-3 px-6 py-3">
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-sm">
          {format.name}
          {signed && (
            <Badge className={STATUS_TONE_CLASS.success}>
              <FileCheck2 className="size-3.5" aria-hidden="true" />
              Firmado
            </Badge>
          )}
        </p>

        {signed && record?.signed_at && (
          <p className="text-muted-foreground mt-0.5 text-xs">
            Firmado el {formatDate(record.signed_at)}
          </p>
        )}
      </div>

      {signed ? (
        <>
          <Button size="sm" variant="outline" onClick={preview} disabled={previewSigned.isPending}>
            <Eye className="size-4" aria-hidden="true" />
            Ver
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => downloadSigned.mutate({ format: format.slug, filename: signedName })}
            disabled={downloadSigned.isPending}
          >
            <Download className="size-4" aria-hidden="true" />
            Descargar
          </Button>
        </>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => download.mutate(format.slug)}
          disabled={download.isPending}
        >
          <Download className="size-4" aria-hidden="true" />
          Descargar
        </Button>
      )}
    </li>
  )
}
