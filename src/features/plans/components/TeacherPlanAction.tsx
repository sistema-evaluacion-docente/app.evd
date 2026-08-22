import { ClipboardList, Eye, History, Plus } from 'lucide-react'
import { useLocation } from 'wouter'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ROLE, useAuthStore } from '@/features/auth'
import { cn } from '@/lib/utils'
import { useGetPlans } from '../api'
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
 * Shows the plan the teacher already has (with a link to it and to his history
 * across every semester) or, for a director or admin, the button that starts a
 * new one with the teacher and period already selected. Renders nothing for a
 * DOCENTE looking at a profile.
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
  // Only the department director runs improvement plans, and only while that is
  // the role they are signed in as.
  const canManage = useAuthStore((state) => state.selectedRole) === ROLE.DEPARTMENT_DIRECTOR

  const { data, isPending } = useGetPlans({ teacherId, limit: 5 })
  const plans = data?.data ?? []
  const current = plans[0]

  if (!canManage) return null

  const createHref = `/planes/nuevo?teacher=${teacherId}${
    periodCode ? `&period_code=${encodeURIComponent(periodCode)}` : ''
  }`

  // The directory filters by id; the name only fills its search box, so the
  // director reads whose history he landed on.
  const name = teacherName ?? current?.teacher_name
  const historyHref = `/planes?docente=${teacherId}${
    name ? `&nombre=${encodeURIComponent(name)}` : ''
  }&periodo=todos`

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

        {!isPending && current && (
          <>
            <Button variant="outline" size="sm" onClick={() => navigate(`/planes/${current.id}`)}>
              <Eye className="size-4" aria-hidden="true" />
              Ver plan
            </Button>

            {/* Only offered when there is something to look back on: without a
                plan the directory would open on an empty table. */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(historyHref)}
              title="Ver el historial de planes de mejoramiento de este docente"
            >
              <History className="size-4" aria-hidden="true" />
              Ver historial
            </Button>
          </>
        )}

        {!isPending && (
          <Button size="sm" onClick={() => navigate(createHref)}>
            <Plus className="size-4" aria-hidden="true" />
            Crear plan de mejoramiento
          </Button>
        )}
      </div>
    </section>
  )
}
