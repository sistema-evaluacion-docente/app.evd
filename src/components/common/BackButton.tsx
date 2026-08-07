import { ArrowLeft, type LucideIcon } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { useNavigate } from '@/hooks/useNavigate'
import { cn } from '@/lib/utils'

export interface BackButtonProps extends Omit<
  ComponentProps<typeof Button>,
  'onClick' | 'children'
> {
  /** Button text. Defaults to "Ir atrás". */
  label?: ReactNode
  /** Leading icon; pass `null` to render text only. Defaults to `ArrowLeft`. */
  icon?: LucideIcon | null
  /** Navigate to this route instead of stepping back in history. */
  href?: string
  /** Route used when there is no previous page in history (direct link, new tab). */
  fallbackHref?: string
  /** Replaces the default navigation entirely — useful to close a drawer or reset a wizard step. */
  onBack?: () => void
  /** Overrides `label` when you need markup inside the button. */
  children?: ReactNode
}

/**
 * Button that takes the user to the previous page. By default it steps back in
 * history; give it an `href` to always land on a known route, a
 * `fallbackHref` for when the page was opened directly (no history to go back
 * to), or `onBack` to take over the behavior completely. Every `Button` prop
 * (variant, size, disabled, className...) passes through.
 *
 * @example
 * <BackButton />
 *
 * @example
 * <BackButton href="/docentes" label="Volver a docentes" />
 *
 * @example
 * <BackButton variant="ghost" icon={null} onBack={() => setStep(step - 1)} />
 */
export function BackButton({
  label = 'Ir atrás',
  icon: Icon = ArrowLeft,
  href,
  fallbackHref,
  onBack,
  children,
  variant = 'outline',
  size = 'sm',
  className,
  ...props
}: BackButtonProps) {
  const navigate = useNavigate()

  function handleClick() {
    if (onBack) return onBack()
    if (href) return navigate(href)

    const hasHistory = typeof window !== 'undefined' && window.history.length > 1

    if (hasHistory) return window.history.back()
    if (fallbackHref) return navigate(fallbackHref)
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleClick}
      className={cn(className)}
      {...props}
    >
      {Icon && <Icon className="size-4" aria-hidden="true" />}
      {children ?? label}
    </Button>
  )
}
