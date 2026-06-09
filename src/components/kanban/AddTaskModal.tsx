import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import type { AddTaskFormData } from '@/types/kanban'
import type { TaskPriority, TaskStatus } from '@/data/sampleTasks'

export interface AddTaskModalProps {
  isOpen: boolean
  assignees: string[]
  onClose: () => void
  onAdd: (data: AddTaskFormData) => void
}

const inputClassName =
  'mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white'

const labelClassName =
  'block text-sm font-medium text-gray-700 dark:text-gray-300'

export function AddTaskModal({
  isOpen,
  assignees,
  onClose,
  onAdd,
}: AddTaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignee, setAssignee] = useState(assignees[0] ?? '')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [status, setStatus] = useState<TaskStatus>('todo')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setAssignee(assignees[0] ?? '')
    setDueDate('')
    setPriority('medium')
    setStatus('todo')
    setError('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    if (!title.trim()) {
      setError('Task title is required.')
      return
    }
    if (!assignee) {
      setError('Please select an assignee.')
      return
    }
    if (!dueDate) {
      setError('Due date is required.')
      return
    }

    onAdd({
      title: title.trim(),
      description: description.trim(),
      assignee,
      dueDate,
      priority,
      status,
    })

    resetForm()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-kanban-task-title"
      data-testid="kanban-add-task-modal"
    >
      <div
        className="absolute inset-0 bg-gray-900/50"
        aria-hidden="true"
        onClick={handleClose}
      />

      <div className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-6 flex items-center justify-between">
          <h2
            id="add-kanban-task-title"
            className="text-lg font-semibold text-gray-900 dark:text-white"
          >
            Add Task
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close dialog"
            data-testid="kanban-close-add-task"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:hover:bg-gray-800"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" data-testid="kanban-add-task-form">
          {error && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <div>
            <label htmlFor="kanban-task-title" className={labelClassName}>
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="kanban-task-title"
              data-testid="kanban-task-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClassName}
              required
            />
          </div>

          <div>
            <label htmlFor="kanban-task-description" className={labelClassName}>
              Description
            </label>
            <textarea
              id="kanban-task-description"
              data-testid="kanban-task-description-input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClassName}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="kanban-task-assignee" className={labelClassName}>
                Assignee <span className="text-red-500">*</span>
              </label>
              <select
                id="kanban-task-assignee"
                data-testid="kanban-task-assignee-select"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className={inputClassName}
                required
              >
                {assignees.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="kanban-task-due-date" className={labelClassName}>
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                id="kanban-task-due-date"
                data-testid="kanban-task-due-date-input"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={inputClassName}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="kanban-task-priority" className={labelClassName}>
                Priority
              </label>
              <select
                id="kanban-task-priority"
                data-testid="kanban-task-priority-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className={inputClassName}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label htmlFor="kanban-task-status" className={labelClassName}>
                Status
              </label>
              <select
                id="kanban-task-status"
                data-testid="kanban-task-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className={inputClassName}
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              data-testid="kanban-cancel-add-task"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="kanban-submit-add-task"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
