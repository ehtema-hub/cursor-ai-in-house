import type { NavLink, UserMenuItem } from '@/components'

export type DemoPage = 'tasks' | 'analytics' | 'products' | 'profiles' | 'feed' | 'qa'

const NAV_ITEMS: { label: string; page: DemoPage }[] = [
  { label: 'Products', page: 'products' },
  { label: 'Profiles', page: 'profiles' },
  { label: 'Tasks', page: 'tasks' },
  { label: 'Blog', page: 'feed' },
  { label: 'Analytics', page: 'analytics' },
  { label: 'QA', page: 'qa' },
]

const MENU_ITEMS: { label: string; page: DemoPage; icon: UserMenuItem['icon'] }[] = [
  { label: 'Task Dashboard', page: 'tasks', icon: 'profile' },
  { label: 'Analytics', page: 'analytics', icon: 'settings' },
  { label: 'Team Blog', page: 'feed', icon: 'profile' },
  { label: 'Products Demo', page: 'products', icon: 'profile' },
  { label: 'Profiles Demo', page: 'profiles', icon: 'settings' },
]

export function getPageFromHash(): DemoPage {
  const hash = window.location.hash.replace('#', '')
  if (NAV_ITEMS.some((item) => item.page === hash)) {
    return hash as DemoPage
  }
  return 'tasks'
}

export function buildNavLinks(
  page: DemoPage,
  onPageChange: (page: DemoPage) => void,
): NavLink[] {
  return NAV_ITEMS.map(({ label, page: target }) => ({
    label,
    href: `#${target}`,
    isActive: page === target,
    onClick: (event) => {
      event.preventDefault()
      onPageChange(target)
    },
  }))
}

export function buildUserMenuItems(
  onPageChange: (page: DemoPage) => void,
  onLogout: () => void,
): UserMenuItem[] {
  return [
    ...MENU_ITEMS.map(({ label, page, icon }) => ({
      label,
      href: `#${page}`,
      icon,
      onClick: () => onPageChange(page),
    })),
    {
      label: 'Sign out',
      href: '#signout',
      icon: 'logout' as const,
      onClick: () => onLogout(),
    },
  ]
}
