import { apiFetch } from '@/lib/api'
import {
  buildTaskCreatePayload,
  mapApiProject,
  mapApiTask,
  type ApiProject,
  type ApiTask,
} from '@/lib/mappers'
import type { Task, TaskStatus } from '@/data/sampleTasks'
import type { Project } from '@/data/teamDashboard'
import { toApiStatus } from '@/lib/mappers'

export async function fetchProjects(): Promise<Project[]> {
  const data = await apiFetch<ApiProject[]>('/api/projects/')
  return data.map(mapApiProject)
}

export async function ensureDefaultProject(): Promise<Project> {
  const projects = await fetchProjects()
  if (projects.length > 0) return projects[0]

  const created = await apiFetch<ApiProject>('/api/projects/', {
    method: 'POST',
    body: JSON.stringify({
      name: 'My Workspace',
      description: 'Default project',
    }),
  })
  return mapApiProject(created)
}

export async function fetchTasks(): Promise<Task[]> {
  const data = await apiFetch<ApiTask[]>('/api/tasks/')
  return data.map(mapApiTask)
}

export async function createTaskApi(
  task: Omit<Task, 'id' | 'assignee' | 'assigneeAvatar'>,
  projectId: number,
  assigneeId?: number,
): Promise<Task> {
  const created = await apiFetch<ApiTask>('/api/tasks/', {
    method: 'POST',
    body: JSON.stringify(buildTaskCreatePayload(task, projectId, assigneeId)),
  })
  return mapApiTask(created)
}

export async function updateTaskStatusApi(
  taskId: string,
  status: TaskStatus,
): Promise<Task> {
  const updated = await apiFetch<ApiTask>(`/api/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify({ status: toApiStatus(status) }),
  })
  return mapApiTask(updated)
}

export async function deleteTaskApi(taskId: string): Promise<void> {
  await apiFetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
}
