import { PageTitle } from '@/components/common/PageTitle'
import { EvaluationUploadForm } from '../components'

/**
 * Full page to upload the PDF with the teacher evaluations of a period.
 */
export default function EvaluationUploadPage() {
  return (
    <>
      <PageTitle>Cargar evaluación</PageTitle>

      <EvaluationUploadForm />
    </>
  )
}
