import type { KanbanTask } from '@/types/kanban'
import {
  createKanbanTask,
  filterKanbanTasks,
  getUniqueAssignees,
  moveTaskToStatus,
} from '@/lib/kanbanUtils'

const tasks: KanbanTask[] = [
  {
    id: '1',
    title: 'Design review',
    description: '',
    assignee: 'Alex',
    assigneeAvatar: '',
    dueDate: '2026-06-01',
    priority: 'high',
    status: 'todo',
  },
  {
    id: '2',
    title: 'Write tests',
    description: '',
    assignee: 'Sam',
    assigneeAvatar: '',
    dueDate: '2026-06-02',
    priority: 'medium',
    status: 'in-progress',
  },
]

describe('filterKanbanTasks', () => {
  it('filters by search query', () => {
    const result = filterKanbanTasks(tasks, {
      search: 'design',
      priority: 'all',
      assignee: 'all',
    })
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Design review')
  })

  it('filters by priority', () => {
    const result = filterKanbanTasks(tasks, {
      search: '',
      priority: 'high',
      assignee: 'all',
    })
    expect(result).toHaveLength(1)
  })
})

describe('getUniqueAssignees', () => {
  it('returns sorted unique assignees', () => {
    expect(getUniqueAssignees(tasks)).toEqual(['Alex', 'Sam'])
  })
})

describe('createKanbanTask', () => {
  it('assigns id and avatar', () => {
    const task = createKanbanTask(
      {
        title: 'New',
        description: 'd',
        assignee: 'Alex',
        dueDate: '2026-06-03',
        priority: 'low',
        status: 'todo',
      },
      'alex',
    )
    expect(task.id).toMatch(/^kanban-/)
    expect(task.assigneeAvatar).toContain('alex')
  })
})

describe('moveTaskToStatus', () => {
  it('updates matching task status', () => {
    const updated = moveTaskToStatus(tasks, '1', 'done')
    expect(updated.find((t) => t.id === '1')?.status).toBe('done')
    expect(updated.find((t) => t.id === '2')?.status).toBe('in-progress')
  })
})
