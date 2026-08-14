import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type {
  ActaStatus,
  EvidenceRequestStatus,
  EvidenceStatus,
  PlanStatus,
} from '../types'
import {
  ACTA_STATUS_CLASS,
  ACTA_STATUS_LABEL,
  EVIDENCE_STATUS_CLASS,
  EVIDENCE_STATUS_LABEL,
  PLAN_STATUS_CLASS,
  PLAN_STATUS_LABEL,
  REQUEST_STATUS_CLASS,
  REQUEST_STATUS_LABEL,
} from '../lib/planStatus'

interface PlanStatusBadgeProps {
  status: PlanStatus
  className?: string
}

/**
 * Status of a plan, colored with the app's shared tone vocabulary.
 *
 * @example
 * <PlanStatusBadge status={plan.status} />
 */
export function PlanStatusBadge({ status, className }: PlanStatusBadgeProps) {
  return (
    <Badge className={cn(PLAN_STATUS_CLASS[status], className)}>
      {PLAN_STATUS_LABEL[status]}
    </Badge>
  )
}

/** Lifecycle of the acta — independent from the plan status. */
export function ActaStatusBadge({
  status,
  className,
}: {
  status: ActaStatus
  className?: string
}) {
  return (
    <Badge className={cn(ACTA_STATUS_CLASS[status], className)}>
      {ACTA_STATUS_LABEL[status]}
    </Badge>
  )
}

/** Review state of a single submitted evidence. */
export function EvidenceStatusBadge({
  status,
  className,
}: {
  status: EvidenceStatus
  className?: string
}) {
  return (
    <Badge className={cn(EVIDENCE_STATUS_CLASS[status], className)}>
      {EVIDENCE_STATUS_LABEL[status]}
    </Badge>
  )
}

/** State of a deliverable the director asked for. */
export function EvidenceRequestBadge({
  status,
  className,
}: {
  status: EvidenceRequestStatus
  className?: string
}) {
  return (
    <Badge className={cn(REQUEST_STATUS_CLASS[status], className)}>
      {REQUEST_STATUS_LABEL[status]}
    </Badge>
  )
}
