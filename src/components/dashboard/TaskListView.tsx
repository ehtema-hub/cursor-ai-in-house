import { Plus, Filter } from 'lucide-react'
import { StatWidget } from './StatWidget'
import { TaskCard } from './TaskCard'
import { useTaskDashboard } from '@/context/TaskDashboardContext'
import type { TaskStatus } from '@/data/sampleTasks'

interface TaskListViewProps {
  statusFilter: TaskStatus | 'all'
  onStatusFilterChange: (filter: TaskStatus | 'all') => void
  onNewTask: () => void
  onStatusChange: (id: string, status: TaskStatus) => void
  onDelete: (id: string) => void
}

export function TaskListView({
  statusFilter,
  onStatusFilterChange,
  onNewTask,
  onStatusChange,
  onDelete,
}: TaskListViewProps) {
  const { tasks, stats } = useTaskDashboard()

  const filteredTasks =
    statusFilter === 'all'
      ? tasks
      : tasks.filter((task) => task.status === statusFilter)

  return (
    <div className="space-y-8" data-testid="task-list-view">
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

      <section aria-labelledby="tasks-heading">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2
              id="tasks-heading"
              className="text-xl font-bold text-gray-900 dark:text-white"
            >
              My Tasks
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
                  onStatusFilterChange(
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
              onClick={onNewTask}
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
                  onStatusChange={onStatusChange}
                  onDelete={onDelete}
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
    </div>
  )
}
