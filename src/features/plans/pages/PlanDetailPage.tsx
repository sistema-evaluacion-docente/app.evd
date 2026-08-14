import { useRoute } from 'wouter'

import { BackButton } from '@/components/common/BackButton'
import { PageTitle } from '@/components/common/PageTitle'
import { ScoreProgress } from '@/components/common/ScoreProgress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/features/auth'
import formatDate from '@/lib/formatDate'
import { useGetPlan, useGetPlanIndicators } from '../api'
import { PlanCheckpoints } from '../components/PlanCheckpoints'
import { PlanDocuments } from '../components/PlanDocuments'
import { PlanEvidences } from '../components/PlanEvidences'
import { ActaStatusBadge, PlanStatusBadge } from '../components/PlanStatusBadge'
import { isPlanClosed } from '../lib/planStatus'

/**
 * Full detail of an improvement plan: commitments grouped by the five aspects
 * of the official forms, the two follow-ups, the evidence loop and the
 * generated/signed documents.
 *
 * Route: `/planes/:id`
 */
export default function PlanDetailPage() {
  const [, params] = useRoute('/planes/:id')
  const planId = params?.id ? Number(params.id) : undefined

  const roles = useAuthStore((state) => state.user?.roles) ?? []
  const isAdmin = roles.includes('ADMIN')
  // Improvement plans belong to the department director; an admin only keeps
  // the escape hatch to reopen a closed acta.
  const canManage = roles.includes('DIRECTOR DE DEPARTAMENTO')

  const { data, isPending } = useGetPlan(planId)
  const { data: indicatorsResponse } = useGetPlanIndicators()

  const plan = data?.data
  const aspects = indicatorsResponse?.data?.aspects ?? []

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

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

      <section className="border-border bg-background overflow-hidden rounded-md border">
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
                  <Badge variant="outline">Origen {plan.origin_period_code}</Badge>
                )}
                {plan.verification_period_code && (
                  <Badge variant="outline">
                    Verificación {plan.verification_period_code}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="min-w-48">
            <p className="text-muted-foreground mb-1 text-xs tracking-wide uppercase">
              Avance
            </p>
            <ScoreProgress
              value={plan.progress}
              max={100}
              decimals={0}
              interactive={false}
              label="Avance del plan"
            />
          </div>
        </div>

        {plan.description && (
          <p className="text-muted-foreground border-t px-6 py-3 text-sm">{plan.description}</p>
        )}

        {(plan.acta_number || plan.acta_date) && (
          <p className="text-muted-foreground border-t px-6 py-3 text-sm">
            Acta N.º <span className="num font-semibold">{plan.acta_number ?? '—'}</span>
            {plan.acta_date && ` · ${formatDate(plan.acta_date)}`}
          </p>
        )}
      </section>

      <section className="border-border bg-background overflow-hidden rounded-md border">
        <header className="border-b px-6 py-4">
          <h2 className="font-semibold">Compromisos</h2>
          <p className="text-muted-foreground text-sm">
            Agrupados por los cinco aspectos de los formatos oficiales.
          </p>
        </header>

        <div className="divide-border divide-y">
          {aspects.map((aspect) => {
            const items = plan.items.filter((item) => item.aspect === aspect.aspect)

            return (
              <div key={aspect.aspect} className="px-6 py-4">
                <h3 className="mb-2 text-sm font-semibold">
                  <span className="text-muted-foreground num mr-1.5">{aspect.aspect}.</span>
                  {aspect.label}
                </h3>

                {items.length === 0 ? (
                  <p className="text-muted-foreground text-sm italic">Sin compromisos.</p>
                ) : (
                  <ul className="space-y-3">
                    {items.map((item) => (
                      <li key={item.id} className="border-border rounded-md border p-3">
                        <p className="text-sm">{item.description}</p>
                        {item.commitment && (
                          <p className="mt-1 text-sm">
                            <span className="text-muted-foreground">Compromiso:</span>{' '}
                            {item.commitment}
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
                              Resultado:{' '}
                              <span className="num">{item.result_value.toFixed(2)}</span>
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
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {plan.courses.length > 0 && (
        <section className="border-border bg-background overflow-hidden rounded-md border">
          <header className="border-b px-6 py-4">
            <h2 className="font-semibold">Asignaturas</h2>
          </header>
          <ul className="divide-border divide-y">
            {plan.courses.map((course) => (
              <li key={course.id} className="flex flex-wrap gap-x-4 px-6 py-2.5 text-sm">
                <span className="font-medium">{course.course_name}</span>
                {course.course_code && (
                  <span className="text-muted-foreground num">{course.course_code}</span>
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
        canManage={canManage && !isPlanClosed(plan.status)}
      />

      <PlanEvidences plan={plan} canManage={canManage} />

      <PlanDocuments plan={plan} canManage={canManage} isAdmin={isAdmin} />
    </div>
  )
}
