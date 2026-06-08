import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Navbar, type NavLink } from '@/components'
import { ProductCardDemo } from '@/pages/ProductCardDemo'
import { UserProfileDemo } from '@/pages/UserProfileDemo'
import { TaskDashboard } from '@/pages/TaskDashboard'
import { AnalyticsDashboard } from '@/pages/AnalyticsDashboard'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'

type DemoPage = 'tasks' | 'analytics' | 'products' | 'profiles'
type AuthView = 'login' | 'register'

function App() {
  const { user, logout: authLogout } = useAuth()
  const [page, setPage] = useState<DemoPage>('tasks')
  const [authView, setAuthView] = useState<AuthView>('login')

  const handleLogout = () => {
    authLogout()
    setAuthView('login')
  }

  if (page === 'tasks') {
    if (!user) {
      return authView === 'login' ? (
        <LoginPage onSwitchToRegister={() => setAuthView('register')} />
      ) : (
        <RegisterPage onSwitchToLogin={() => setAuthView('login')} />
      )
    }

    return (
      <TaskDashboard
        user={user}
        onLogout={handleLogout}
        onNavigateAway={() => setPage('products')}
        onNavigateToAnalytics={() => setPage('analytics')}
      />
    )
  }

  if (page === 'analytics') {
    return <AnalyticsDashboard onNavigateAway={() => setPage('tasks')} />
  }

  const navLinks: NavLink[] = [
    {
      label: 'Tasks',
      href: '#tasks',
      isActive: false,
      onClick: (event) => {
        event.preventDefault()
        setPage('tasks')
      },
    },
    {
      label: 'Analytics',
      href: '#analytics',
      isActive: false,
      onClick: (event) => {
        event.preventDefault()
        setPage('analytics')
      },
    },
    {
      label: 'Products',
      href: '#products',
      isActive: page === 'products',
      onClick: (event) => {
        event.preventDefault()
        setPage('products')
      },
    },
    {
      label: 'Profiles',
      href: '#profiles',
      isActive: page === 'profiles',
      onClick: (event) => {
        event.preventDefault()
        setPage('profiles')
      },
    },
  ]

  return (
    <div>
      <Navbar
        brandName="ShopVerse"
        links={navLinks}
        userAvatarUrl="https://api.dicebear.com/9.x/avataaars/svg?seed=Jordan"
        userName="Jordan Lee"
        searchPlaceholder="Search products, brands…"
        onSearch={(query) => {
          if (query) alert(`Searching for "${query}"…`)
        }}
        userMenuItems={[
          {
            label: 'Task Dashboard',
            href: '#tasks',
            icon: 'profile',
            onClick: () => setPage('tasks'),
          },
          {
            label: 'Analytics',
            href: '#analytics',
            icon: 'settings',
            onClick: () => setPage('analytics'),
          },
          {
            label: 'Sign out',
            href: '#signout',
            icon: 'logout',
            onClick: () => alert('Signing out…'),
          },
        ]}
      />

      {page === 'products' ? <ProductCardDemo /> : <UserProfileDemo />}
    </div>
  )
}

export default App
