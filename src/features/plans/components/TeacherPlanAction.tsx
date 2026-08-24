import { ClipboardList, Eye, History, ListChecks, Plus } from 'lucide-react'
import { useState } from 'react'
import { useLocation } from 'wouter'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ROLE, useAuthStore } from '@/features/auth'
import { cn } from '@/lib/utils'
import { useGetPlans } from '../api'
import { isPlanClosed } from '../lib/planStatus'
import { IndicatorSelectionSheet } from './IndicatorSelectionSheet'
import { PlanStatusBadge } from './PlanStatusBadge'

interface TeacherPlanActionProps {
  teacherId: number
  /** Shown on the plans directory when jumping to this teacher's history. */
  teacherName?: string
  /** Period code the profile is showing, so the plan starts on the same one. */
  periodCode?: string
  className?: string
}

/**
 * Entry point to the improvement plan from a teacher's profile.
 *
 * Shows the plan the teacher already has for the period on screen (with a link
 * to it and to his history across every semester) or, for a director, the
 * button that starts a new one with the teacher and period already selected.
 * Renders nothing for a DOCENTE looking at a profile.
 *
 * A teacher can only hold one improvement plan per semester, so the two are
 * exclusive: once the period has its plan, drawing up another is not offered at
 * all. That includes a plan already closed — the follow-up of one that went
 * unmet is the *next* semester's plan, not a second one filed under the same
 * acta.
 *
 * Its verdict waits for the answer: a teacher whose plans are still on their
 * way looks exactly like one who never had any, and the director should not be
 * offered to draw up a plan that already exists.
 *
 * @example
 * <TeacherPlanAction
 *   teacherId={teacher.teacher_id}
 *   teacherName={teacher.name}
 *   periodCode={teacher.period_code}
 * />
 */
export function TeacherPlanAction({
  teacherId,
  teacherName,
  periodCode,
  className,
}: TeacherPlanActionProps) {
  const [, navigate] = useLocation()
  const [selecting, setSelecting] = useState(false)
  // Only the department director runs improvement plans, and only while that is
  // the role they are signed in as.
  const canManage = useAuthStore((state) => state.selectedRole) === ROLE.DEPARTMENT_DIRECTOR

  // The whole record, not the last few: the period is matched here because the
  // API filters plans by period *id* and a profile only knows the code. At one
  // plan per semester, twenty is a decade of them.
  const { data, isPending } = useGetPlans({ teacherId, limit: 20 })
  const plans = data?.data ?? []

  /**
   * The plan of the period the profile is showing, which — one per semester —
   * is *the* plan as far as this screen is concerned.
   *
   * `plans[0]` used to stand in for it, and the list is not ordered by period:
   * it could name another semester's plan while offering to create one for
   * this, which is how a teacher ended up with two in the same period.
   */
  const current = periodCode
    ? plans.find((plan) => plan.origin_period_code === periodCode)
    : plans[0]

  if (!canManage) return null

  // The period already has its plan; a second one is not a thing that exists.
  const canCreate = !isPending && !current

  const createHref = `/planes/nuevo?teacher=${teacherId}${
    periodCode ? `&period_code=${encodeURIComponent(periodCode)}` : ''
  }`

  // The directory filters by id; the name only fills its search box, so the
  // director reads whose history he landed on.
  const name = teacherName ?? current?.teacher_name ?? plans[0]?.teacher_name
  const historyHref = `/planes?docente=${teacherId}${
    name ? `&nombre=${encodeURIComponent(name)}` : ''
  }&periodo=todos`

  /** Plans of the teacher that belong to another semester than this profile. */
  const otherPeriods = current ? plans.length - 1 : plans.length
  const periodLabel = periodCode ? `el periodo ${periodCode}` : 'este periodo'

  /**
   * Whether the indicators of this period can still reach a plan.
   *
   * Either there is none yet — the selection starts one — or the one there is
   * still accepts content. A signed acta does not: the API refuses commitments
   * and asignaturas on it, so offering to add more would be a dead end.
   */
  const canSelect = !isPending && (!current || !current.acta_locked)

  return (
    <section
      aria-busy={isPending}
      className={cn(
        'border-border bg-background flex flex-wrap items-center justify-between gap-3 rounded-md border px-6 py-4',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <ClipboardList className="text-muted-foreground size-5 shrink-0" aria-hidden="true" />

        <div className="min-w-0">
          <p className="text-sm font-medium">Plan de mejoramiento</p>

          {isPending ? (
            <Skeleton className="mt-1.5 h-3 w-56" />
          ) : current ? (
            <p className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
              <span className="truncate">{current.title}</span>
              <PlanStatusBadge status={current.status} />
              {/* Closed, the missing "crear plan" needs saying out loud: the
                  semester has had its plan, and an unmet commitment is followed
                  up in the next one, not in a second plan filed under this. */}
              {isPlanClosed(current.status) && <span>El periodo ya tuvo su plan.</span>}
            </p>
          ) : otherPeriods > 0 ? (
            <p className="text-muted-foreground text-xs">
              Sin plan en {periodLabel}. Tiene <span className="num">{otherPeriods}</span>{' '}
              {otherPeriods === 1 ? 'plan' : 'planes'} en otros periodos.
            </p>
          ) : (
            <p className="text-muted-foreground text-xs">
              Este docente no tiene un plan de seguimiento registrado.
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2">
        {isPending && (
          <>
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-8 w-52" />
          </>
        )}

        {/* The informed way in: pick the indicators while the scores are on
            screen, and land on the form with them already drafted. «Crear
            plan» stays as the direct route for a director who would rather
            start from the form. */}
        {canSelect && (
          <Button variant="outline" size="sm" onClick={() => setSelecting(true)}>
            <ListChecks className="size-4" aria-hidden="true" />
            {current ? 'Agregar indicadores al plan' : 'Seleccionar indicadores'}
          </Button>
        )}

        {!isPending && current && (
          <Button variant="outline" size="sm" onClick={() => navigate(`/planes/${current.id}`)}>
            <Eye className="size-4" aria-hidden="true" />
            Ver plan
          </Button>
        )}

        {/* Offered as soon as there is something to look back on: without a
            single plan the directory would open on an empty table, but a
            teacher whose plans are all in other semesters is exactly who the
            history is for. */}
        {!isPending && plans.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(historyHref)}
            title="Ver el historial de planes de mejoramiento de este docente"
          >
            <History className="size-4" aria-hidden="true" />
            Ver historial
          </Button>
        )}

        {canCreate && (
          <Button size="sm" onClick={() => navigate(createHref)}>
            <Plus className="size-4" aria-hidden="true" />
            Crear plan de mejoramiento
          </Button>
        )}
      </div>

      {/* Mounted from the start but idle: every query it makes is held back by
          `open`, so the profile pays nothing until the director asks for it —
          and the panel keeps its selection, and its closing animation, instead
          of being torn out mid-transition. */}
      <IndicatorSelectionSheet
        open={selecting}
        onOpenChange={setSelecting}
        teacherId={teacherId}
        teacherName={name ?? undefined}
        periodCode={periodCode}
        target={current ? { kind: 'edit', planId: current.id } : { kind: 'new' }}
      />
    </section>
  )
}
