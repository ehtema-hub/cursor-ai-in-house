import { useState } from 'react'
import { Navbar, type NavLink } from '@/components'
import { ProductCardDemo } from '@/pages/ProductCardDemo'
import { UserProfileDemo } from '@/pages/UserProfileDemo'
import { TaskDashboard } from '@/pages/TaskDashboard'

type DemoPage = 'tasks' | 'products' | 'profiles'

function App() {
  const [page, setPage] = useState<DemoPage>('tasks')

  if (page === 'tasks') {
    return <TaskDashboard onNavigateAway={() => setPage('products')} />
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
    {
      label: 'About',
      href: '#about',
      isActive: false,
      onClick: (event) => {
        event.preventDefault()
        alert('About page coming soon!')
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
            label: 'Settings',
            href: '#settings',
            icon: 'settings',
            onClick: () => alert('Opening settings…'),
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
