import { PageTitle } from '@/components/common/PageTitle'
import { TeachersList } from '../components'

/**
 * Full page listing the teachers of the authenticated director's department.
 */
export default function TeachersPage() {
  return (
    <>
      <PageTitle>Docentes</PageTitle>

      <TeachersList />
    </>
  )
}
