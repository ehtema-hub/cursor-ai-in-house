import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Navbar } from '@/components'
import { ProductCardDemo } from '@/pages/ProductCardDemo'
import { UserProfileDemo } from '@/pages/UserProfileDemo'
import { AnalyticsDashboard } from '@/pages/AnalyticsDashboard'
import { QADashboard } from '@/pages/QADashboard'
import { FeedPage } from '@/pages/FeedPage'
import {
  buildNavLinks,
  buildUserMenuItems,
  getPageFromHash,
  type DemoPage,
} from '@/app/navConfig'
import { TasksPageGate } from '@/app/TasksPageGate'

type AuthView = 'login' | 'register'

function App() {
  const { user, isLoading, logout: authLogout } = useAuth()
  const [page, setPage] = useState<DemoPage>(getPageFromHash())
  const [authView, setAuthView] = useState<AuthView>('login')

  useEffect(() => {
    const handleHashChange = () => {
      setPage(getPageFromHash())
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const handlePageChange = (newPage: DemoPage) => {
    window.location.hash = newPage
    setPage(newPage)
  }

  const handleLogout = async () => {
    await authLogout()
    setAuthView('login')
  }

  const userAvatarUrl = user
    ? `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`
    : 'https://api.dicebear.com/9.x/avataaars/svg?seed=Guest'
  const userName = user?.name ?? 'Guest'

  return (
    <>
      <Navbar
        brandName="ShopVerse"
        links={buildNavLinks(page, handlePageChange)}
        userAvatarUrl={userAvatarUrl}
        userName={userName}
        searchPlaceholder="Search products, brands…"
        onSearch={(query) => {
          if (query) alert(`Searching for "${query}"…`)
        }}
        userMenuItems={buildUserMenuItems(handlePageChange, handleLogout)}
      />

      {page === 'products' && <ProductCardDemo />}
      {page === 'profiles' && <UserProfileDemo />}

      {page === 'tasks' && (
        <TasksPageGate
          user={user}
          isLoading={isLoading}
          authView={authView}
          onSwitchToRegister={() => setAuthView('register')}
          onSwitchToLogin={() => setAuthView('login')}
          onLogout={handleLogout}
          onNavigateAway={() => handlePageChange('products')}
          onNavigateToAnalytics={() => handlePageChange('analytics')}
        />
      )}

      {page === 'analytics' && (
        <AnalyticsDashboard onNavigateAway={() => handlePageChange('tasks')} />
      )}

      {page === 'qa' && (
        <QADashboard onNavigateAway={() => handlePageChange('tasks')} />
      )}

      {page === 'feed' && <FeedPage />}
    </>
  )
}

export default App
