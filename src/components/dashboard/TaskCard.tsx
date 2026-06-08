import { Calendar, MoreHorizontal } from 'lucide-react'
import type { Task, TaskPriority, TaskStatus } from '@/data/sampleTasks'

interface TaskCardProps {
  task: Task
  onStatusChange?: (id: string, status: TaskStatus) => void
}

const STATUS_STYLES: Record<TaskStatus, string> = {
  todo: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  'in-progress':
    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  done: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  done: 'Done',
}

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  low: 'border-l-gray-300 dark:border-l-gray-600',
  medium: 'border-l-amber-400 dark:border-l-amber-500',
  high: 'border-l-red-500 dark:border-l-red-400',
}

function formatDueDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function TaskCard({ task, onStatusChange }: TaskCardProps) {
  const isOverdue =
    task.status !== 'done' && new Date(task.dueDate) < new Date()

  return (
    <article
      aria-labelledby={`task-${task.id}-title`}
      className={`group rounded-xl border border-gray-200 border-l-4 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800 ${PRIORITY_STYLES[task.priority]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[task.status]}`}
            >
              {STATUS_LABELS[task.status]}
            </span>
            {task.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-gray-50 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400"
              >
                {tag}
              </span>
            ))}
          </div>

          <h3
            id={`task-${task.id}-title`}
            className="text-base font-semibold text-gray-900 dark:text-white"
          >
            {task.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
            {task.description}
          </p>
        </div>

        <button
          type="button"
          aria-label={`More options for ${task.title}`}
          className="shrink-0 rounded-lg p-1.5 text-gray-400 opacity-0 transition-all hover:bg-gray-100 hover:text-gray-600 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 group-hover:opacity-100 dark:hover:bg-gray-700 dark:hover:text-gray-200"
        >
          <MoreHorizontal aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <img
            src={task.assigneeAvatar}
            alt=""
            aria-hidden="true"
            className="h-7 w-7 rounded-full object-cover"
            width={28}
            height={28}
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {task.assignee}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <time
            dateTime={task.dueDate}
            className={`flex items-center gap-1 text-sm ${
              isOverdue
                ? 'font-medium text-red-600 dark:text-red-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <Calendar aria-hidden="true" className="h-4 w-4" />
            {formatDueDate(task.dueDate)}
            {isOverdue && <span className="sr-only">, overdue</span>}
          </time>

          {onStatusChange && task.status !== 'done' && (
            <button
              type="button"
              onClick={() =>
                onStatusChange(
                  task.id,
                  task.status === 'todo' ? 'in-progress' : 'done',
                )
              }
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              {task.status === 'todo' ? 'Start' : 'Complete'}
            </button>
          )}
        </div>
      </footer>
    </article>
  )
}
