import useAuth from '@/shared/hooks/useAuth'

import { MyPeriodsContent } from '@/features/periods'

function DashboardContent() {
  // const [, setLocation] = useLocation()

  const { selectedRole } = useAuth()

  // if (selectedRole === "ADMIN") {
  //   return <DashboardContentAdmin />;
  // }

  // if (selectedRole === "DIRECTOR DE DEPARTAMENTO") {
  //   return <DashboardContentDirector />;
  // }

  if (selectedRole === 'DOCENTE') {
    // setLocation('/summary')
    return <MyPeriodsContent />
  }

  return <span>Dashboard</span>
}

export default DashboardContent
