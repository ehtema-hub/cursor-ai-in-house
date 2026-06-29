import {
  avatarUrl,
  buildTaskCreatePayload,
  mapApiProject,
  mapApiTask,
  taskToKanban,
  toApiStatus,
  toFrontendStatus,
} from '@/lib/mappers'

describe('mappers', () => {
  it('maps API status values', () => {
    expect(toFrontendStatus('in_progress')).toBe('in-progress')
    expect(toFrontendStatus('todo')).toBe('todo')
    expect(toApiStatus('in-progress')).toBe('in_progress')
    expect(toApiStatus('done')).toBe('done')
  })

  it('maps API tasks to frontend tasks', () => {
    const task = mapApiTask({
      id: 42,
      title: 'Ship feature',
      description: 'Details',
      status: 'in_progress',
      priority: 'high',
      due_date: '2026-06-01T00:00:00',
      project_id: 7,
      assignee: { id: 1, name: 'Alex', email: 'alex@example.com' },
    })

    expect(task.id).toBe('42')
    expect(task.status).toBe('in-progress')
    expect(task.assignee).toBe('Alex')
    expect(task.projectId).toBe('7')
  })

  it('maps API projects and kanban tasks', () => {
    const project = mapApiProject({
      id: 3,
      name: 'Workspace',
      description: 'Main',
    })
    expect(project.id).toBe('3')
    expect(project.name).toBe('Workspace')

    const kanban = taskToKanban(mapApiTask({
      id: 1,
      title: 'Task',
      status: 'todo',
      priority: 'low',
      project_id: 3,
    }))
    expect(kanban.title).toBe('Task')
  })

  it('builds create payloads and avatar URLs', () => {
    const payload = buildTaskCreatePayload(
      {
        title: 'New',
        description: 'Desc',
        status: 'todo',
        priority: 'medium',
        dueDate: '2026-06-15',
        tags: [],
        projectId: '1',
      },
      1,
      2,
    )

    expect(payload.project_id).toBe(1)
    expect(payload.assignee_id).toBe(2)
    expect(payload.status).toBe('todo')
    expect(avatarUrl('Alex')).toContain(encodeURIComponent('Alex'))
  })
})
