import { Home, LogIn } from 'lucide-react'

import { TransitionLink } from '@/components/common/TransitionLink'
import { Button } from '@/components/ui/button'

/**
 * Full-viewport 404 page shown for any unmatched route. Chrome-less (no
 * sidebar/header), so it borrows the login page's layered brand-tinted
 * background instead of a bare white screen, and a large ghost "404" numeral
 * behind the icon badge gives it presence without adding noise.
 */
export default function NotFoundPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="from-brand-50/70 via-background to-background dark:from-brand-900/20 absolute inset-0 bg-gradient-to-b" />
        <div className="bg-brand-100/60 dark:bg-brand-900/25 absolute -top-40 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full blur-3xl" />
        <div className="bg-secondary-100/50 dark:bg-secondary-900/20 absolute right-[12%] bottom-[8%] h-56 w-56 rounded-full blur-3xl" />
      </div>

      <main className="relative grid min-h-screen place-items-center px-6 py-12 text-center">
        <div className="flex max-w-sm flex-col items-center">
          <p
            aria-hidden="true"
            className="num text-brand-500/30 dark:text-brand-400/40 -mb-8 text-[9rem] leading-none font-bold select-none sm:text-[11rem]"
          >
            404
          </p>

          <h1 className="animate-rise mt-10 text-2xl font-bold tracking-tight sm:text-3xl">
            Página no encontrada
          </h1>

          <p className="text-muted-foreground animate-rise mt-3 text-sm text-pretty sm:text-[15px]">
            La ruta que intentaste abrir no existe o fue movida.
          </p>

          <div className="animate-rise mt-7 flex w-full flex-col justify-center gap-2 sm:w-auto sm:flex-row">
            <TransitionLink href="/home" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto">
                <Home />
                Ir al inicio
              </Button>
            </TransitionLink>

            <TransitionLink href="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <LogIn />
                Ir al login
              </Button>
            </TransitionLink>
          </div>
        </div>
      </main>
    </div>
  )
}
