import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, LogOut, UserX } from 'lucide-react'

import useAuth from '@/shared/hooks/useAuth'

function UserNotAuth() {
  const { user, handleLogout } = useAuth()

  const isInactive = user ? !user.active : false
  const isNotTeacher = user ? !user.teacher_id : false

  return (
    <section className="flex min-h-screen items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md p-0 pb-4">
        <CardHeader className="text-center">
          <div className="bg-destructive/10 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full">
            {isInactive ? (
              <UserX size={28} className="text-destructive" />
            ) : (
              <AlertTriangle size={28} className="text-destructive" />
            )}
          </div>

          <CardTitle className="text-lg">
            {isInactive ? 'Cuenta desactivada' : 'Acceso no autorizado'}
          </CardTitle>

          <CardDescription>
            {isInactive
              ? 'Su cuenta ha sido desactivada en el sistema. Por favor, contacte al administrador para más información.'
              : isNotTeacher
                ? 'Su cuenta no se encuentra registrada como docente. Comuníquese con su director de departamento para que lo registre en la plataforma.'
                : 'No tiene permisos para acceder al sistema.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex justify-center">
          <Button variant="outline" onClick={handleLogout}>
            <LogOut size={16} />
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>
    </section>
  )
}

export default UserNotAuth
