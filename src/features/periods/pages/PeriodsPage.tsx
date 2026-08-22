import { PageTitle } from '@/components/common/PageTitle'
import { PeriodsList } from '../components'

/**
 * Full page listing the evaluated periods of the authenticated teacher.
 */
export default function PeriodsPage() {
  return (
    <>
      <PageTitle>Mis periodos</PageTitle>

      <PeriodsList />
    </>
  )
}
