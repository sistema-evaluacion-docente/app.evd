import { PageTitle } from '@/components/common/PageTitle'
import { useNavigate } from '@/hooks/useNavigate'
import { TeachersList } from '../components'

/**
 * Full page listing the teachers of the authenticated director's department.
 */
export default function TeachersPage() {
  const navigate = useNavigate()

  return (
    <>
      <PageTitle onAction={() => navigate('/docentes/cargar')} actionLabel="Cargar docentes">
        Docentes
      </PageTitle>

      <TeachersList />
    </>
  )
}
