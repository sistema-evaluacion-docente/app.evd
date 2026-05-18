import { AlertTriangle, Check } from 'lucide-react'

import type { ToastState } from '@/shared/lib/use-toast'
import { cn } from '@/shared/lib/utils'

/** Fixed bottom-center toast notification. */
export function Toast({ toast }: { toast: ToastState | null }) {
  if (!toast) return null
  return (
    <div
      className={cn(
        'animate-fade-in fixed bottom-6 left-1/2 z-70 inline-flex -translate-x-1/2 items-center gap-2.5 rounded-lg px-4 py-3 text-[13px] font-medium shadow-pop',
        toast.kind === 'success' && 'bg-ink-900 text-white',
        toast.kind === 'warning' &&
          'border border-amber-200 bg-amber-50 text-amber-800',
        toast.kind === 'info' && 'border border-sky-200 bg-sky-50 text-sky-800',
      )}
    >
      {toast.kind === 'success' ? (
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
          <Check size={11} strokeWidth={3} />
        </span>
      ) : (
        <AlertTriangle size={15} />
      )}
      {toast.message}
    </div>
  )
}
