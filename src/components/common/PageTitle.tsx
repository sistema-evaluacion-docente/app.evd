import { ArrowLeft, Plus, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PageTitleProps {
  children: ReactNode
  className?: string
  /** Function run when the action button (far right of the title) is clicked. */
  onAction?: () => void
  /** Label of the action button. Defaults to "Nuevo". */
  actionLabel?: string
  /** Icon of the action button. Defaults to `Plus`. */
  actionIcon?: LucideIcon
}

/**
 * Large, bold page title with a "go back" button that returns the user to the
 * previous page, and an optional action button aligned to the far right of the
 * title. Use as the main heading of any page.
 *
 * @example
 * <PageTitle>Evaluaciones</PageTitle>
 *
 * @example
 * <PageTitle className="mb-6">Mis Períodos</PageTitle>
 *
 * @example
 * <PageTitle onAction={() => openDrawer()} actionLabel="Nueva evaluación">
 *   Evaluaciones
 * </PageTitle>
 */
export function PageTitle({
  children,
  className,
  onAction,
  actionLabel = 'Nuevo',
  actionIcon: ActionIcon = Plus,
}: PageTitleProps) {
  return (
    <header className="mb-6">
      <div className="mb-3 flex items-center">
        <Button type="button" variant="outline" size="sm" onClick={() => window.history.back()}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Ir atrás
        </Button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <h1 className={cn('text-2xl font-bold tracking-tight sm:text-3xl', className)}>
          {children}
        </h1>

        {onAction ? (
          <Button type="button" onClick={onAction} className="shrink-0">
            <ActionIcon className="size-4" aria-hidden="true" />
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </header>
  )
}
