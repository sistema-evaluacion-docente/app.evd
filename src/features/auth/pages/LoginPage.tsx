import { useEffect } from 'react'
import { useSearchParams } from 'wouter'

import AppLayoutSkeleton from '@/components/skeletons/AppLayoutSkeleton'
import { useNavigate } from '@/hooks/useNavigate'
import { LoginForm } from '../components/LoginForm'
import { NEXT_PARAM, resolveNextPath } from '../lib/nextPath'
import { useAuthStore } from '../store/useAuthStore'

/**
 * Login page: full-viewport centered composition with a soft layered
 * background. Shows a skeleton while the auth session is being restored and,
 * once the user is authenticated, sends them on to wherever they were headed —
 * the plan in an email link, say — or to the dashboard when they just came here
 * to sign in. `resolveNextPath` is what decides which, and refuses anything it
 * cannot vouch for.
 */
export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isLoading = useAuthStore((s) => s.isLoading)
  const loggedIn = useAuthStore((s) => s.loggedIn)
  const selectedRole = useAuthStore((s) => s.selectedRole)
  const hasDepartment = useAuthStore((s) => s.user?.department_id != null)

  const next = searchParams.get(NEXT_PARAM)

  useEffect(() => {
    if (loggedIn) {
      navigate(resolveNextPath(next, selectedRole, { hasDepartment }))
    }
  }, [hasDepartment, loggedIn, navigate, next, selectedRole])

  if (isLoading) {
    return <AppLayoutSkeleton />
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="from-brand-50/70 via-background to-background dark:from-brand-900/20 absolute inset-0 bg-gradient-to-b" />
        <div className="bg-brand-100/60 dark:bg-brand-900/25 absolute -top-40 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full blur-3xl" />
        <div className="bg-secondary-100/50 dark:bg-secondary-900/20 absolute right-[12%] bottom-[8%] h-56 w-56 rounded-full blur-3xl" />
      </div>

      <main className="relative grid min-h-screen place-items-center px-6 py-12">
        <LoginForm />
      </main>
    </div>
  )
}
