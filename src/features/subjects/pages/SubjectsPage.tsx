import { PageTitle } from '@/components/common/PageTitle'
import { SubjectsList } from '../components'

/**
 * Director's "Materias" list — subjects taught by the department in a
 * selected period, with the teachers who taught each one. A subject with a
 * single teacher links straight to that teacher's report; one with several
 * expands to show each teacher individually.
 * Route: `/materias`
 */
export default function SubjectsPage() {
  return (
    <>
      <PageTitle>Materias</PageTitle>

      <SubjectsList />
    </>
  )
}
