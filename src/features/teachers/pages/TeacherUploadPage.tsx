import { PageTitle } from '@/components/common/PageTitle'
import { TeacherUploadForm } from '../components'

/**
 * Full page to upload a CSV/XLSX file with teacher records.
 */
export default function TeacherUploadPage() {
  return (
    <>
      <PageTitle>Cargar docentes</PageTitle>

      <TeacherUploadForm />
    </>
  )
}
