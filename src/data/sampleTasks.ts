export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskStatus = 'todo' | 'in-progress' | 'done'

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  dueDate: string
  assignee: string
  assigneeAvatar: string
  tags: string[]
  projectId?: string
}

export interface DashboardStat {
  id: string
  label: string
  value: number
  change: number
  trend: 'up' | 'down' | 'neutral'
}

export const sampleTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Design onboarding flow',
    description:
      'Create wireframes and high-fidelity mockups for the new user onboarding experience.',
    status: 'in-progress',
    priority: 'high',
    dueDate: '2026-06-10',
    assignee: 'Maya Chen',
    assigneeAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Maya',
    tags: ['Design', 'UX'],
    projectId: 'project-onboarding',
  },
  {
    id: 'task-2',
    title: 'Implement auth API endpoints',
    description:
      'Build login, logout, and token refresh endpoints with proper validation.',
    status: 'todo',
    priority: 'high',
    dueDate: '2026-06-12',
    assignee: 'Sam Ortiz',
    assigneeAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Sam',
    tags: ['Backend', 'API'],
    projectId: 'project-platform',
  },
  {
    id: 'task-3',
    title: 'Write unit tests for task service',
    description:
      'Cover CRUD operations and edge cases for the task management service layer.',
    status: 'todo',
    priority: 'medium',
    dueDate: '2026-06-14',
    assignee: 'Jordan Lee',
    assigneeAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Jordan',
    tags: ['Testing'],
    projectId: 'project-onboarding',
  },
  {
    id: 'task-4',
    title: 'Review pull request #142',
    description:
      'Code review for the dashboard layout refactor and responsive sidebar changes.',
    status: 'in-progress',
    priority: 'medium',
    dueDate: '2026-06-08',
    assignee: 'Alex Rivera',
    assigneeAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Alex',
    tags: ['Review'],
    projectId: 'project-platform',
  },
  {
    id: 'task-5',
    title: 'Update documentation',
    description:
      'Refresh README and API docs to reflect the latest task management endpoints.',
    status: 'done',
    priority: 'low',
    dueDate: '2026-06-05',
    assignee: 'Priya Nair',
    assigneeAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Priya',
    tags: ['Docs'],
    projectId: 'project-docs',
  },
  {
    id: 'task-6',
    title: 'Fix mobile sidebar animation',
    description:
      'Resolve jank on iOS Safari when opening and closing the mobile navigation drawer.',
    status: 'done',
    priority: 'medium',
    dueDate: '2026-06-04',
    assignee: 'Jordan Lee',
    assigneeAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Jordan',
    tags: ['Bug', 'Mobile'],
    projectId: 'project-mobile',
  },
]

export const dashboardStats: DashboardStat[] = [
  { id: 'total', label: 'Total Tasks', value: 24, change: 12, trend: 'up' },
  { id: 'progress', label: 'In Progress', value: 8, change: 3, trend: 'up' },
  { id: 'completed', label: 'Completed', value: 14, change: 8, trend: 'up' },
  { id: 'overdue', label: 'Overdue', value: 2, change: -1, trend: 'down' },
]
