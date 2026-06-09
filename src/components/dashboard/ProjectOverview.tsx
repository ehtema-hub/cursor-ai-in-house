import { Calendar, FolderKanban } from 'lucide-react'
import { useTaskDashboard } from '@/context/TaskDashboardContext'
import { PROJECT_COLORS } from '@/data/teamDashboard'

function formatDueDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function ProjectOverview() {
  const { projects, getProjectProgress } = useTaskDashboard()

  return (
    <section
      aria-labelledby="projects-heading"
      data-testid="project-overview"
      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="mb-4 flex items-center gap-2">
        <FolderKanban
          aria-hidden="true"
          className="h-5 w-5 text-indigo-600 dark:text-indigo-400"
        />
        <h2
          id="projects-heading"
          className="text-base font-semibold text-gray-900 dark:text-white"
        >
          Project Overview
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {projects.map((project) => {
          const progress = getProjectProgress(project.id)
          const colors = PROJECT_COLORS[project.color] ?? PROJECT_COLORS.indigo

          return (
            <article
              key={project.id}
              data-testid={`project-card-${project.id}`}
              aria-labelledby={`project-${project.id}-name`}
              className="rounded-lg border border-gray-100 p-4 transition-shadow hover:shadow-sm dark:border-gray-700"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3
                  id={`project-${project.id}-name`}
                  className="text-sm font-semibold text-gray-900 dark:text-white"
                >
                  {project.name}
                </h3>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${colors.badge}`}
                >
                  {progress.percent}%
                </span>
              </div>

              <p className="mb-3 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                {project.description}
              </p>

              <div
                role="progressbar"
                aria-valuenow={progress.percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${project.name} progress`}
                className="mb-2 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700"
              >
                <div
                  className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
                  style={{ width: `${progress.percent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>
                  {progress.done}/{progress.total} tasks done
                </span>
                <time
                  dateTime={project.dueDate}
                  className="flex items-center gap-1"
                >
                  <Calendar aria-hidden="true" className="h-3 w-3" />
                  {formatDueDate(project.dueDate)}
                </time>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
