import { PageTitle } from '@/components/common/PageTitle'
import { UserNotAuth } from '@/features/auth'
import { PeriodAverageTrend } from '@/features/periods'
import { DepartmentPeriodRangeSummary } from '@/features/stats'
import useAuth from '@/hooks/useAuth'

export default function DashboardPage() {
  const { selectedRole } = useAuth()

  if (selectedRole === 'DOCENTE') {
    return (
      <>
        <PageTitle>Mi resumen</PageTitle>

        <div className="bg-background space-y-8 rounded p-4">
          <PeriodAverageTrend />
        </div>
      </>
    )
  }

  if (selectedRole === 'DIRECTOR DE DEPARTAMENTO') {
    return (
      <section className="mb-20">
        <PageTitle>Resumen del departamento</PageTitle>

        <DepartmentPeriodRangeSummary />
      </section>
    )
  }

  if (selectedRole === 'ADMIN') {
    return <p>Resumen de la facultad</p>
  }

  return <UserNotAuth />
}
