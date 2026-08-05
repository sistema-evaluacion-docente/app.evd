import { Ban } from 'lucide-react'
import { useId } from 'react'

import { cn } from '@/lib/utils'

interface InlineErrorProps {
  /** Error message to show; renders nothing when empty. */
  message?: string | null
  /** Optional id, useful to link with `aria-describedby` on the field. */
  id?: string
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
 */
export function InlineError({ message, id, className }: InlineErrorProps) {
  const fallbackId = useId()
  const errorId = id ?? fallbackId

  if (!message) return null

  return (
    <div
      id={errorId}
      role="alert"
      className={cn(
        'animate-rise border-brand-200 bg-brand-50 flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5',
        className,
      )}
    >
      <div className="bg-brand-600 flex size-5 shrink-0 items-center justify-center rounded-full">
        <Ban className="size-3.5 text-white" strokeWidth={2.5} aria-hidden="true" />
      </div>

      <div className="min-w-0">
        <p className="text-brand-800 text-xs leading-5 font-semibold">{message}</p>
      </div>
    </div>
  )
}
