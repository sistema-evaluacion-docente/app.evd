import { Redirect } from 'wouter'

import { PageTitle } from '@/components/common/PageTitle'
import { homePathFor } from '@/config/security'
import { UserNotAuth } from '@/features/auth'
import { PeriodAverageTrend } from '@/features/periods'
import {
  DepartmentPeriodRangeSummary,
  FacultiesOverview,
  FacultyPeriodSummary,
} from '@/features/stats'
import { TeacherPeriodInsights, TeacherStatsHero } from '@/features/teachers'
import useAuth from '@/hooks/useAuth'

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
      <section className="mb-20">
        <FacultyPeriodSummary facultyId={user.faculty_id} backButton={false} showDepartmentsList />
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

  // El admin no tiene resumen propio: su inicio es el catálogo de facultades.
  if (selectedRole === 'ADMIN') {
    return <Redirect to={homePathFor('ADMIN')} replace />
  }

  return <UserNotAuth />
}
