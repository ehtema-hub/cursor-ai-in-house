import { ArrowRight } from 'lucide-react'
import { StatWidget } from './StatWidget'
import { QuickActions } from './QuickActions'
import { ProjectOverview } from './ProjectOverview'
import { TeamMemberAvatars } from './TeamMemberAvatars'
import { TaskProgressChart } from './TaskProgressChart'
import { RecentActivityFeed } from './RecentActivityFeed'
import { TaskCard } from './TaskCard'
import { useTaskDashboard } from '@/context/TaskDashboardContext'

interface DashboardHomeViewProps {
  userName: string
  onNewTask: () => void
  onViewTasks: () => void
  onViewAnalytics?: () => void
  onStatusChange: (id: string, status: import('@/data/sampleTasks').TaskStatus) => void
  onDelete: (id: string) => void
}

export function DashboardHomeView({
  userName,
  onNewTask,
  onViewTasks,
  onViewAnalytics,
  onStatusChange,
  onDelete,
}: DashboardHomeViewProps) {
  const { stats, tasks } = useTaskDashboard()
  const recentTasks = tasks.slice(0, 4)

  return (
    <div className="space-y-6" data-testid="dashboard-home">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {userName.split(' ')[0]}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Here&apos;s what&apos;s happening across your team today.
        </p>
      </div>

      <QuickActions
        onNewTask={onNewTask}
        onViewTasks={onViewTasks}
        onViewAnalytics={onViewAnalytics}
      />

      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">
          Task statistics
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <StatWidget key={stat.id} stat={stat} />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <ProjectOverview />
        </div>
        <TeamMemberAvatars compact />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TaskProgressChart />
        <RecentActivityFeed />
      </div>

      <section aria-labelledby="recent-tasks-heading">
        <div className="mb-4 flex items-center justify-between">
          <h2
            id="recent-tasks-heading"
            className="text-lg font-semibold text-gray-900 dark:text-white"
          >
            Recent Tasks
          </h2>
          <button
            type="button"
            onClick={onViewTasks}
            data-testid="view-all-tasks"
            className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            View all
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        <div role="list" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {recentTasks.map((task) => (
            <div key={task.id} role="listitem">
              <TaskCard
                task={task}
                onStatusChange={onStatusChange}
                onDelete={onDelete}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
