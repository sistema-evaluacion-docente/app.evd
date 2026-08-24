import { Ban, X } from 'lucide-react'
import { useId } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface InlineErrorProps {
  /** Error message to show; renders nothing when empty. */
  message?: string | null
  /** Optional id, useful to link with `aria-describedby` on the field. */
  id?: string
  /**
   * Clears the error. When given, the banner grows a close button.
   *
   * Deliberately not remembered in `localStorage` the way `DismissibleNotice`
   * remembers a notice: a notice always says the same thing, an error is about
   * what just happened and has to come back if it happens again. The caller
   * owns what "cleared" means — usually resetting the mutation that failed.
   */
  onDismiss?: () => void
  /** Accessible name of the close button. */
  closeLabel?: string
  /** Extra classes for the container. */
  className?: string
}

/**
 * Reusable inline error banner shown below form fields. Renders a high-visibility
 * red alert with an icon, left accent bar and entrance animation; renders nothing
 * when `message` is empty.
 *
 * @example
 * <InlineError message={error} id="file-error" />
 *
 * @example
 * // Dismissible: the X clears the mutation that put it there.
 * <InlineError message={upload.error?.message} onDismiss={() => upload.reset()} />
 */
export function InlineError({
  message,
  id,
  onDismiss,
  closeLabel = 'Cerrar el error',
  className,
}: InlineErrorProps) {
  const fallbackId = useId()
  const errorId = id ?? fallbackId

  if (!message) return null

  return (
    <div
      id={errorId}
      role="alert"
      className={cn(
        'animate-rise border-brand-200 bg-brand-50 dark:border-brand-900/60 dark:bg-brand-900/20 relative flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5',
        onDismiss && 'pr-10',
        className,
      )}
    >
      <div className="bg-brand-600 flex size-5 shrink-0 items-center justify-center rounded-full">
        <Ban className="size-3.5 text-white" strokeWidth={2.5} aria-hidden="true" />
      </div>

      <div className="min-w-0">
        <p className="text-brand-800 dark:text-brand-200 text-xs leading-5 font-semibold">
          {message}
        </p>
      </div>

      {onDismiss && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={onDismiss}
          aria-label={closeLabel}
          // `text-current` so the button is painted in the banner's own red
          // instead of punching a grey hole in it — same as `DismissibleNotice`.
          className="text-brand-800 dark:text-brand-200 absolute top-2 right-2 opacity-70 hover:bg-current/10 hover:opacity-100"
        >
          <X className="size-3.5" aria-hidden="true" />
        </Button>
      )}
    </div>
  )
}
