import { PageTitle } from '@/components/common/PageTitle'
import { UserNotAuth } from '@/features/auth'
import { PeriodAverageTrend } from '@/features/periods'
import useAuth from '@/hooks/useAuth'

export default function DashboardPage() {
  const { selectedRole } = useAuth()

  if (selectedRole === 'DOCENTE') {
    return (
      <>
        <PageTitle>Mi resumen</PageTitle>

        <div className="space-y-8">
          <PeriodAverageTrend />
        </div>
      </>
    )
  }

  if (selectedRole === 'DIRECTOR DE DEPARTAMENTO') {
    return <p>Resumen del departamento</p>
  }

  if (selectedRole === 'ADMIN') {
    return <p>Resumen de la facultad</p>
  }

  return <UserNotAuth />
}
