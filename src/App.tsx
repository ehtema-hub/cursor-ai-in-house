import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Navbar, type NavLink, type UserMenuItem } from '@/components'
import { ProductCardDemo } from '@/pages/ProductCardDemo'
import { UserProfileDemo } from '@/pages/UserProfileDemo'
import { TaskDashboard } from '@/pages/TaskDashboard'
import { AnalyticsDashboard } from '@/pages/AnalyticsDashboard'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'

type DemoPage = 'tasks' | 'analytics' | 'products' | 'profiles'
type AuthView = 'login' | 'register'

const getPageFromHash = (): DemoPage => {
  const hash = window.location.hash.replace('#', '')
  if (['tasks', 'analytics', 'products', 'profiles'].includes(hash)) {
    return hash as DemoPage
  }
  return 'tasks' // Default to tasks for authentication flow
}

function App() {
  const { user, logout: authLogout } = useAuth()
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

  const handleLogout = () => {
    authLogout()
    setAuthView('login')
  }

  const navLinks: NavLink[] = [
    {
      label: 'Products',
      href: '#products',
      isActive: page === 'products',
      onClick: (event) => {
        event.preventDefault()
        handlePageChange('products')
      },
    },
    {
      label: 'Profiles',
      href: '#profiles',
      isActive: page === 'profiles',
      onClick: (event) => {
        event.preventDefault()
        handlePageChange('profiles')
      },
    },
    {
      label: 'Tasks',
      href: '#tasks',
      isActive: page === 'tasks',
      onClick: (event) => {
        event.preventDefault()
        handlePageChange('tasks')
      },
    },
    {
      label: 'Analytics',
      href: '#analytics',
      isActive: page === 'analytics',
      onClick: (event) => {
        event.preventDefault()
        handlePageChange('analytics')
      },
    },
  ]

  const userMenuItems: UserMenuItem[] = [
    {
      label: 'Task Dashboard',
      href: '#tasks',
      icon: 'profile',
      onClick: () => handlePageChange('tasks'),
    },
    {
      label: 'Analytics',
      href: '#analytics',
      icon: 'settings',
      onClick: () => handlePageChange('analytics'),
    },
    {
      label: 'Products Demo',
      href: '#products',
      icon: 'profile',
      onClick: () => handlePageChange('products'),
    },
    {
      label: 'Profiles Demo',
      href: '#profiles',
      icon: 'settings',
      onClick: () => handlePageChange('profiles'),
    },
    {
      label: 'Sign out',
      href: '#signout',
      icon: 'logout',
      onClick: () => handleLogout(),
    },
  ]

  return (
    <>
      <Navbar
        brandName="ShopVerse"
        links={navLinks}
        userAvatarUrl="https://api.dicebear.com/9.x/avataaars/svg?seed=Jordan"
        userName="Jordan Lee"
        searchPlaceholder="Search products, brands…"
        onSearch={(query) => {
          if (query) alert(`Searching for "${query}"…`)
        }}
        userMenuItems={userMenuItems}
      />

      {page === 'products' && <ProductCardDemo />}
      {page === 'profiles' && <UserProfileDemo />}

      {page === 'tasks' && (!user ? (
        authView === 'login' ? (
          <LoginPage onSwitchToRegister={() => setAuthView('register')} />
        ) : (
          <RegisterPage onSwitchToLogin={() => setAuthView('login')} />
        )
      ) : (
        <TaskDashboard
          user={user}
          onLogout={handleLogout}
          onNavigateAway={() => handlePageChange('products')}
          onNavigateToAnalytics={() => handlePageChange('analytics')}
        />
      ))}

      {page === 'analytics' && (
        <AnalyticsDashboard onNavigateAway={() => handlePageChange('tasks')} />
      )}
    </>
  )
}

export default App
