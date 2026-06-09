import { Calendar, GripVertical, User } from 'lucide-react'
import type { DragEvent } from 'react'
import type { KanbanTask } from '@/types/kanban'
import { PRIORITY_LABELS, STATUS_LABELS } from '@/types/kanban'
import type { TaskPriority } from '@/data/sampleTasks'

export interface KanbanTaskCardProps {
  task: KanbanTask
  isDragging?: boolean
  onDragStart?: (taskId: string) => void
  onDragEnd?: () => void
}

const PRIORITY_BADGE: Record<TaskPriority, string> = {
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  high: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

const PRIORITY_BORDER: Record<TaskPriority, string> = {
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

export function TaskCard({
  task,
  isDragging = false,
  onDragStart,
  onDragEnd,
}: KanbanTaskCardProps) {
  const isOverdue =
    task.status !== 'done' && new Date(task.dueDate) < new Date()

  const handleDragStart = (event: DragEvent<HTMLElement>) => {
    event.dataTransfer.setData('text/kanban-task-id', task.id)
    event.dataTransfer.effectAllowed = 'move'
    onDragStart?.(task.id)
  }

  return (
    <article
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      aria-labelledby={`kanban-task-${task.id}-title`}
      aria-grabbed={isDragging}
      data-testid={`kanban-task-card-${task.id}`}
      className={`group rounded-lg border border-gray-200 border-l-4 bg-white p-4 shadow-sm transition-all dark:border-gray-700 dark:bg-gray-800 ${PRIORITY_BORDER[task.priority]} ${
        isDragging
          ? 'scale-[0.98] opacity-50 ring-2 ring-indigo-400'
          : 'hover:shadow-md'
      }`}
    >
      <div className="mb-2 flex items-start gap-2">
        <button
          type="button"
          draggable={false}
          aria-label={`Drag ${task.title}`}
          className="mt-0.5 shrink-0 cursor-grab rounded p-0.5 text-gray-400 opacity-0 transition-opacity hover:text-gray-600 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 group-hover:opacity-100 active:cursor-grabbing dark:hover:text-gray-300"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <GripVertical aria-hidden="true" className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          <h3
            id={`kanban-task-${task.id}-title`}
            className="text-sm font-semibold text-gray-900 dark:text-white"
          >
            {task.title}
          </h3>
          {task.description && (
            <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
              {task.description}
            </p>
          )}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGE[task.priority]}`}
        >
          {PRIORITY_LABELS[task.priority]}
        </span>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
          {STATUS_LABELS[task.status]}
        </span>
      </div>

      <footer className="flex items-center justify-between gap-2 border-t border-gray-100 pt-3 dark:border-gray-700">
        <div className="flex min-w-0 items-center gap-1.5">
          <img
            src={task.assigneeAvatar}
            alt=""
            aria-hidden="true"
            className="h-6 w-6 shrink-0 rounded-full object-cover"
            width={24}
            height={24}
          />
          <span className="truncate text-xs text-gray-600 dark:text-gray-400">
            <User aria-hidden="true" className="mr-0.5 inline h-3 w-3" />
            {task.assignee}
          </span>
        </div>

        <time
          dateTime={task.dueDate}
          className={`flex shrink-0 items-center gap-1 text-xs ${
            isOverdue
              ? 'font-medium text-red-600 dark:text-red-400'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          <Calendar aria-hidden="true" className="h-3 w-3" />
          {formatDueDate(task.dueDate)}
          {isOverdue && <span className="sr-only">, overdue</span>}
        </time>
      </footer>
    </article>
  )
}
