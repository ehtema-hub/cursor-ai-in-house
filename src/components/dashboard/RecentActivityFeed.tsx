import {
  CheckCircle2,
  MessageSquare,
  PlayCircle,
  PlusCircle,
  Trash2,
  UserPlus,
} from 'lucide-react'
import { useTaskDashboard } from '@/context/TaskDashboardContext'
import type { ActivityType } from '@/data/teamDashboard'

const ACTIVITY_ICONS: Record<ActivityType, typeof CheckCircle2> = {
  task_completed: CheckCircle2,
  task_started: PlayCircle,
  task_created: PlusCircle,
  task_deleted: Trash2,
  comment: MessageSquare,
  member_joined: UserPlus,
}

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  task_completed: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30',
  task_started: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30',
  task_created: 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/30',
  task_deleted: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30',
  comment: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30',
  member_joined: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/30',
}

function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function RecentActivityFeed() {
  const { activities } = useTaskDashboard()

  return (
    <section
      aria-labelledby="activity-heading"
      data-testid="activity-feed"
      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <h2
        id="activity-heading"
        className="mb-4 text-base font-semibold text-gray-900 dark:text-white"
      >
        Recent Activity
      </h2>

      <ol role="list" className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = ACTIVITY_ICONS[activity.type]
          const colorClass = ACTIVITY_COLORS[activity.type]

          return (
            <li
              key={activity.id}
              data-testid={`activity-item-${activity.id}`}
              className="flex gap-3"
            >
              <div className="relative flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorClass}`}
                >
                  <Icon aria-hidden="true" className="h-4 w-4" />
                </div>
                {index < activities.length - 1 && (
                  <div
                    aria-hidden="true"
                    className="mt-1 w-px flex-1 bg-gray-200 dark:bg-gray-700"
                  />
                )}
              </div>

              <div className="min-w-0 flex-1 pb-1">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {activity.actorName}
                  </span>{' '}
                  {activity.message}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <time
                    dateTime={activity.timestamp}
                    className="text-xs text-gray-400 dark:text-gray-500"
                  >
                    {formatRelativeTime(activity.timestamp)}
                  </time>
                  {activity.projectName && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      · {activity.projectName}
                    </span>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
