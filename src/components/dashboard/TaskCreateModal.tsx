import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import type { Task, TaskPriority } from '@/data/sampleTasks'

interface TaskCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (task: Omit<Task, 'id' | 'assignee' | 'assigneeAvatar'>) => void
  assigneeName: string
}

export function TaskCreateModal({
  isOpen,
  onClose,
  onCreate,
  assigneeName,
}: TaskCreateModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [dueDate, setDueDate] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    if (!title.trim()) {
      setError('Task title is required.')
      return
    }
    if (!dueDate) {
      setError('Due date is required.')
      return
    }

    onCreate({
      title: title.trim(),
      description: description.trim(),
      status: 'todo',
      priority,
      dueDate,
      tags: [],
    })

    setTitle('')
    setDescription('')
    setPriority('medium')
    setDueDate('')
    setError('')
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-task-title"
      data-testid="create-task-modal"
    >
      <div
        className="absolute inset-0 bg-gray-900/50"
        aria-hidden="true"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-6 flex items-center justify-between">
          <h2
            id="create-task-title"
            className="text-lg font-semibold text-gray-900 dark:text-white"
          >
            New Task
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            data-testid="close-create-task"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:hover:bg-gray-800"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" data-testid="create-task-form">
          {error && (
            <p role="alert" data-testid="create-task-error" className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <div>
            <label htmlFor="task-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Title
            </label>
            <input
              id="task-title"
              data-testid="task-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="task-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              id="task-description"
              data-testid="task-description-input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="task-priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Priority
              </label>
              <select
                id="task-priority"
                data-testid="task-priority-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label htmlFor="task-due-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Due Date
              </label>
              <input
                id="task-due-date"
                data-testid="task-due-date-input"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Assigned to: {assigneeName}
          </p>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              data-testid="cancel-create-task"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="submit-create-task"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
