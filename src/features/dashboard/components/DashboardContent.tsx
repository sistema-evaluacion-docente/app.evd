import useAuth from '@/shared/hooks/useAuth'

function DashboardContent() {
  const { selectedRole } = useAuth()

  // if (selectedRole === "ADMIN") {
  //   return <DashboardContentAdmin />;
  // }

  // if (selectedRole === "DIRECTOR DE DEPARTAMENTO") {
  //   return <DashboardContentDirector />;
  // }

  // if (selectedRole === "DOCENTE") {
  //   return <DashboardContentTeacher />;
  // }

  return <span>Dashboard</span>
}

export default DashboardContent
