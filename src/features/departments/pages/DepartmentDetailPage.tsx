import { useRoute } from 'wouter'

import { DepartmentGeneralSummary } from '@/features/stats'

/**
 * Read-only, general-only summary of a single department — what a
 * VICERRECTOR ACADEMICO or DECANO sees when they open a department from
 * `/departamentos` (the DECANO is scoped to their own faculty by the
 * backend, so a stray id outside it 404s/403s there, not here).
 * Route: `/departamentos/:id` where `:id` is the department id.
 */
export default function DepartmentDetailPage() {
  const [, params] = useRoute('/departamentos/:id')
  const departmentId = params?.id ? Number(params.id) : undefined

  if (departmentId == null) return null

  return <DepartmentGeneralSummary departmentId={departmentId} />
}
