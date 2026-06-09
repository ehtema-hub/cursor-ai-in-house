import { useEffect, useId, useState } from 'react'
import {
  DashboardSidebar,
  DashboardHeader,
  DashboardHomeView,
  TaskListView,
  TeamView,
  type SidebarNavItem,
} from '@/components/dashboard'
import { TaskCreateModal } from '@/components/dashboard/TaskCreateModal'
import { KanbanBoard } from '@/components/kanban'
import { SettingsPanel } from '@/components/settings/SettingsPanel'
import {
  TaskDashboardProvider,
  useTaskDashboard,
} from '@/context/TaskDashboardContext'
import { useTheme } from '@/context/ThemeContext'
import type { User } from '@/lib/auth'
import { REGISTRATION_SUCCESS_KEY } from '@/pages/RegisterPage'
import type { TaskStatus } from '@/data/sampleTasks'

const SIDEBAR_ITEMS: SidebarNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'tasks', label: 'My Tasks', icon: 'tasks' },
  { id: 'calendar', label: 'Calendar', icon: 'calendar' },
  { id: 'analytics', label: 'Analytics', icon: 'analytics' },
  { id: 'team', label: 'Team', icon: 'team' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
]

interface TaskDashboardProps {
  user: User
  onLogout: () => void
  onNavigateAway?: () => void
  onNavigateToAnalytics?: () => void
}

function TaskDashboardContent({
  user,
  onLogout,
  onNavigateAway,
  onNavigateToAnalytics,
}: TaskDashboardProps) {
  const { createTask, updateTaskStatus, deleteTask } = useTaskDashboard()
  const { isDarkMode, toggleDarkMode, setThemePreference } = useTheme()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [activeNav, setActiveNav] = useState('dashboard')
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all')
  const [showRegistrationSuccess] = useState(
    () => sessionStorage.getItem(REGISTRATION_SUCCESS_KEY) === 'true',
  )
  const sidebarId = useId()

  const actor = {
    name: user.name,
    avatarUrl: `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`,
  }

  useEffect(() => {
    if (!showRegistrationSuccess) return
    sessionStorage.removeItem(REGISTRATION_SUCCESS_KEY)
  }, [showRegistrationSuccess])

  useEffect(() => {
    document.body.style.overflow = isSidebarOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isSidebarOpen])

  const handleStatusChange = (id: string, status: TaskStatus) => {
    updateTaskStatus(id, status, actor)
  }

  const handleDeleteTask = (id: string) => {
    deleteTask(id, actor)
  }

  const handleCreateTask = (
    taskData: Parameters<typeof createTask>[0],
  ) => {
    createTask(taskData, actor)
  }

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
          userAvatarUrl={actor.avatarUrl}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
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
            <SettingsPanel
              onThemeChange={(theme) => setThemePreference(theme)}
            />
          ) : activeNav === 'dashboard' ? (
            <DashboardHomeView
              userName={user.name}
              onNewTask={() => setIsCreateModalOpen(true)}
              onViewTasks={() => setActiveNav('tasks')}
              onViewAnalytics={onNavigateToAnalytics}
              onStatusChange={handleStatusChange}
              onDelete={handleDeleteTask}
            />
          ) : activeNav === 'tasks' ? (
            <TaskListView
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              onNewTask={() => setIsCreateModalOpen(true)}
              onStatusChange={handleStatusChange}
              onDelete={handleDeleteTask}
            />
          ) : activeNav === 'team' ? (
            <TeamView />
          ) : activeNav === 'calendar' ? (
            <KanbanBoard />
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {pageTitles[activeNav]} — Coming soon
              </p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                This section is under development.
              </p>
            </div>
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

export function TaskDashboard(props: TaskDashboardProps) {
  return (
    <TaskDashboardProvider>
      <TaskDashboardContent {...props} />
    </TaskDashboardProvider>
  )
}
