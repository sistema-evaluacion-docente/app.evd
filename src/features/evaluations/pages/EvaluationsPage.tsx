import { useLocation } from 'wouter'

import { PageTitle } from '@/components/common/PageTitle'
import { EvaluationsList } from '../components'

/**
 * Full page listing the evaluations of the authenticated director's department.
 */
export default function EvaluationsPage() {
  const [, setLocation] = useLocation()

  return (
    <>
      <PageTitle
        onAction={() => setLocation('/evaluations/upload')}
        actionLabel="Cargar Evaluación"
      >
        Evaluaciones
      </PageTitle>

      <EvaluationsList />
    </>
  )
}
