import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  sampleActivities,
  sampleTeamMembers,
  type ActivityItem,
  type Project,
  type TeamMember,
} from '@/data/teamDashboard'
import {
  sampleTasks,
  type DashboardStat,
  type Task,
  type TaskStatus,
} from '@/data/sampleTasks'
import {
  createTaskApi,
  deleteTaskApi,
  ensureDefaultProject,
  fetchTasks,
  updateTaskStatusApi,
} from '@/lib/tasksApi'
import { useAuth } from '@/context/AuthContext'

interface TaskDashboardContextValue {
  tasks: Task[]
  projects: Project[]
  teamMembers: TeamMember[]
  activities: ActivityItem[]
  stats: DashboardStat[]
  progressBreakdown: { todo: number; inProgress: number; done: number; total: number }
  isLoading: boolean
  loadError: string | null
  createTask: (
    taskData: Omit<Task, 'id' | 'assignee' | 'assigneeAvatar'>,
    actor: { name: string; avatarUrl: string },
  ) => Promise<void>
  updateTaskStatus: (
    id: string,
    status: TaskStatus,
    actor: { name: string; avatarUrl: string },
  ) => Promise<void>
  deleteTask: (id: string, actor: { name: string; avatarUrl: string }) => Promise<void>
  getProjectProgress: (projectId: string) => {
    total: number
    done: number
    inProgress: number
    todo: number
    percent: number
  }
}

const TaskDashboardContext = createContext<TaskDashboardContextValue | null>(null)

function createActivity(
  type: ActivityItem['type'],
  message: string,
  actor: { name: string; avatarUrl: string },
  projectName?: string,
): ActivityItem {
  return {
    id: `activity-${Date.now()}`,
    type,
    message,
    actorName: actor.name,
    actorAvatar: actor.avatarUrl,
    timestamp: new Date().toISOString(),
    projectName,
  }
}

function computeStats(tasks: Task[]): DashboardStat[] {
  const total = tasks.length
  const inProgress = tasks.filter((t) => t.status === 'in-progress').length
  const completed = tasks.filter((t) => t.status === 'done').length
  const overdue = tasks.filter(
    (t) => t.status !== 'done' && new Date(t.dueDate) < new Date(),
  ).length

  return [
    { id: 'total', label: 'Total Tasks', value: total, change: 12, trend: 'up' },
    { id: 'progress', label: 'In Progress', value: inProgress, change: 3, trend: 'up' },
    { id: 'completed', label: 'Completed', value: completed, change: 8, trend: 'up' },
    {
      id: 'overdue',
      label: 'Overdue',
      value: overdue,
      change: overdue > 0 ? -1 : 0,
      trend: overdue > 0 ? 'down' : 'neutral',
    },
  ]
}

export function TaskDashboardProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [teamMembers] = useState<TeamMember[]>(sampleTeamMembers)
  const [activities, setActivities] = useState<ActivityItem[]>(sampleActivities)
  const [defaultProjectId, setDefaultProjectId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setTasks([])
      setProjects([])
      setDefaultProjectId(null)
      setIsLoading(false)
      return
    }

    let active = true
    setIsLoading(true)
    setLoadError(null)

    ;(async () => {
      try {
        const project = await ensureDefaultProject()
        const loadedTasks = await fetchTasks()
        if (!active) return
        setProjects([project])
        setDefaultProjectId(Number(project.id))
        setTasks(loadedTasks)
      } catch (error) {
        if (!active) return
        setLoadError(error instanceof Error ? error.message : 'Failed to load tasks')
        setTasks(sampleTasks)
        setProjects([])
      } finally {
        if (active) setIsLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [user])

  const prependActivity = useCallback((activity: ActivityItem) => {
    setActivities((prev) => [activity, ...prev].slice(0, 20))
  }, [])

  const getProjectName = useCallback(
    (projectId?: string) => projects.find((p) => p.id === projectId)?.name,
    [projects],
  )

  const getProjectProgress = useCallback(
    (projectId: string) => {
      const projectTasks = tasks.filter((t) => t.projectId === projectId)
      const total = projectTasks.length
      const done = projectTasks.filter((t) => t.status === 'done').length
      const inProgress = projectTasks.filter((t) => t.status === 'in-progress').length
      const todo = projectTasks.filter((t) => t.status === 'todo').length
      const percent = total > 0 ? Math.round((done / total) * 100) : 0

      return { total, done, inProgress, todo, percent }
    },
    [tasks],
  )

  const createTask = useCallback(
    async (
      taskData: Omit<Task, 'id' | 'assignee' | 'assigneeAvatar'>,
      actor: { name: string; avatarUrl: string },
    ) => {
      if (!defaultProjectId) return

      const payload = {
        ...taskData,
        projectId: taskData.projectId ?? String(defaultProjectId),
      }

      const created = await createTaskApi(
        payload,
        Number(payload.projectId),
        user ? Number(user.id) : undefined,
      )
      setTasks((prev) => [created, ...prev])
      prependActivity(
        createActivity(
          'task_created',
          `created "${created.title}"`,
          actor,
          getProjectName(created.projectId),
        ),
      )
    },
    [defaultProjectId, getProjectName, prependActivity, user],
  )

  const updateTaskStatus = useCallback(
    async (id: string, status: TaskStatus, actor: { name: string; avatarUrl: string }) => {
      const task = tasks.find((t) => t.id === id)
      const updated = await updateTaskStatusApi(id, status)
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)))

      if (!task) return

      const activityType =
        status === 'done' ? 'task_completed' : status === 'in-progress' ? 'task_started' : 'task_created'
      const verb =
        status === 'done' ? 'completed' : status === 'in-progress' ? 'started' : 'updated'

      prependActivity(
        createActivity(
          activityType,
          `${verb} "${task.title}"`,
          actor,
          getProjectName(task.projectId),
        ),
      )
    },
    [getProjectName, prependActivity, tasks],
  )

  const deleteTask = useCallback(
    async (id: string, actor: { name: string; avatarUrl: string }) => {
      const task = tasks.find((t) => t.id === id)
      await deleteTaskApi(id)
      setTasks((prev) => prev.filter((t) => t.id !== id))
      if (task) {
        prependActivity(
          createActivity(
            'task_deleted',
            `deleted "${task.title}"`,
            actor,
            getProjectName(task.projectId),
          ),
        )
      }
    },
    [getProjectName, prependActivity, tasks],
  )

  const stats = useMemo(() => computeStats(tasks), [tasks])

  const progressBreakdown = useMemo(() => {
    const todo = tasks.filter((t) => t.status === 'todo').length
    const inProgress = tasks.filter((t) => t.status === 'in-progress').length
    const done = tasks.filter((t) => t.status === 'done').length
    return { todo, inProgress, done, total: tasks.length }
  }, [tasks])

  const value = useMemo(
    () => ({
      tasks,
      projects,
      teamMembers,
      activities,
      stats,
      progressBreakdown,
      isLoading,
      loadError,
      createTask,
      updateTaskStatus,
      deleteTask,
      getProjectProgress,
    }),
    [
      tasks,
      projects,
      teamMembers,
      activities,
      stats,
      progressBreakdown,
      isLoading,
      loadError,
      createTask,
      updateTaskStatus,
      deleteTask,
      getProjectProgress,
    ],
  )

  return (
    <TaskDashboardContext.Provider value={value}>
      {children}
    </TaskDashboardContext.Provider>
  )
}

export function useTaskDashboard() {
  const context = useContext(TaskDashboardContext)
  if (!context) {
    throw new Error('useTaskDashboard must be used within TaskDashboardProvider')
  }
  return context
}
