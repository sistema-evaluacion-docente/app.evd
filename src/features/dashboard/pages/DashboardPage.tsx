import { PageTitle } from '@/components/common/PageTitle'
import { UserNotAuth } from '@/features/auth'
import { PeriodAverageTrend } from '@/features/periods'
import {
  DepartmentPeriodRangeSummary,
  FacultiesOverview,
  FacultyDepartmentsOverview,
  FacultyPeriodSummary,
} from '@/features/stats'
import { TeacherPeriodInsights, TeacherStatsHero } from '@/features/teachers'
import useAuth from '@/hooks/useAuth'
import { useNavigate } from '@/hooks/useNavigate'

function TeacherDashboard() {
  return (
    <>
      <PageTitle>Mi resumen</PageTitle>

      <div className="space-y-8 rounded">
        <TeacherStatsHero />

        <PeriodAverageTrend />

        <TeacherPeriodInsights />
      </div>
    </>
  )
}

export default function DashboardPage() {
  const { selectedRole, user } = useAuth()

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

  if (selectedRole === 'DECANO') {
    if (user?.faculty_id == null) {
      return (
        <>
          <PageTitle>Resumen de la facultad</PageTitle>
          <p className="text-muted-foreground py-10 text-center text-sm">
            Tu cuenta no tiene una facultad asignada todavía.
          </p>
        </>
      )
    }

    return (
      <section className="mb-20 space-y-10">
        <FacultyPeriodSummary facultyId={user.faculty_id} />
        <FacultyDepartmentsOverview facultyId={user.faculty_id} />
      </section>
    )
  }

  if (selectedRole === 'VICERRECTOR ACADEMICO') {
    return (
      <section className="mb-20">
        <FacultiesOverview />
      </section>
    )
  }

  if (selectedRole === 'ADMIN') {
    navigate('/admin/historial')
    return
  }

  return <UserNotAuth />
}
