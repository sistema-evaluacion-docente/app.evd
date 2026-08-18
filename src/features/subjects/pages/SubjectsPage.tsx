import { PageTitle } from '@/components/common/PageTitle'
import { Badge } from '@/components/ui/badge'
import { useSearchParams } from 'wouter'
import { SubjectsList } from '../components'

/**
 * Director's "Materias" list — subjects taught by the department in a
 * selected period, with the teachers who taught each one. A subject with a
 * single teacher links straight to that teacher's report; one with several
 * expands to show each teacher individually.
 * Route: `/materias`
 */
export default function SubjectsPage() {
  const [params] = useSearchParams()

  const period = params.get('period') ?? undefined

  return (
    <>
      <PageTitle>
        <div className="flex flex-wrap items-center gap-2">
          <p>Materias</p>
          <Badge className="text-sm font-bold">{period ?? 'Sin periodo seleccionado'}</Badge>
        </div>
      </PageTitle>

      <SubjectsList />
    </>
  )
}
