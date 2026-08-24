import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useRoute } from 'wouter'

import { BackButton } from '@/components/common/BackButton'
import { PageTitle } from '@/components/common/PageTitle'
import { ScoreProgress } from '@/components/common/ScoreProgress'
import PlanDetailSkeleton from '@/components/skeletons/PlanDetailSkeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ROLE, useAuthStore } from '@/features/auth'
import { NotFoundPage } from '@/features/not-found'
import { useNavigate } from '@/hooks/useNavigate'
import { useGetPlan, useGetPlanIndicators } from '../api'
import { DeletePlanDialog } from '../components/DeletePlanDialog'
import { PlanCheckpoints } from '../components/PlanCheckpoints'
import { PlanClosedSummary, PlanClosure } from '../components/PlanClosure'
import { PlanDocuments } from '../components/PlanDocuments'
import { PlanEvidences } from '../components/PlanEvidences'
import { PlanIdentityStrips } from '../components/PlanIdentityStrips'
import { ActaStatusBadge, PlanStatusBadge } from '../components/PlanStatusBadge'
import { PlanVerification } from '../components/PlanVerification'
import { hasSignedActa, isPlanClosed, planProgress, planProgressStage } from '../lib/planStatus'
import type { PlanItem } from '../types'

/**
 * Full detail of an improvement plan: commitments grouped by the five aspects
 * of the official forms, the two follow-ups, the evidence loop and the
 * generated/signed documents.
 *
 * Route: `/planes/:id`
 */
