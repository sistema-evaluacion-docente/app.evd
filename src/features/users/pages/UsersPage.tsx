import { PageTitle } from '@/components/common/PageTitle'
import { UsersList } from '../components'

/**
 * Full page listing the system users (admin only).
 */
export default function UsersPage() {
  return (
    <>
      <PageTitle>Usuarios</PageTitle>

      <UsersList />
    </>
  )
}
