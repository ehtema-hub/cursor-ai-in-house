import {
  createTaskApi,
  deleteTaskApi,
  ensureDefaultProject,
  fetchProjects,
  fetchTasks,
  updateTaskStatusApi,
} from '@/lib/tasksApi'

jest.mock('@/lib/api', () => ({
  apiFetch: jest.fn(),
}))

import { apiFetch } from '@/lib/api'

const mockedApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>

describe('tasksApi', () => {
  beforeEach(() => {
    mockedApiFetch.mockReset()
  })

  it('fetches and maps projects', async () => {
    mockedApiFetch.mockResolvedValue([
      { id: 1, name: 'Alpha', description: 'First' },
    ])

    const projects = await fetchProjects()
    expect(projects).toHaveLength(1)
    expect(projects[0].name).toBe('Alpha')
  })

  it('creates a default project when none exist', async () => {
    mockedApiFetch
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({ id: 9, name: 'My Workspace', description: 'Default project' })

    const project = await ensureDefaultProject()
    expect(project.id).toBe('9')
    expect(mockedApiFetch).toHaveBeenCalledTimes(2)
  })

  it('fetches tasks and updates status', async () => {
    mockedApiFetch
      .mockResolvedValueOnce([
        {
          id: 5,
          title: 'Task',
          status: 'todo',
          priority: 'medium',
          project_id: 1,
        },
      ])
      .mockResolvedValueOnce({
        id: 5,
        title: 'Task',
        status: 'in_progress',
        priority: 'medium',
        project_id: 1,
      })

    const tasks = await fetchTasks()
    expect(tasks[0].status).toBe('todo')

    const updated = await updateTaskStatusApi('5', 'in-progress')
    expect(updated.status).toBe('in-progress')
  })

  it('creates and deletes tasks', async () => {
    mockedApiFetch
      .mockResolvedValueOnce({
        id: 11,
        title: 'Created',
        status: 'todo',
        priority: 'low',
        project_id: 2,
      })
      .mockResolvedValueOnce(undefined)

    const created = await createTaskApi(
      {
        title: 'Created',
        description: '',
        status: 'todo',
        priority: 'low',
        dueDate: '2026-06-20',
        tags: [],
        projectId: '2',
      },
      2,
    )
    expect(created.title).toBe('Created')

    await deleteTaskApi('11')
    expect(mockedApiFetch).toHaveBeenLastCalledWith('/api/tasks/11', { method: 'DELETE' })
  })
})
