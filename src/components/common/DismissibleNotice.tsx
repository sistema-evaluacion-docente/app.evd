import { X } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { cn } from '@/lib/utils'

/** Namespace for the dismissal flags, so they are recognisable in devtools. */
const STORAGE_PREFIX = 'notice:'

/** Whether a notice has been closed, and how to close it. */
function useNoticeDismissed(storageKey: string) {
  const [dismissed, setDismissed] = useLocalStorage(`${STORAGE_PREFIX}${storageKey}`, false)

  return [dismissed, () => setDismissed(true)] as const
}

export interface DismissibleNoticeProps {
  /**
   * Identifies the notice in `localStorage`. Stable per notice, not per page:
   * the AI disclaimer is the same message wherever it is mounted, so closing
   * it once closes it everywhere.
   */
  storageKey: string
  /** The notice itself — an `Alert`, a coloured strip, whatever it already is. */
  children: ReactNode
  /** Accessible name of the close button, when "Cerrar el aviso" is too vague. */
  closeLabel?: string
  className?: string
}

/**
 * A notice you can close for good.
 *
 * The app already had the X — twice, in `PlanDocuments` and in the draft banner
 * of `PlanFormPage` — but both kept it in component state, so a disclaimer that
 * always says the same thing came back on every reload and the button bought
 * the reader nothing. Here the answer is remembered per browser.
 *
 * The child keeps its own colours and layout; this only reserves the top-right
 * corner. Leave room for it there — `pr-10` on the notice, or a `pr-12` if it
 * has an action of its own.
 *
 * @example
 * <DismissibleNotice storageKey="alerts-ai">
 *   <Alert className="pr-10">…</Alert>
 * </DismissibleNotice>
 */
export function DismissibleNotice({
  storageKey,
  children,
  closeLabel = 'Cerrar el aviso',
  className,
}: DismissibleNoticeProps) {
  const [dismissed, dismiss] = useNoticeDismissed(storageKey)

  if (dismissed) return null

  return (
    <div className={cn('relative', className)}>
      {children}

      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={dismiss}
        aria-label={closeLabel}
        // `text-current` so the button inherits whatever the notice is painted
        // in — amber, blue, emerald — instead of punching a grey hole in it.
        className="absolute top-2 right-2 text-current opacity-70 hover:bg-current/10 hover:opacity-100"
      >
        <X className="size-3.5" aria-hidden="true" />
      </Button>
    </div>
  )
}
