import { Eye, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useNavigate } from '@/hooks/useNavigate'
import { useGetPlans } from '../api'
import { formatPicks } from '../lib/planPicks'
import { followUpPicks } from '../lib/verification'
import type { Plan, PlanIndicators } from '../types'

interface VerificationFollowUpActionProps {
  plan: Plan
  /** Catalogue of indicators, to name the aspect a dimension belongs to. */
  catalogue?: PlanIndicators
}

/**
 * The way out of a verification that came back "No mejoró".
 *
 * A teacher holds one improvement plan per semester, so the follow-up of an
 * unmet plan is the *next* semester's plan — the one for the very period the
 * verification measured — and never a second plan filed under this acta. That
 * is why this starts a new plan on `verification.period_code` instead of
 * reopening the closed one.
 *
 * It carries the reincidencia with it: the indicators that were missed and the
 * student comments that came back travel in the `picks` parameter, so the
 * director does not have to remember them and mark them again by hand.
 *
 * Renders nothing while the teacher's plans are on their way: one that already
 * has the follow-up looks exactly like one that never had it, and offering to
 * create a plan that exists is how a teacher ends up with two in a semester.
 *
 * @example
 * <VerificationFollowUpAction plan={plan} catalogue={indicators} />
 */
export function VerificationFollowUpAction({ plan, catalogue }: VerificationFollowUpActionProps) {
  const navigate = useNavigate()

  // The whole record, not the last few, and the same query `TeacherPlanAction`
  // makes — so on the way here from a profile it is already in cache.
  const { data, isPending } = useGetPlans({ teacherId: plan.teacher_id, limit: 20 })

  const periodCode = plan.verification?.period_code

  if (isPending || !plan.verification || !periodCode) return null

  const existing = (data?.data ?? []).find((entry) => entry.origin_period_code === periodCode)

  if (existing) {
    return (
      <Button variant="outline" size="sm" onClick={() => navigate(`/planes/${existing.id}`)}>
        <Eye className="size-4" aria-hidden="true" />
        Ver plan de {periodCode}
      </Button>
    )
  }

  const picks = formatPicks(followUpPicks(plan.verification, catalogue))

  const href =
    `/planes/nuevo?teacher=${plan.teacher_id}&period_code=${encodeURIComponent(periodCode)}` +
    (picks ? `&picks=${encodeURIComponent(picks)}` : '')

  return (
    <Button
      size="sm"
      onClick={() => navigate(href)}
      title={`Crear el plan de ${periodCode} con los indicadores en los que reincidió`}
    >
      <Plus className="size-4" aria-hidden="true" />
      Crear plan de mejoramiento
    </Button>
  )
}
