import { PageTitle } from '@/components/common/PageTitle'
import { FacultiesList } from '../components'

/**
 * Admin page displaying the full list of faculties with search and filters.
 *
 * @example
 * <Route path="/admin/faculties" component={FacultiesPage} />
 */
export function FacultiesPage() {
  return (
    <>
      <PageTitle>Facultades</PageTitle>

      <FacultiesList />
    </>
  )
}
