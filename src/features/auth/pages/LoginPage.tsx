import { ThemeSwitcher } from '@/components/common/ThemeSwitcher'
import AppLayoutSkeleton from '@/components/skeletons/AppLayoutSkeleton'
import useAuth from '@/shared/hooks/useAuth'
import LoginForm from '../components/LoginForm'

function LoginPage() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return <AppLayoutSkeleton />
  }

  return (
    <div className="bg-background relative grid min-h-screen place-items-center">
      <div className="absolute top-4 right-4">
        <ThemeSwitcher />
      </div>

      <LoginForm />
    </div>
  )
}

export default LoginPage
