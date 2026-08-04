import { useEffect, type ReactNode } from 'react'

import { useAuthStore } from '@/features/auth/store/useAuthStore'

export function AuthInitializer({ children }: { children: ReactNode }) {
  const subscribeToAuth = useAuthStore((s) => s.subscribeToAuth)

  useEffect(() => {
    const unsubscribe = subscribeToAuth()
    return unsubscribe
  }, [subscribeToAuth])

  return <>{children}</>
}
