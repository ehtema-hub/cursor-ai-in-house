import { useEffect, useId, useState } from 'react'
import { Plus, Filter } from 'lucide-react'
import {
  DashboardSidebar,
  type SidebarNavItem,
} from '@/components/dashboard/DashboardSidebar'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { StatWidget } from '@/components/dashboard/StatWidget'
import { TaskCard } from '@/components/dashboard/TaskCard'
import { TaskCreateModal } from '@/components/dashboard/TaskCreateModal'
import { SettingsPanel } from '@/components/settings/SettingsPanel'
import type { User } from '@/lib/auth'
import { REGISTRATION_SUCCESS_KEY } from '@/pages/RegisterPage'
import type { ThemePreference } from '@/types/settings'
import {
  sampleTasks,
  dashboardStats,
  type Task,
  type TaskStatus,
} from '@/data/sampleTasks'

const SIDEBAR_ITEMS: SidebarNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'tasks', label: 'My Tasks', icon: 'tasks' },
  { id: 'calendar', label: 'Calendar', icon: 'calendar' },
  { id: 'analytics', label: 'Analytics', icon: 'analytics' },
  { id: 'team', label: 'Team', icon: 'team' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
]

function resolveDarkMode(theme: ThemePreference): boolean {
  if (theme === 'dark') return true
  if (theme === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function getStoredTheme(): ThemePreference {
  const stored = localStorage.getItem('theme')
  if (stored === 'dark' || stored === 'light' || stored === 'system') {
    return stored
  }
  return 'system'
}

interface TaskDashboardProps {
  user: User
  onLogout: () => void
  onNavigateAway?: () => void
  onNavigateToAnalytics?: () => void
}

export function TaskDashboard({
  user,
  onLogout,
  onNavigateAway,
  onNavigateToAnalytics,
}: TaskDashboardProps) {
  const [tasks, setTasks] = useState<Task[]>(sampleTasks)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [themePreference, setThemePreference] = useState<ThemePreference>(getStoredTheme)
  const isDarkMode = resolveDarkMode(themePreference)
  const [activeNav, setActiveNav] = useState('dashboard')
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all')
  const [showRegistrationSuccess, setShowRegistrationSuccess] = useState(
    () => sessionStorage.getItem(REGISTRATION_SUCCESS_KEY) === 'true',
  )
  const sidebarId = useId()

  useEffect(() => {
    if (!showRegistrationSuccess) return
    sessionStorage.removeItem(REGISTRATION_SUCCESS_KEY)
  }, [showRegistrationSuccess])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode)
    localStorage.setItem('theme', themePreference)
  }, [isDarkMode, themePreference])

  const handleThemePreference = (theme: ThemePreference) => {
    setThemePreference(theme)
  }

  const handleToggleDarkMode = () => {
    setThemePreference(isDarkMode ? 'light' : 'dark')
  }

  useEffect(() => {
    document.body.style.overflow = isSidebarOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isSidebarOpen])

  const handleStatusChange = (id: string, status: TaskStatus) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, status } : task)),
    )
  }

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id))
  }

  const handleCreateTask = (
    taskData: Omit<Task, 'id' | 'assignee' | 'assigneeAvatar'>,
  ) => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
      assignee: user.name,
      assigneeAvatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`,
    }
    setTasks((prev) => [newTask, ...prev])
  }

  const filteredTasks =
    statusFilter === 'all'
      ? tasks
      : tasks.filter((task) => task.status === statusFilter)

  const navItems = SIDEBAR_ITEMS.map((item) => ({
    ...item,
    isActive: item.id === activeNav,
  }))

  const pageTitles: Record<string, string> = {
    dashboard: 'Dashboard',
    tasks: 'My Tasks',
    calendar: 'Calendar',
    analytics: 'Analytics',
    team: 'Team',
    settings: 'Settings',
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950" data-testid="task-dashboard">
      <DashboardSidebar
        items={navItems}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNavigate={(id) => {
          if (id === 'analytics' && onNavigateToAnalytics) {
            onNavigateToAnalytics()
            return
          }
          setActiveNav(id)
        }}
        sidebarId={sidebarId}
        onNavigateAway={onNavigateAway}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader
          title={pageTitles[activeNav] ?? 'Dashboard'}
          userName={user.name}
          userAvatarUrl={`https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`}
          isDarkMode={isDarkMode}
          onToggleDarkMode={handleToggleDarkMode}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onLogout={onLogout}
        />

        <main
          id="main-content"
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8"
        >
          {showRegistrationSuccess && (
            <p
              role="status"
              data-testid="register-success-message"
              className="mb-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-300"
            >
              Account created successfully! Welcome to TaskFlow, {user.name}.
            </p>
          )}

          {activeNav === 'settings' ? (
            <SettingsPanel onThemeChange={handleThemePreference} />
          ) : activeNav !== 'dashboard' && activeNav !== 'tasks' ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {pageTitles[activeNav]} — Coming soon
              </p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                This section is under development.
              </p>
            </div>
          ) : (
            <>
              <section aria-labelledby="stats-heading" className="mb-8">
                <h2 id="stats-heading" className="sr-only">
                  Task statistics
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {dashboardStats.map((stat) => (
                    <StatWidget key={stat.id} stat={stat} />
                  ))}
                </div>
              </section>

              <section aria-labelledby="tasks-heading">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2
                      id="tasks-heading"
                      className="text-xl font-bold text-gray-900 dark:text-white"
                    >
                      Recent Tasks
                    </h2>
                    <p
                      className="mt-1 text-sm text-gray-500 dark:text-gray-400"
                      data-testid="task-count"
                    >
                      {filteredTasks.length} task
                      {filteredTasks.length !== 1 ? 's' : ''} shown
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Filter
                        aria-hidden="true"
                        className="h-4 w-4 text-gray-400"
                      />
                      <label htmlFor="status-filter" className="sr-only">
                        Filter by status
                      </label>
                      <select
                        id="status-filter"
                        data-testid="status-filter"
                        value={statusFilter}
                        onChange={(event) =>
                          setStatusFilter(
                            event.target.value as TaskStatus | 'all',
                          )
                        }
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                      >
                        <option value="all">All statuses</option>
                        <option value="todo">To Do</option>
                        <option value="in-progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      data-testid="new-task-button"
                      onClick={() => setIsCreateModalOpen(true)}
                      className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950"
                    >
                      <Plus aria-hidden="true" className="h-4 w-4" />
                      New Task
                    </button>
                  </div>
                </div>

                <div
                  role="list"
                  className="grid grid-cols-1 gap-4 lg:grid-cols-2"
                >
                  {filteredTasks.length > 0 ? (
                    filteredTasks.map((task) => (
                      <div key={task.id} role="listitem">
                        <TaskCard
                          task={task}
                          onStatusChange={handleStatusChange}
                          onDelete={handleDeleteTask}
                        />
                      </div>
                    ))
                  ) : (
                    <p
                      className="col-span-full py-12 text-center text-gray-500 dark:text-gray-400"
                      data-testid="empty-tasks-message"
                    >
                      No tasks match the selected filter.
                    </p>
                  )}
                </div>
              </section>
            </>
          )}
        </main>
      </div>

      <TaskCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateTask}
        assigneeName={user.name}
      />
    </div>
  )
}
