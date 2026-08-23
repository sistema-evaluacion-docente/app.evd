import { useRoute, useSearchParams } from 'wouter'

import { PageTitle } from '@/components/common/PageTitle'
import { AlertsAiNotice, CommentsList } from '../components'

const HIGH_RISK_LEVEL = 3

/**
 * Full page listing only the high-risk comments of a selected academic
 * period — the ones a director should read first. Same list as
 * `/comentarios`, pinned to the highest risk level.
 *
 * Also mounted at `/alertas/:teacherId`, which a "riesgo alto" notification
 * links to (`?period=<period>#<comment id>`): scopes the list to that
 * teacher and, once loaded, scrolls to and briefly highlights the comment
 * named in the hash — see `CommentsList`.
 * Route: `/alertas` or `/alertas/:teacherId`
 */
export default function AlertsPage() {
  const [, params] = useRoute('/alertas/:teacherId')

  const [searchParams] = useSearchParams()
  const periodName = searchParams.get('period') || 'actual'
  const teacherId = params?.teacherId ? Number(params.teacherId) : undefined

  return (
    <>
      <PageTitle>Alertas {periodName}</PageTitle>

      <AlertsAiNotice />

      <CommentsList
        riskLevel={HIGH_RISK_LEVEL}
        initialTeacherId={teacherId}
        emptyMessage="No hay comentarios de riesgo alto que coincidan con los filtros aplicados."
      />
    </>
  )
}
