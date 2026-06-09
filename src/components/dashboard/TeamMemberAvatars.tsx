import { Users } from 'lucide-react'
import { useTaskDashboard } from '@/context/TaskDashboardContext'
import { STATUS_COLORS } from '@/data/teamDashboard'

interface TeamMemberAvatarsProps {
  compact?: boolean
}

export function TeamMemberAvatars({ compact = false }: TeamMemberAvatarsProps) {
  const { teamMembers } = useTaskDashboard()
  const onlineCount = teamMembers.filter((m) => m.status === 'online').length

  return (
    <section
      aria-labelledby="team-heading"
      data-testid="team-members"
      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users
            aria-hidden="true"
            className="h-5 w-5 text-indigo-600 dark:text-indigo-400"
          />
          <h2
            id="team-heading"
            className="text-base font-semibold text-gray-900 dark:text-white"
          >
            Team
          </h2>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {onlineCount} online
        </span>
      </div>

      <div
        className="mb-4 flex -space-x-2"
        aria-label={`${teamMembers.length} team members`}
        data-testid="team-avatar-stack"
      >
        {teamMembers.slice(0, 5).map((member) => (
          <div key={member.id} className="relative" title={member.name}>
            <img
              src={member.avatarUrl}
              alt={member.name}
              className="h-10 w-10 rounded-full border-2 border-white object-cover dark:border-gray-800"
              width={40}
              height={40}
            />
            <span
              aria-hidden="true"
              className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-gray-800 ${STATUS_COLORS[member.status]}`}
            />
          </div>
        ))}
        {teamMembers.length > 5 && (
          <div
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-xs font-medium text-gray-600 dark:border-gray-800 dark:bg-gray-700 dark:text-gray-300"
          >
            +{teamMembers.length - 5}
          </div>
        )}
      </div>

      {!compact && (
        <ul role="list" className="space-y-3">
          {teamMembers.map((member) => (
            <li
              key={member.id}
              data-testid={`team-member-${member.id}`}
              className="flex items-center gap-3"
            >
              <div className="relative shrink-0">
                <img
                  src={member.avatarUrl}
                  alt=""
                  aria-hidden="true"
                  className="h-9 w-9 rounded-full object-cover"
                  width={36}
                  height={36}
                />
                <span
                  aria-hidden="true"
                  className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-gray-800 ${STATUS_COLORS[member.status]}`}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {member.name}
                </p>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                  {member.role}
                </p>
              </div>
              <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
                {member.tasksAssigned} tasks
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
