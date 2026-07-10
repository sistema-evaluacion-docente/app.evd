import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

export interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  /** Width utility class for the dialog box, e.g. `max-w-md`. */
  widthClass?: string
}

/** Centered modal dialog with a blurred backdrop. */
export function Modal({ open, onClose, children, widthClass = 'max-w-lg' }: ModalProps) {
  if (!open) return null
  return (
    <div
      className="animate-fade-in fixed inset-0 z-60 flex items-end justify-center bg-foreground/40 p-3 backdrop-blur-[2px] sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className={cn(
          'w-full overflow-hidden rounded-lg bg-card shadow-pop',
          widthClass,
        )}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  )
}
