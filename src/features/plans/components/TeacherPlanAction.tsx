import { ClipboardList, Eye, Plus } from 'lucide-react'
import { useLocation } from 'wouter'

import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/features/auth'
import { cn } from '@/lib/utils'
import { useGetPlans } from '../api'
import { PlanStatusBadge } from './PlanStatusBadge'

interface TeacherPlanActionProps {
  teacherId: number
  /** Period code the profile is showing, so the plan starts on the same one. */
  periodCode?: string
  className?: string
}

/**
 * Entry point to the improvement plan from a teacher's profile.
 *
 * Shows the plan the teacher already has (with a link to it) or, for a director
 * or admin, the button that starts a new one with the teacher and period
 * already selected. Renders nothing for a DOCENTE looking at a profile.
 *
 * @example
 * <TeacherPlanAction teacherId={teacher.teacher_id} periodCode={teacher.period_code} />
 */
export function TeacherPlanAction({
  teacherId,
  periodCode,
  className,
}: TeacherPlanActionProps) {
  const [, navigate] = useLocation()
  const roles = useAuthStore((state) => state.user?.roles) ?? []
  // Only the department director runs improvement plans.
  const canManage = roles.includes('DIRECTOR DE DEPARTAMENTO')

  const { data } = useGetPlans({ teacherId, limit: 5 })
  const plans = data?.data ?? []
  const current = plans[0]

  if (!canManage) return null

  const createHref = `/planes/nuevo?teacher=${teacherId}${
    periodCode ? `&period_code=${encodeURIComponent(periodCode)}` : ''
  }`

  return (
    <section
      className={cn(
        'border-border bg-background flex flex-wrap items-center justify-between gap-3 rounded-md border px-6 py-4',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <ClipboardList className="text-muted-foreground size-5 shrink-0" aria-hidden="true" />

        <div className="min-w-0">
          <p className="text-sm font-medium">Plan de mejoramiento</p>

          {current ? (
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
        {current && (
          <Button variant="outline" size="sm" onClick={() => navigate(`/planes/${current.id}`)}>
            <Eye className="size-4" aria-hidden="true" />
            Ver plan
          </Button>
        )}

        <Button size="sm" onClick={() => navigate(createHref)}>
          <Plus className="size-4" aria-hidden="true" />
          Crear plan de mejoramiento
        </Button>
      </div>
    </section>
  )
}
