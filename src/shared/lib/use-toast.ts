import { useCallback, useState } from 'react'

export type ToastKind = 'success' | 'warning' | 'info'

export interface ToastState {
  message: string
  kind: ToastKind
}

/** Lightweight transient toast state with auto-dismiss after 3s. */
export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null)

  const showToast = useCallback((message: string, kind: ToastKind = 'success') => {
    setToast({ message, kind })
    window.setTimeout(() => setToast(null), 3000)
  }, [])

  return { toast, showToast }
}
