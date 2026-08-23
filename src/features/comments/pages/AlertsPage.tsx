import { PageTitle } from '@/components/common/PageTitle'
import { useSearchParams } from 'wouter'
import { AlertsAiNotice, CommentsList } from '../components'

const HIGH_RISK_LEVEL = 3

/**
 * Full page listing only the high-risk comments of a selected academic
 * period — the ones a director should read first. Same list as
 * `/comentarios`, pinned to the highest risk level.
 */
export default function AlertsPage() {
  const [searchParams] = useSearchParams()
  const periodName = searchParams.get('period') || 'actual'

  return (
    <>
      <PageTitle>Alertas {periodName}</PageTitle>

      <AlertsAiNotice />

      <CommentsList
        riskLevel={HIGH_RISK_LEVEL}
        emptyMessage="No hay comentarios de riesgo alto que coincidan con los filtros aplicados."
      />
    </>
  )
}
