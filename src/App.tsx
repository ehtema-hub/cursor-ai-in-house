import { useState } from 'react'
import { Navbar, type NavLink } from '@/components'
import { ProductCardDemo } from '@/pages/ProductCardDemo'
import { UserProfileDemo } from '@/pages/UserProfileDemo'

type DemoPage = 'products' | 'profiles'

function App() {
  const [page, setPage] = useState<DemoPage>('products')

  const navLinks: NavLink[] = [
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
      label: 'Deals',
      href: '#deals',
      isActive: false,
      onClick: (event) => {
        event.preventDefault()
        alert('Deals page coming soon!')
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
          { label: 'My Profile', href: '#profile', icon: 'profile', onClick: () => setPage('profiles') },
          { label: 'Settings', href: '#settings', icon: 'settings', onClick: () => alert('Opening settings…') },
          { label: 'Sign out', href: '#signout', icon: 'logout', onClick: () => alert('Signing out…') },
        ]}
      />

      {page === 'products' ? <ProductCardDemo /> : <UserProfileDemo />}
    </div>
  )
}

export default App
