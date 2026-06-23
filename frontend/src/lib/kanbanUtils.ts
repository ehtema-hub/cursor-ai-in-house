import type { KanbanTask, KanbanFilters } from '@/types/kanban'
import { sampleTasks } from '@/data/sampleTasks'

export const KANBAN_STORAGE_KEY = 'taskflow_kanban_tasks'

export function getInitialKanbanTasks(): KanbanTask[] {
  try {
    const stored = localStorage.getItem(KANBAN_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored) as KanbanTask[]
    }
  } catch {
    // fall through to mock data
  }

  return sampleTasks.map(({ id, title, description, assignee, assigneeAvatar, dueDate, priority, status }) => ({
    id,
    title,
    description,
    assignee,
    assigneeAvatar,
    dueDate,
    priority,
    status,
  }))
}

export function persistKanbanTasks(tasks: KanbanTask[]) {
  localStorage.setItem(KANBAN_STORAGE_KEY, JSON.stringify(tasks))
}

export function filterKanbanTasks(
  tasks: KanbanTask[],
  filters: KanbanFilters,
): KanbanTask[] {
  const query = filters.search.trim().toLowerCase()

  return tasks.filter((task) => {
    if (query && !task.title.toLowerCase().includes(query)) return false
    if (filters.priority !== 'all' && task.priority !== filters.priority) return false
    if (filters.assignee !== 'all' && task.assignee !== filters.assignee) return false
    return true
  })
}

export function getUniqueAssignees(tasks: KanbanTask[]): string[] {
  return [...new Set(tasks.map((t) => t.assignee))].sort()
}

export function createKanbanTask(
  data: Omit<KanbanTask, 'id' | 'assigneeAvatar'>,
  avatarSeed: string,
): KanbanTask {
  return {
    ...data,
    id: `kanban-${Date.now()}`,
    assigneeAvatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(avatarSeed)}`,
  }
}

export function moveTaskToStatus(
  tasks: KanbanTask[],
  taskId: string,
  status: KanbanTask['status'],
): KanbanTask[] {
  return tasks.map((task) =>
    task.id === taskId ? { ...task, status } : task,
  )
}
