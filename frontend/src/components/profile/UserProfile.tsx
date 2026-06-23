import { useId } from 'react'
import { Button } from '@/components/ui/Button'

export interface UserProfileStats {
  followers: number
  following: number
  posts: number
}

export interface UserProfileProps {
  avatarUrl: string
  name: string
  username?: string
  bio?: string
  stats: UserProfileStats
  isOwnProfile?: boolean
  isFollowing?: boolean
  onFollow?: () => void
  onUnfollow?: () => void
  onMessage?: () => void
  onEditProfile?: () => void
  className?: string
}

function formatCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  }
  return count.toLocaleString()
}

interface StatItemProps {
  label: string
  value: number
  id: string
}

function StatItem({ label, value, id }: StatItemProps) {
  return (
    <div className="flex flex-col items-center sm:items-start">
      <dt id={id} className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
        <span aria-hidden="true">{formatCount(value)}</span>
        <span className="sr-only">{value.toLocaleString()}</span>
      </dt>
      <dd className="text-sm text-gray-500 dark:text-gray-400">{label}</dd>
    </div>
  )
}

export function UserProfile({
  avatarUrl,
  name,
  username,
  bio,
  stats,
  isOwnProfile = false,
  isFollowing = false,
  onFollow,
  onUnfollow,
  onMessage,
  onEditProfile,
  className = '',
}: UserProfileProps) {
  const profileId = useId()
  const statsId = `${profileId}-stats`
  const bioId = `${profileId}-bio`

  const handleFollowClick = () => {
    if (isFollowing) {
      onUnfollow?.()
    } else {
      onFollow?.()
    }
  }

  return (
    <section
      aria-labelledby={`${profileId}-name`}
      className={`rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-8 ${className}`}
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
        <div className="flex shrink-0 justify-center sm:justify-start">
          <img
            src={avatarUrl}
            alt={`${name}'s profile picture`}
            className="h-24 w-24 rounded-full object-cover ring-4 ring-white dark:ring-gray-700 sm:h-32 sm:w-32"
            width={128}
            height={128}
          />
        </div>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <header className="mb-4">
            <h2
              id={`${profileId}-name`}
              className="truncate text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl"
            >
              {name}
            </h2>
            {username && (
              <p className="mt-1 truncate text-gray-500 dark:text-gray-400">@{username}</p>
            )}
          </header>

          {bio && (
            <p
              id={bioId}
              className="mb-5 text-base leading-relaxed text-gray-700 dark:text-gray-300"
            >
              {bio}
            </p>
          )}

          <dl
            id={statsId}
            aria-label="Profile statistics"
            className="mb-6 grid grid-cols-3 gap-4 rounded-xl bg-gray-50 px-4 py-4 dark:bg-gray-900/50 sm:inline-grid sm:gap-8 sm:px-6"
          >
            <StatItem
              id={`${statsId}-posts`}
              label="Posts"
              value={stats.posts}
            />
            <StatItem
              id={`${statsId}-followers`}
              label="Followers"
              value={stats.followers}
            />
            <StatItem
              id={`${statsId}-following`}
              label="Following"
              value={stats.following}
            />
          </dl>

          <div
            role="group"
            aria-label="Profile actions"
            className="flex flex-col gap-3 sm:flex-row sm:flex-wrap"
          >
            {isOwnProfile ? (
              <Button
                type="button"
                variant="secondary"
                onClick={onEditProfile}
                aria-label="Edit your profile"
                className="w-full sm:w-auto"
              >
                Edit Profile
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant={isFollowing ? 'secondary' : 'primary'}
                  onClick={handleFollowClick}
                  aria-label={isFollowing ? `Unfollow ${name}` : `Follow ${name}`}
                  aria-pressed={isFollowing}
                  className="w-full sm:w-auto"
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onMessage}
                  aria-label={`Send a message to ${name}`}
                  className="w-full sm:w-auto"
                >
                  Message
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
