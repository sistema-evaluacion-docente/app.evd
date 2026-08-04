import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'
import { Button } from '../ui/button'

interface PageTitleProps {
  children: ReactNode
  className?: string
}

/**
 * Large, bold page title with a "go back" button that returns the user to the
 * previous page. Use as the main heading of any page.
 *
 * @example
 * <PageTitle>Evaluaciones</PageTitle>
 *
 * @example
 * <PageTitle className="mb-6">Mis Períodos</PageTitle>
 */
export function PageTitle({ children, className }: PageTitleProps) {
  return (
    <header className="mb-6">
      <div className="mb-3 flex items-center">
        <Button type="button" variant="outline" size="sm" onClick={() => window.history.back()}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Ir atrás
        </Button>
      </div>

      <h1 className={cn('text-2xl font-bold tracking-tight sm:text-3xl', className)}>{children}</h1>
    </header>
  )
}
