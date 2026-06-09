import { Inbox } from 'lucide-react'
import type { DragEvent } from 'react'
import type { KanbanTask } from '@/types/kanban'
import type { TaskStatus } from '@/data/sampleTasks'
import { TaskCard } from './TaskCard'

export interface BoardColumnProps {
  columnId: TaskStatus
  title: string
  tasks: KanbanTask[]
  draggingTaskId: string | null
  isDropTarget: boolean
  onDragStart: (taskId: string) => void
  onDragEnd: () => void
  onDragOver: (columnId: TaskStatus) => void
  onDragLeave: () => void
  onDrop: (columnId: TaskStatus) => void
}

export function BoardColumn({
  columnId,
  title,
  tasks,
  draggingTaskId,
  isDropTarget,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: BoardColumnProps) {
  const handleDragOver = (event: DragEvent<HTMLElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    onDragOver(columnId)
  }

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault()
    onDrop(columnId)
  }

  return (
    <section
      aria-labelledby={`column-${columnId}-heading`}
      data-testid={`kanban-column-${columnId}`}
      onDragOver={handleDragOver}
      onDragLeave={onDragLeave}
      onDrop={handleDrop}
      className={`flex min-h-[320px] w-full min-w-[280px] flex-col rounded-xl border bg-gray-50/80 transition-colors dark:bg-gray-900/50 sm:min-w-[300px] lg:min-w-0 lg:flex-1 ${
        isDropTarget
          ? 'border-indigo-400 bg-indigo-50/50 ring-2 ring-indigo-300 dark:border-indigo-500 dark:bg-indigo-950/30 dark:ring-indigo-700'
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <h2
          id={`column-${columnId}-heading`}
          className="text-sm font-semibold text-gray-900 dark:text-white"
        >
          {title}
        </h2>
        <span
          aria-label={`${tasks.length} tasks`}
          data-testid={`kanban-column-count-${columnId}`}
          className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300"
        >
          {tasks.length}
        </span>
      </header>

      <div
        role="list"
        aria-label={`${title} tasks`}
        className="flex flex-1 flex-col gap-3 overflow-y-auto p-3"
      >
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div key={task.id} role="listitem">
              <TaskCard
                task={task}
                isDragging={draggingTaskId === task.id}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
              />
            </div>
          ))
        ) : (
          <div
            data-testid={`kanban-empty-${columnId}`}
            className="flex flex-1 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 px-4 py-10 text-center dark:border-gray-700"
          >
            <Inbox
              aria-hidden="true"
              className="mb-2 h-8 w-8 text-gray-300 dark:text-gray-600"
            />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              No tasks here
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              {isDropTarget
                ? 'Drop a task to move it here'
                : 'Tasks will appear when added or moved'}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
