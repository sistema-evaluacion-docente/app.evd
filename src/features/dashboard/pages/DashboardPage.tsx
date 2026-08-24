import { PageTitle } from '@/components/common/PageTitle'
import { UserNotAuth } from '@/features/auth'
import { PeriodAverageTrend } from '@/features/periods'
import { DepartmentPeriodRangeSummary } from '@/features/stats'
import { TeacherPeriodInsights } from '@/features/teachers'
import useAuth from '@/hooks/useAuth'
import { useNavigate } from '@/hooks/useNavigate'

function TeacherDashboard() {
  return (
    <>
      <PageTitle>Mi resumen</PageTitle>

      <div className="space-y-8 rounded">
        <PeriodAverageTrend />

        <TeacherPeriodInsights />
      </div>
    </>
  )
}

export default function DashboardPage() {
  const { selectedRole } = useAuth()

  const navigate = useNavigate()

  if (selectedRole === 'DOCENTE') {
    return <TeacherDashboard />
  }

  if (selectedRole === 'DIRECTOR DE DEPARTAMENTO') {
    return (
      <section className="mb-20">
        <DepartmentPeriodRangeSummary />
      </section>
    )
  }

  if (selectedRole === 'ADMIN') {
    navigate('/admin/historial')
    return
  }

  return <UserNotAuth />
}
