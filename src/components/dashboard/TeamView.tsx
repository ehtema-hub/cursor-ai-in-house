import { TeamMemberAvatars } from './TeamMemberAvatars'
import { ProjectOverview } from './ProjectOverview'
import { useTaskDashboard } from '@/context/TaskDashboardContext'
import { STATUS_COLORS } from '@/data/teamDashboard'

export function TeamView() {
  const { teamMembers } = useTaskDashboard()

  return (
    <div className="space-y-6" data-testid="team-view">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Team Members
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {teamMembers.length} collaborators across all projects.
        </p>
      </div>

      <TeamMemberAvatars />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teamMembers.map((member) => (
          <article
            key={member.id}
            data-testid={`team-profile-${member.id}`}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={member.avatarUrl}
                  alt=""
                  aria-hidden="true"
                  className="h-14 w-14 rounded-full object-cover"
                  width={56}
                  height={56}
                />
                <span
                  aria-hidden="true"
                  className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-gray-800 ${STATUS_COLORS[member.status]}`}
                />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {member.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {member.role}
                </p>
                <p className="mt-1 text-xs capitalize text-gray-400 dark:text-gray-500">
                  {member.status}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              {member.tasksAssigned} active task
              {member.tasksAssigned !== 1 ? 's' : ''}
            </p>
          </article>
        ))}
      </div>

      <ProjectOverview />
    </div>
  )
}
