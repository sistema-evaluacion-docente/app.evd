import { PageTitle } from '@/components/common/PageTitle'
import { SuggestedActionsList } from '../components'

/**
 * Full page where a director defines the default improvement actions their
 * department offers when a plan is drawn up.
 */
export default function SuggestedActionsPage() {
  return (
    <>
      <PageTitle>Acciones sugeridas</PageTitle>

      <SuggestedActionsList />
    </>
  )
}
