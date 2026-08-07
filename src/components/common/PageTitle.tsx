import { Plus, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { BackButton } from '@/components/common/BackButton'
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
  /** Custom action element rendered instead of the default button. Takes precedence over `onAction`. */
  action?: ReactNode
  /** Function run when the secondary action button is clicked. */
  onSecondaryAction?: () => void
  /** Label of the secondary action button. */
  secondaryActionLabel?: string
  /** Icon of the secondary action button. */
  secondaryActionIcon?: LucideIcon
  /** Custom secondary action element rendered instead of the default button. Takes precedence over `onSecondaryAction`. */
  secondaryAction?: ReactNode
  /** Whether to show a "go back" button that returns the user to the previous page. Defaults to `true`. */
  backButton?: boolean
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
  action,
  onSecondaryAction,
  secondaryActionLabel,
  secondaryActionIcon: SecondaryActionIcon,
  secondaryAction,
  backButton = true,
}: PageTitleProps) {
  const hasPrimaryAction = action || onAction
  const hasSecondaryAction = secondaryAction || onSecondaryAction

  return (
    <header className="mb-6">
      {backButton && (
        <div className="mb-3 flex items-center">
          <BackButton />
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <h1 className={cn('text-2xl font-bold tracking-tight sm:text-3xl', className)}>
          {children}
        </h1>

        {(hasSecondaryAction || hasPrimaryAction) && (
          <div className="flex shrink-0 items-center gap-2">
            {hasSecondaryAction &&
              (secondaryAction ? (
                secondaryAction
              ) : (
                <Button type="button" variant="outline" onClick={onSecondaryAction}>
                  {SecondaryActionIcon && (
                    <SecondaryActionIcon className="size-4" aria-hidden="true" />
                  )}
                  {secondaryActionLabel}
                </Button>
              ))}

            {hasPrimaryAction &&
              (action ? (
                action
              ) : (
                <Button type="button" onClick={onAction}>
                  <ActionIcon className="size-4" aria-hidden="true" />
                  {actionLabel}
                </Button>
              ))}
          </div>
        )}
      </div>
    </header>
  )
}