export default function PlanDetailPage() {
  const navigate = useNavigate()

  const [, params] = useRoute('/planes/:id')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const planId = params?.id && !isNaN(Number(params.id)) ? Number(params.id) : undefined
  const canManage = useAuthStore((state) => state.selectedRole) === ROLE.DEPARTMENT_DIRECTOR

  const { data, isPending } = useGetPlan(planId)
  const { data: indicatorsResponse, isPending: aspectsPending } = useGetPlanIndicators()

  if (!planId || (!isPending && !data)) {
    return <NotFoundPage bgActive={false} />
  }

  const plan = data?.data
  const aspects = indicatorsResponse?.data?.aspects ?? []

  const committedAspects = aspects.filter((aspect) =>
    plan?.items.some((item) => item.aspect === aspect.aspect),
  )
  const unassignedItems = plan?.items.filter((item) => item.aspect == null) ?? []

  const signedActa = plan ? hasSignedActa(plan) : false
  const closed = plan ? isPlanClosed(plan.status) : false
  const canEdit = Boolean(canManage && plan && !closed && !signedActa)

  if (isPending) return <PlanDetailSkeleton withAvatar />

  if (!plan) {
    return (
      <>
        <PageTitle>Plan de mejoramiento</PageTitle>
        <p className="text-muted-foreground text-center">No se encontró el plan.</p>
      </>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      <BackButton href="/planes" className="mb-2" />

      <section className="border-border bg-card overflow-hidden rounded-md border">
        <div className="flex flex-wrap items-start justify-between gap-4 p-6">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="size-12">
              <AvatarImage src={plan.teacher_avatar_url ?? undefined} />
              <AvatarFallback>{plan.teacher_name?.slice(0, 2) ?? '??'}</AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold">{plan.title}</h1>
              <p className="text-muted-foreground text-sm">{plan.teacher_name}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <PlanStatusBadge status={plan.status} />
                <ActaStatusBadge status={plan.acta_status} />
                {plan.origin_period_code && (
                  <Badge variant="outline">Periodo {plan.origin_period_code}</Badge>
                )}
                {plan.verification_period_code && (
                  <Badge variant="outline">Verificación {plan.verification_period_code}</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-start gap-4">
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

            <div className="flex flex-wrap items-center gap-2">
              {canEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  render={<Link href={`/planes/${plan.id}/editar`} />}
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  Editar
                </Button>
              )}

              {canManage && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmDelete(true)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Eliminar
                </Button>
              )}
            </div>
          </div>
        </div>

        {plan.description && (
          <p className="text-muted-foreground border-t px-6 py-3 text-sm">{plan.description}</p>
        )}

        <PlanIdentityStrips plan={plan} />
      </section>

      <section className="border-border bg-card overflow-hidden rounded-md border">
        <header className="bg-muted/50 border-b px-6 py-4">
          <h2 className="font-semibold">Compromisos</h2>
          <p className="text-muted-foreground text-sm">
            {commitmentsSummary(plan.items.length)}
          </p>
        </header>

        {plan.items.length === 0 && (
          <p className="text-muted-foreground px-6 py-4 text-sm">
            Este plan todavía no tiene compromisos registrados.
          </p>
        )}

        <div className="divide-border divide-y">
          {committedAspects.map((aspect) => (
            <div key={aspect.aspect} className="px-6 py-4">
              <h3 className="mb-2 text-sm font-semibold">
                <span className="text-muted-foreground num mr-1.5">{aspect.aspect}.</span>
                {aspect.label}
              </h3>

              <ul className="space-y-3">
                {plan.items
                  .filter((item) => item.aspect === aspect.aspect)
                  .map((item) => (
                    <CommitmentCard key={item.id} item={item} />
                  ))}
              </ul>
            </div>
          ))}

          {/* Commitments the director never filed under an aspect. They don't
              reach the official forms, so they are called out here. */}
          {unassignedItems.length > 0 && (
            <div className="px-6 py-4">
              <h3 className="mb-2 text-sm font-semibold">Sin aspecto asignado</h3>
              <ul className="space-y-3">
                {unassignedItems.map((item) => (
                  <CommitmentCard key={item.id} item={item} />
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {plan.courses.length > 0 && (
        <section className="border-border bg-card overflow-hidden rounded-md border">
          <header className="bg-muted/50 border-b px-6 py-4">
            <h2 className="font-semibold">Asignaturas</h2>
          </header>
          <ul className="divide-border divide-y">
            {plan.courses.map((course) => (
              <li key={course.id} className="flex flex-wrap gap-x-4 px-6 py-2.5 text-sm">
                <span className="font-medium">{course.course_name}</span>
                {course.course_code && (
                  <span className="text-muted-foreground num">{course.course_code}</span>
                )}
                {course.program_name && (
                  <span className="text-muted-foreground">{course.program_name}</span>
                )}
                {course.group_name && (
                  <span className="text-muted-foreground">Grupo {course.group_name}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <PlanCheckpoints
        plan={plan}
        aspects={aspects}
        canManage={canManage && !closed}
        isLoading={aspectsPending}
      />

      <PlanEvidences plan={plan} canManage={canManage && !closed} />

      <PlanDocuments plan={plan} canManage={canManage} />

      {closed ? <PlanClosedSummary plan={plan} /> : canManage && <PlanClosure plan={plan} />}

      {/* Only once the plan is settled, or once the answer already arrived: on
          a plan still running it would say nothing but "we are waiting". */}
      {(closed || plan.verification) && (
        <PlanVerification
          verification={plan.verification}
          verificationPeriodCode={plan.verification_period_code}
        />
      )}

      <DeletePlanDialog
        plan={confirmDelete ? plan : null}
        onOpenChange={() => setConfirmDelete(false)}
        onDeleted={() => navigate('/planes')}
      />
    </div>
  )
}

/** One agreed commitment: what was detected, what was promised, how it stands. */
/**
 * The line under "Compromisos", which leads with the commitments themselves.
 *
 * It used to count only the aspects, and that reads as a miscount: two
 * commitments filed under the same aspect printed "1 de 5 aspectos con
 * compromisos" directly above two cards. The same happened to a commitment left
 * without an aspect — it showed below, uncounted. The coverage of the five
 * aspects of the official form is still worth saying, so it follows as context,
 * and is left out while the catalogue is on its way: "0 de 0" says nothing.
 *
 * @example
 * commitmentsSummary(2) // → '2 compromisos'
 */
function commitmentsSummary(total: number): string {
  return `${total} ${total === 1 ? 'compromiso' : 'compromisos'} `
}

function CommitmentCard({ item }: { item: PlanItem }) {
  return (
    <li className="border-border rounded-md border p-3">
      <p className="text-sm">{item.description}</p>
      {item.commitment && (
        <p className="mt-1 text-sm">
          <span className="text-muted-foreground">Compromiso:</span> {item.commitment}
        </p>
      )}

      <div className="text-muted-foreground mt-1.5 flex flex-wrap gap-3 text-xs">
        {item.baseline_value != null && (
          <span>
            Base: <span className="num">{item.baseline_value.toFixed(2)}</span>
          </span>
        )}
        {item.target_value != null && (
          <span>
            Meta: <span className="num">{item.target_value.toFixed(2)}</span>
          </span>
        )}
        {item.result_value != null && (
          <span>
            Resultado: <span className="num">{item.result_value.toFixed(2)}</span>
          </span>
        )}
        <Badge variant="outline">{item.status}</Badge>
      </div>

      {item.comments.length > 0 && (
        <ul className="text-muted-foreground mt-2 space-y-1 text-xs">
          {item.comments.map((comment) => (
            <li key={comment.comment_id} className="italic">
              “{comment.original_text}”
              {comment.risk_level_name && ` · riesgo ${comment.risk_level_name}`}
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}
