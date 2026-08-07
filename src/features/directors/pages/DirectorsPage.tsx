import { PageTitle } from '@/components/common/PageTitle'
import { DirectorsList } from '../components'

/**
 * Admin page displaying the full list of directors with search and filters.
 *
 * @example
 * <Route path="/admin/directores" component={DirectorsPage} />
 */
export function DirectorsPage() {
  return (
    <>
      <PageTitle>Directores</PageTitle>

      <DirectorsList />
    </>
  )
}
