import type { TaskPriority, TaskStatus } from '@/data/sampleTasks'

export interface KanbanTask {
  id: string
  title: string
  description?: string
  assignee: string
  assigneeAvatar: string
  dueDate: string
  priority: TaskPriority
  status: TaskStatus
}

export interface KanbanColumnConfig {
  id: TaskStatus
  title: string
}

export interface KanbanFilters {
  search: string
  priority: TaskPriority | 'all'
  assignee: string | 'all'
}

export interface AddTaskFormData {
  title: string
  description: string
  assignee: string
  dueDate: string
  priority: TaskPriority
  status: TaskStatus
}

export const KANBAN_COLUMNS: KanbanColumnConfig[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
]

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  done: 'Done',
}
