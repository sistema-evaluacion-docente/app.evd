import { UserNotAuth } from '@/features/auth'
import useAuth from '@/hooks/useAuth'

export default function DashboardPage() {
  const { selectedRole } = useAuth()

  if (selectedRole === 'DOCENTE') {
    return <p>Mi resumen</p>
  }

  if (selectedRole === 'DIRECTOR DE DEPARTAMENTO') {
    return <p>Resumen del departamento</p>
  }

  if (selectedRole === 'ADMIN') {
    return <p>Resumen de la facultad</p>
  }

  return <UserNotAuth />
}
