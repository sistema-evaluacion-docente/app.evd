import { useRoute } from 'wouter'

import { DepartmentsOverviewList } from '@/features/departments'
import { FacultyPeriodSummary } from '@/features/stats'

/**
 * Read-only page of a single faculty for the VICERRECTOR ACADEMICO: its
 * average and trend, followed by its departments with their directors,
 * upload status and average — the same table as `/departamentos`, pinned to
 * this faculty. Each department opens its own general summary.
 * Route: `/facultades/:id` where `:id` is the faculty id.
 */
export default function FacultyDetailPage() {
  const [, params] = useRoute('/facultades/:id')
  const facultyId = params?.id ? Number(params.id) : undefined

  if (facultyId == null || Number.isNaN(facultyId)) return null

  return (
    <div className="space-y-10">
      <FacultyPeriodSummary facultyId={facultyId} />

      <section className="space-y-3">
        <h2 className="text-foreground text-base font-semibold">Departamentos de la facultad</h2>

        <DepartmentsOverviewList facultyId={facultyId} />
      </section>
    </div>
  )
}
