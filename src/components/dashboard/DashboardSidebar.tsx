import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  BarChart3,
  Settings,
  Users,
  X,
} from 'lucide-react'

export interface SidebarNavItem {
  id: string
  label: string
  icon: 'dashboard' | 'tasks' | 'calendar' | 'analytics' | 'team' | 'settings'
  isActive?: boolean
}

const ICONS = {
  dashboard: LayoutDashboard,
  tasks: CheckSquare,
  calendar: Calendar,
  analytics: BarChart3,
  team: Users,
  settings: Settings,
} as const

interface DashboardSidebarProps {
  items: SidebarNavItem[]
  isOpen: boolean
  onClose: () => void
  onNavigate: (id: string) => void
  sidebarId: string
  onNavigateAway?: () => void
}

export function DashboardSidebar({
  items,
  isOpen,
  onClose,
  onNavigate,
  sidebarId,
  onNavigateAway,
}: DashboardSidebarProps) {
  return (
    <>
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-gray-900/50 transition-opacity duration-300 lg:hidden ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      <aside
        id={sidebarId}
        aria-label="Dashboard navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out dark:border-gray-700 dark:bg-gray-900 lg:static lg:z-auto lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white"
            >
              T
            </span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              TaskFlow
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 lg:hidden dark:hover:bg-gray-800"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main">
          <ul className="space-y-1" role="list">
            {items.map((item) => {
              const Icon = ICONS[item.icon]
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate(item.id)
                      onClose()
                    }}
                    aria-current={item.isActive ? 'page' : undefined}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      item.isActive
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                    }`}
                  >
                    <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
                    {item.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="border-t border-gray-200 p-4 dark:border-gray-700">
          {onNavigateAway && (
            <button
              type="button"
              onClick={onNavigateAway}
              className="mb-3 w-full rounded-lg px-3 py-2 text-left text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-indigo-400"
            >
              ← Component demos
            </button>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            TaskFlow v1.0
          </p>
        </div>
      </aside>
    </>
  )
}
