import { PageTitle } from '@/components/common/PageTitle'
import { useNavigate } from '@/hooks/useNavigate'
import { EvaluationsList } from '../components'

/**
 * Full page listing the evaluations of the authenticated director's department.
 */
export default function EvaluationsPage() {
  const navigate = useNavigate()

  return (
    <>
      <PageTitle onAction={() => navigate('/evaluaciones/cargar')} actionLabel="Cargar evaluación">
        Evaluaciones
      </PageTitle>

      <EvaluationsList />
    </>
  )
}
