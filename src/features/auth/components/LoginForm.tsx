import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '../store/useAuthStore'

export function LoginForm() {
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle)
  const loginWithEmail = useAuthStore((s) => s.loginWithEmail)
  const [isLoadingLogin, setIsLoadingLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoadingEmailLogin, setIsLoadingEmailLogin] = useState(false)

  const handleLoginWithEmail = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isLoadingEmailLogin) return

    const trimmedEmail = email.trim()

    if (!trimmedEmail || !password) {
      toast.error('Ingrese su correo y contraseña')
      return
    }

    setIsLoadingEmailLogin(true)

    loginWithEmail(trimmedEmail, password)
      .then((response) => {
        if (response?.status === 200) {
          toast.success('Bienvenido')
        } else {
          toast.error(response?.error ?? 'Ocurrió un error al iniciar sesión')
        }
      })
      .finally(() => {
        setIsLoadingEmailLogin(false)
      })
  }

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
    <section className="animate-rise flex w-full max-w-sm flex-col items-center">
      <div className="bg-card mb-9 flex size-20 items-center justify-center rounded-2xl border">
        <img src="/logo.png" alt="Logo" className="h-12 w-12" style={{ animationDelay: '60ms' }} />
      </div>

      <header className="mb-8 text-center" style={{ animationDelay: '120ms' }}>
        <h1 className="text-[1.6rem] leading-tight font-semibold tracking-tight">
          Acceso al sistema
        </h1>

        <p className="text-muted-foreground mt-2 text-sm" style={{ textWrap: 'pretty' }}>
          Inicie sesión con su cuenta institucional para continuar.
        </p>
      </header>

      <form onSubmit={handleLoginWithEmail} className="w-full space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Correo institucional</Label>

          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="usuario@ufps.edu.co"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isLoadingEmailLogin}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>

          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isLoadingEmailLogin}
              className="h-11 pr-11"
            />

            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex items-center px-3"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={isLoadingEmailLogin}
          aria-busy={isLoadingEmailLogin}
          className="h-11 w-full"
        >
          {isLoadingEmailLogin ? 'Iniciando sesión' : 'Iniciar sesión'}
        </Button>
      </form>

      <div className="my-6 flex w-full items-center gap-3">
        <span className="bg-border h-px flex-1" />
        <span className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase">
          o
        </span>
        <span className="bg-border h-px flex-1" />
      </div>

      <div className="w-full" style={{ animationDelay: '180ms' }}>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={handleLoginWithGoogle}
          aria-busy={isLoadingLogin}
          className="shadow-card h-11 w-full gap-3 border transition-shadow duration-200"
        >
          <img src="/google.svg" alt="Google" className="h-5 w-5" />

          <span className="inline-flex items-center gap-2 whitespace-nowrap">
            {isLoadingLogin ? 'Verificando cuenta' : 'Continuar con Google'}

            {isLoadingLogin && (
              <span className="border-ink-300 h-3.5 w-3.5 animate-spin rounded-full border-2 border-t-[#1a73e8]" />
            )}
          </span>
        </Button>
      </div>

      <div className="mt-8 flex items-center gap-3">
        <span className="bg-ink-200 h-px w-8" />
        <span className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase">
          Uso autorizado
        </span>

        <span className="bg-border h-px w-8" />
      </div>

      <div
        className="text-muted-foreground mt-4 inline-flex items-center justify-center gap-2 text-center text-[11.5px] leading-relaxed font-semibold"
        style={{ textWrap: 'pretty' }}
      >
        <span>
          Debe usar el correo proporcionado por la universidad. Acceso exclusivo para personal
          autorizado.
        </span>
      </div>
    </section>
  )
}
