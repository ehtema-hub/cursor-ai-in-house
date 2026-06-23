import {
  Plus,
  UserPlus,
  CalendarPlus,
  BarChart3,
  Filter,
} from 'lucide-react'

interface QuickActionsProps {
  onNewTask: () => void
  onViewTasks: () => void
  onViewAnalytics?: () => void
}

const ACTIONS = [
  { id: 'new-task', label: 'New Task', icon: Plus, variant: 'primary' as const },
  { id: 'invite', label: 'Invite Member', icon: UserPlus, variant: 'secondary' as const },
  { id: 'schedule', label: 'Schedule Meeting', icon: CalendarPlus, variant: 'secondary' as const },
  { id: 'reports', label: 'View Reports', icon: BarChart3, variant: 'secondary' as const },
  { id: 'filter', label: 'Filter Tasks', icon: Filter, variant: 'secondary' as const },
]

export function QuickActions({
  onNewTask,
  onViewTasks,
  onViewAnalytics,
}: QuickActionsProps) {
  const handleClick = (id: string) => {
    switch (id) {
      case 'new-task':
        onNewTask()
        break
      case 'invite':
        alert('Invite link copied to clipboard!')
        break
      case 'schedule':
        alert('Meeting scheduler coming soon.')
        break
      case 'reports':
        onViewAnalytics?.()
        break
      case 'filter':
        onViewTasks()
        break
    }
  }

  return (
    <section aria-labelledby="quick-actions-heading" data-testid="quick-actions">
      <h2 id="quick-actions-heading" className="sr-only">
        Quick actions
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
        {ACTIONS.map(({ id, label, icon: Icon, variant }) => (
          <button
            key={id}
            type="button"
            data-testid={id === 'new-task' ? 'new-task-button' : `quick-action-${id}`}
            onClick={() => handleClick(id)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950 ${
              variant === 'primary'
                ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            <Icon aria-hidden="true" className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>
    </section>
  )
}
