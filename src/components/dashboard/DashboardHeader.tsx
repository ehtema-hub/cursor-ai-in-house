import { useEffect, useId, useRef, useState } from 'react'
import {
  Menu,
  Bell,
  Moon,
  Sun,
  ChevronDown,
  User,
  Settings,
  LogOut,
} from 'lucide-react'

interface DashboardHeaderProps {
  title: string
  userName: string
  userAvatarUrl: string
  isDarkMode: boolean
  onToggleDarkMode: () => void
  onOpenSidebar: () => void
}

export function DashboardHeader({
  title,
  userName,
  userAvatarUrl,
  isDarkMode,
  onToggleDarkMode,
  onOpenSidebar,
}: DashboardHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const baseId = useId()
  const menuId = `${baseId}-user-menu`
  const menuButtonId = `${baseId}-user-menu-button`

  useEffect(() => {
    const handlePointerDown = (event: globalThis.MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-gray-200 bg-white/80 px-4 backdrop-blur-md dark:border-gray-700 dark:bg-gray-900/80 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Open navigation menu"
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 lg:hidden dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <Menu aria-hidden="true" className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onToggleDarkMode}
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          {isDarkMode ? (
            <Sun aria-hidden="true" className="h-5 w-5" />
          ) : (
            <Moon aria-hidden="true" className="h-5 w-5" />
          )}
        </button>

        <button
          type="button"
          aria-label="Notifications, 3 unread"
          className="relative rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <Bell aria-hidden="true" className="h-5 w-5" />
          <span
            aria-hidden="true"
            className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500"
          />
        </button>

        <div ref={menuRef} className="relative">
          <button
            id={menuButtonId}
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
            aria-controls={menuId}
            aria-label={`${userName} account menu`}
            className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:hover:bg-gray-800"
          >
            <img
              src={userAvatarUrl}
              alt=""
              aria-hidden="true"
              className="h-8 w-8 rounded-full object-cover"
              width={32}
              height={32}
            />
            <span className="hidden text-sm font-medium text-gray-700 md:inline dark:text-gray-300">
              {userName}
            </span>
            <ChevronDown
              aria-hidden="true"
              className={`hidden h-4 w-4 text-gray-500 transition-transform duration-200 md:block ${isMenuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          <div
            id={menuId}
            role="menu"
            aria-labelledby={menuButtonId}
            className={`absolute right-0 mt-2 w-56 origin-top-right overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg transition-all duration-200 dark:border-gray-700 dark:bg-gray-800 ${
              isMenuOpen
                ? 'pointer-events-auto scale-100 opacity-100'
                : 'pointer-events-none scale-95 opacity-0'
            }`}
          >
            <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-700">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {userName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                jordan@taskflow.app
              </p>
            </div>
            <ul className="py-1" role="none">
              {[
                { label: 'Profile', icon: User },
                { label: 'Settings', icon: Settings },
                { label: 'Sign out', icon: LogOut },
              ].map(({ label, icon: Icon }) => (
                <li key={label} role="none">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <Icon aria-hidden="true" className="h-4 w-4" />
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </header>
  )
}
