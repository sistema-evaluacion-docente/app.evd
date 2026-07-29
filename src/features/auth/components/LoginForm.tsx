import { Button } from '@/components/ui/button'
import { ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import Logo from '@/components/common/Logo'
import useAuth from '@/shared/hooks/useAuth'

function LoginForm() {
  const { loginWithGoogle } = useAuth()

  const [isLoadingLogin, setIsLoadingLogin] = useState(false)

  const handleLoginWithGoogle = () => {
    if (isLoadingLogin) return

    setIsLoadingLogin(true)

    loginWithGoogle()
      .then((response) => {
        if (response?.status === 200) {
          toast.success(`Bienvenido, ${response?.data?.user?.displayName ?? 'Usuario'}`)
        } else {
          toast.error('Ocurrió un error al iniciar sesión')
        }
      })
      .finally(() => {
        setIsLoadingLogin(false)
      })
  }

  return (
    <section className="bg-background flex items-center justify-center px-6 py-12">
      <div className="flex w-full max-w-100 flex-col">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <header className="mb-7 text-center">
          <h1 className="text-lg font-semibold tracking-tight">Acceso al Sistema</h1>

          <p className="text-muted-foreground mt-2 text-sm">
            Inicie sesión con sus credenciales institucionales
          </p>
        </header>

        <Button
          type="button"
          variant="outline"
          onClick={handleLoginWithGoogle}
          aria-busy={isLoadingLogin}
          className="bg-background"
        >
          <img src="/google.svg" alt="Google" className="h-5 w-5" />

          <span className="inline-flex items-center gap-2 whitespace-nowrap">
            {isLoadingLogin ? 'Verificando cuenta' : 'Iniciar sesión con Google'}

            {isLoadingLogin && (
              <span className="border-ink-300 h-3 w-3 animate-spin rounded-full border-2 border-t-[#1a73e8]" />
            )}
          </span>
        </Button>

        <p
          className="text-muted-foreground mt-4 text-center text-sm leading-relaxed"
          style={{ textWrap: 'pretty' }}
        >
          Para acceder, debe utilizar su cuenta de correo electrónico proporcionada por la
          universidad.
        </p>

        <div className="my-6 flex items-center gap-3.5">
          <span className="bg-ink-200 h-px flex-1" />
          <span className="text-ink-400 text-[10.5px] font-semibold tracking-[0.18em] uppercase">
            Información
          </span>
          <span className="bg-ink-200 h-px flex-1" />
        </div>

        <div className="text-ink-500 inline-flex w-full items-center justify-center gap-2 text-[11.5px] font-semibold tracking-[0.16em] uppercase">
          <ShieldCheck size={14} className="text-ink-400" />

          <span>Uso exclusivo personal autorizado</span>
        </div>
      </div>
    </section>
  )
}

export default LoginForm
