export type TeamMemberStatus = 'online' | 'away' | 'offline'

export interface TeamMember {
  id: string
  name: string
  role: string
  avatarUrl: string
  status: TeamMemberStatus
  tasksAssigned: number
}

export interface Project {
  id: string
  name: string
  description: string
  color: string
  dueDate: string
  taskIds: string[]
}

export type ActivityType =
  | 'task_created'
  | 'task_completed'
  | 'task_started'
  | 'task_deleted'
  | 'comment'
  | 'member_joined'

export interface ActivityItem {
  id: string
  type: ActivityType
  message: string
  actorName: string
  actorAvatar: string
  timestamp: string
  projectName?: string
}

export const sampleTeamMembers: TeamMember[] = [
  {
    id: 'member-jordan',
    name: 'Jordan Lee',
    role: 'Product Lead',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Jordan',
    status: 'online',
    tasksAssigned: 2,
  },
  {
    id: 'member-maya',
    name: 'Maya Chen',
    role: 'UX Designer',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Maya',
    status: 'online',
    tasksAssigned: 1,
  },
  {
    id: 'member-sam',
    name: 'Sam Ortiz',
    role: 'Backend Engineer',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Sam',
    status: 'away',
    tasksAssigned: 1,
  },
  {
    id: 'member-alex',
    name: 'Alex Rivera',
    role: 'Frontend Engineer',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Alex',
    status: 'online',
    tasksAssigned: 1,
  },
  {
    id: 'member-priya',
    name: 'Priya Nair',
    role: 'Technical Writer',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Priya',
    status: 'offline',
    tasksAssigned: 1,
  },
]

export const sampleProjects: Project[] = [
  {
    id: 'project-onboarding',
    name: 'User Onboarding',
    description: 'Redesign and implement the new user onboarding experience.',
    color: 'indigo',
    dueDate: '2026-06-20',
    taskIds: ['task-1', 'task-3'],
  },
  {
    id: 'project-platform',
    name: 'Platform API',
    description: 'Authentication, task CRUD, and real-time sync endpoints.',
    color: 'blue',
    dueDate: '2026-06-25',
    taskIds: ['task-2', 'task-4'],
  },
  {
    id: 'project-docs',
    name: 'Documentation',
    description: 'API reference, guides, and developer onboarding docs.',
    color: 'emerald',
    dueDate: '2026-06-15',
    taskIds: ['task-5'],
  },
  {
    id: 'project-mobile',
    name: 'Mobile Experience',
    description: 'Responsive layouts, PWA support, and mobile performance.',
    color: 'amber',
    dueDate: '2026-06-18',
    taskIds: ['task-6'],
  },
]

export const sampleActivities: ActivityItem[] = [
  {
    id: 'activity-1',
    type: 'task_completed',
    message: 'completed "Update documentation"',
    actorName: 'Priya Nair',
    actorAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Priya',
    timestamp: '2026-06-08T14:30:00',
    projectName: 'Documentation',
  },
  {
    id: 'activity-2',
    type: 'task_started',
    message: 'started "Design onboarding flow"',
    actorName: 'Maya Chen',
    actorAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Maya',
    timestamp: '2026-06-08T11:15:00',
    projectName: 'User Onboarding',
  },
  {
    id: 'activity-3',
    type: 'comment',
    message: 'left a comment on PR #142',
    actorName: 'Alex Rivera',
    actorAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Alex',
    timestamp: '2026-06-08T09:45:00',
    projectName: 'Platform API',
  },
  {
    id: 'activity-4',
    type: 'task_created',
    message: 'created "Implement auth API endpoints"',
    actorName: 'Sam Ortiz',
    actorAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Sam',
    timestamp: '2026-06-07T16:20:00',
    projectName: 'Platform API',
  },
  {
    id: 'activity-5',
    type: 'member_joined',
    message: 'joined the team',
    actorName: 'Jordan Lee',
    actorAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Jordan',
    timestamp: '2026-06-07T10:00:00',
  },
]

export const PROJECT_COLORS: Record<string, { bar: string; badge: string }> = {
  indigo: {
    bar: 'bg-indigo-500',
    badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  },
  blue: {
    bar: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  emerald: {
    bar: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  amber: {
    bar: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
}

export const STATUS_COLORS: Record<TeamMemberStatus, string> = {
  online: 'bg-emerald-500',
  away: 'bg-amber-400',
  offline: 'bg-gray-400',
}
