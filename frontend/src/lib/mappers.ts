import type { Task, TaskStatus } from '@/data/sampleTasks'
import type { Project } from '@/data/teamDashboard'
import type { KanbanTask } from '@/types/kanban'

export interface ApiUser {
  id: number
  name: string
  email: string
  role?: string
}

export interface ApiProject {
  id: number
  name: string
  description?: string | null
  task_count?: number
  member_count?: number
}

export interface ApiTask {
  id: number
  title: string
  description?: string | null
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  due_date?: string | null
  project_id: number
  assignee_id?: number | null
  assignee?: ApiUser | null
  creator?: ApiUser | null
}

export function toFrontendStatus(status: ApiTask['status']): TaskStatus {
  return status === 'in_progress' ? 'in-progress' : status
}

export function toApiStatus(status: TaskStatus): ApiTask['status'] {
  return status === 'in-progress' ? 'in_progress' : status
}

export function avatarUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}`
}

export function mapApiTask(task: ApiTask): Task {
  const assigneeName = task.assignee?.name ?? 'Unassigned'
  return {
    id: String(task.id),
    title: task.title,
    description: task.description ?? '',
    status: toFrontendStatus(task.status),
    priority: task.priority,
    dueDate: task.due_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    assignee: assigneeName,
    assigneeAvatar: avatarUrl(assigneeName),
    tags: [],
    projectId: String(task.project_id),
  }
}

export function mapApiProject(project: ApiProject): Project {
  return {
    id: String(project.id),
    name: project.name,
    description: project.description ?? '',
    color: '#6366f1',
    dueDate: new Date().toISOString().slice(0, 10),
    taskIds: [],
  }
}

export function taskToKanban(task: Task): KanbanTask {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    assignee: task.assignee,
    assigneeAvatar: task.assigneeAvatar,
    dueDate: task.dueDate,
    priority: task.priority,
    status: task.status,
  }
}

export function buildTaskCreatePayload(
  task: Omit<Task, 'id' | 'assignee' | 'assigneeAvatar'>,
  projectId: number,
  assigneeId?: number,
) {
  return {
    title: task.title,
    description: task.description,
    status: toApiStatus(task.status),
    priority: task.priority,
    due_date: task.dueDate ? `${task.dueDate}T12:00:00` : null,
    project_id: projectId,
    assignee_id: assigneeId ?? null,
  }
}
