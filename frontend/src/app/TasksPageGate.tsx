import type { User } from '@/lib/auth'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { TaskDashboard } from '@/pages/TaskDashboard'

type AuthView = 'login' | 'register'

interface TasksPageGateProps {
  user: User | null
  isLoading: boolean
  authView: AuthView
  onSwitchToRegister: () => void
  onSwitchToLogin: () => void
  onLogout: () => void
  onNavigateAway: () => void
  onNavigateToAnalytics: () => void
}

export function TasksPageGate({
  user,
  isLoading,
  authView,
  onSwitchToRegister,
  onSwitchToLogin,
  onLogout,
  onNavigateAway,
  onNavigateToAnalytics,
}: TasksPageGateProps) {
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500">
        Loading…
      </div>
    )
  }

  if (!user) {
    return authView === 'login' ? (
      <LoginPage onSwitchToRegister={onSwitchToRegister} />
    ) : (
      <RegisterPage onSwitchToLogin={onSwitchToLogin} />
    )
  }

  return (
    <TaskDashboard
      user={user}
      onLogout={onLogout}
      onNavigateAway={onNavigateAway}
      onNavigateToAnalytics={onNavigateToAnalytics}
    />
  )
}
