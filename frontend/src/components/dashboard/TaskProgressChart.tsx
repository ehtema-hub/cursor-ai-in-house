import { PieChart } from 'lucide-react'
import { useTaskDashboard } from '@/context/TaskDashboardContext'

const SEGMENTS = [
  {
    key: 'todo' as const,
    label: 'To Do',
    color: 'bg-gray-400 dark:bg-gray-500',
    textColor: 'text-gray-600 dark:text-gray-400',
  },
  {
    key: 'inProgress' as const,
    label: 'In Progress',
    color: 'bg-blue-500',
    textColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    key: 'done' as const,
    label: 'Done',
    color: 'bg-emerald-500',
    textColor: 'text-emerald-600 dark:text-emerald-400',
  },
]

export function TaskProgressChart() {
  const { progressBreakdown } = useTaskDashboard()
  const { todo, inProgress, done, total } = progressBreakdown

  const segments = [
    { ...SEGMENTS[0], count: todo },
    { ...SEGMENTS[1], count: inProgress },
    { ...SEGMENTS[2], count: done },
  ]

  return (
    <section
      aria-labelledby="progress-chart-heading"
      data-testid="task-progress-chart"
      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="mb-4 flex items-center gap-2">
        <PieChart
          aria-hidden="true"
          className="h-5 w-5 text-indigo-600 dark:text-indigo-400"
        />
        <h2
          id="progress-chart-heading"
          className="text-base font-semibold text-gray-900 dark:text-white"
        >
          Task Progress
        </h2>
      </div>

      {total === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          No tasks to display.
        </p>
      ) : (
        <>
          <div
            role="img"
            aria-label={`Task breakdown: ${todo} to do, ${inProgress} in progress, ${done} done`}
            className="mb-4 flex h-4 overflow-hidden rounded-full"
          >
            {segments.map((segment) => {
              const width = total > 0 ? (segment.count / total) * 100 : 0
              if (width === 0) return null
              return (
                <div
                  key={segment.key}
                  className={`${segment.color} transition-all duration-500`}
                  style={{ width: `${width}%` }}
                  title={`${segment.label}: ${segment.count}`}
                />
              )
            })}
          </div>

          <ul role="list" className="space-y-3">
            {segments.map((segment) => {
              const percent = total > 0 ? Math.round((segment.count / total) * 100) : 0
              return (
                <li
                  key={segment.key}
                  data-testid={`progress-segment-${segment.key}`}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className={`h-3 w-3 rounded-full ${segment.color}`}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {segment.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${segment.textColor}`}>
                      {segment.count}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      ({percent}%)
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </section>
  )
}
