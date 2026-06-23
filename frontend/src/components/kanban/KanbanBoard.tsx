import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import { BoardColumn } from './BoardColumn'
import { AddTaskModal } from './AddTaskModal'
import {
  KANBAN_COLUMNS,
  type AddTaskFormData,
  type KanbanFilters,
  type KanbanTask,
} from '@/types/kanban'
import type { TaskStatus } from '@/data/sampleTasks'
import {
  createKanbanTask,
  filterKanbanTasks,
  getInitialKanbanTasks,
  getUniqueAssignees,
  moveTaskToStatus,
  persistKanbanTasks,
} from '@/lib/kanbanUtils'
import { sampleTeamMembers } from '@/data/teamDashboard'

const DEFAULT_FILTERS: KanbanFilters = {
  search: '',
  priority: 'all',
  assignee: 'all',
}

export function KanbanBoard() {
  const [tasks, setTasks] = useState<KanbanTask[]>(getInitialKanbanTasks)
  const [filters, setFilters] = useState<KanbanFilters>(DEFAULT_FILTERS)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)
  const [dropTargetColumn, setDropTargetColumn] = useState<TaskStatus | null>(null)

  useEffect(() => {
    persistKanbanTasks(tasks)
  }, [tasks])

  const assignees = useMemo(() => {
    const fromTasks = getUniqueAssignees(tasks)
    const fromTeam = sampleTeamMembers.map((m) => m.name)
    return [...new Set([...fromTasks, ...fromTeam])].sort()
  }, [tasks])

  const filteredTasks = useMemo(
    () => filterKanbanTasks(tasks, filters),
    [tasks, filters],
  )

  const tasksByColumn = useMemo(() => {
    const grouped: Record<TaskStatus, KanbanTask[]> = {
      todo: [],
      'in-progress': [],
      done: [],
    }
    for (const task of filteredTasks) {
      grouped[task.status].push(task)
    }
    return grouped
  }, [filteredTasks])

  const handleAddTask = useCallback(
    (data: AddTaskFormData) => {
      const newTask = createKanbanTask(
        {
          title: data.title,
          description: data.description || undefined,
          assignee: data.assignee,
          dueDate: data.dueDate,
          priority: data.priority,
          status: data.status,
        },
        data.assignee,
      )
      setTasks((prev) => [newTask, ...prev])
    },
    [],
  )

  const handleDrop = useCallback(
    (columnId: TaskStatus) => {
      if (!draggingTaskId) return
      setTasks((prev) => moveTaskToStatus(prev, draggingTaskId, columnId))
      setDraggingTaskId(null)
      setDropTargetColumn(null)
    },
    [draggingTaskId],
  )

  const handleDragEnd = useCallback(() => {
    setDraggingTaskId(null)
    setDropTargetColumn(null)
  }, [])

  const totalVisible = filteredTasks.length
  const totalAll = tasks.length

  return (
    <div
      className="mx-auto max-w-[1600px]"
      data-testid="kanban-board"
    >
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Kanban Board
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {totalVisible === totalAll
              ? `${totalAll} tasks across ${KANBAN_COLUMNS.length} columns`
              : `Showing ${totalVisible} of ${totalAll} tasks`}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          data-testid="kanban-add-task-button"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          Add Task
        </button>
      </header>

      <div
        className="mb-6 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:flex-row sm:flex-wrap sm:items-end"
        role="search"
        aria-label="Filter tasks"
        data-testid="kanban-filters"
      >
        <div className="min-w-0 flex-1 sm:min-w-[200px]">
          <label htmlFor="kanban-search" className="sr-only">
            Search tasks by title
          </label>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            />
            <input
              id="kanban-search"
              type="search"
              data-testid="kanban-search-input"
              placeholder="Search by title…"
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div>
            <label htmlFor="kanban-priority-filter" className="sr-only">
              Filter by priority
            </label>
            <div className="relative">
              <Filter
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              />
              <select
                id="kanban-priority-filter"
                data-testid="kanban-priority-filter"
                value={filters.priority}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    priority: e.target.value as KanbanFilters['priority'],
                  }))
                }
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-8 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white sm:w-40"
              >
                <option value="all">All priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="kanban-assignee-filter" className="sr-only">
              Filter by assignee
            </label>
            <select
              id="kanban-assignee-filter"
              data-testid="kanban-assignee-filter"
              value={filters.assignee}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, assignee: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white sm:w-44"
            >
              <option value="all">All assignees</option>
              {assignees.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {draggingTaskId && (
        <p
          role="status"
          aria-live="polite"
          className="mb-4 rounded-lg bg-indigo-50 px-4 py-2 text-sm text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
        >
          Drag task to a column to change its status. Drop targets are highlighted.
        </p>
      )}

      <div
        className="flex gap-4 overflow-x-auto pb-4 lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0"
        data-testid="kanban-columns"
      >
        {KANBAN_COLUMNS.map((column) => (
          <BoardColumn
            key={column.id}
            columnId={column.id}
            title={column.title}
            tasks={tasksByColumn[column.id]}
            draggingTaskId={draggingTaskId}
            isDropTarget={dropTargetColumn === column.id}
            onDragStart={setDraggingTaskId}
            onDragEnd={handleDragEnd}
            onDragOver={setDropTargetColumn}
            onDragLeave={() => setDropTargetColumn(null)}
            onDrop={handleDrop}
          />
        ))}
      </div>

      <AddTaskModal
        isOpen={isAddModalOpen}
        assignees={assignees}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddTask}
      />
    </div>
  )
}
