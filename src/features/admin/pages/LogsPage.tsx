import { PageTitle } from '@/components/common/PageTitle'
import { LogsList } from '../components'

/**
 * Full page listing the audit logs of the whole system (admin only).
 */
export default function LogsPage() {
  return (
    <>
      <PageTitle>Logs</PageTitle>

      <LogsList />
    </>
  )
}
