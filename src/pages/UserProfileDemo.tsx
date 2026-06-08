import { useState } from 'react'
import { UserProfile } from '@/components'
import { sampleUsers } from '@/data/sampleUsers'

function buildInitialFollowingState() {
  return Object.fromEntries(
    sampleUsers
      .filter((user) => !user.isOwnProfile)
      .map((user) => [user.id, user.initiallyFollowing ?? false]),
  )
}

export function UserProfileDemo() {
  const [following, setFollowing] = useState(buildInitialFollowingState)

  const handleFollow = (userId: string) => {
    setFollowing((prev) => ({ ...prev, [userId]: true }))
  }

  const handleUnfollow = (userId: string) => {
    setFollowing((prev) => ({ ...prev, [userId]: false }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Component Showcase
          </h2>
          <p className="mt-3 text-lg text-gray-600">
            Sample profiles demonstrating layout, stats formatting, and action
            button states.
          </p>
        </div>

        <div className="space-y-12">
          <section aria-labelledby="own-profile-heading">
            <h3
              id="own-profile-heading"
              className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500"
            >
              Your profile — Edit Profile action
            </h3>
            {sampleUsers
              .filter((user) => user.isOwnProfile)
              .map((user) => (
                <UserProfile
                  key={user.id}
                  avatarUrl={user.avatarUrl}
                  name={user.name}
                  username={user.username}
                  bio={user.bio}
                  stats={user.stats}
                  isOwnProfile
                  onEditProfile={() =>
                    alert(`Opening editor for ${user.name}…`)
                  }
                />
              ))}
          </section>

          <section aria-labelledby="following-heading">
            <h3
              id="following-heading"
              className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500"
            >
              Already following — Following + Message actions
            </h3>
            <div className="space-y-6">
              {sampleUsers
                .filter(
                  (user) =>
                    !user.isOwnProfile && user.initiallyFollowing === true,
                )
                .map((user) => (
                  <UserProfile
                    key={user.id}
                    avatarUrl={user.avatarUrl}
                    name={user.name}
                    username={user.username}
                    bio={user.bio}
                    stats={user.stats}
                    isFollowing={following[user.id]}
                    onFollow={() => handleFollow(user.id)}
                    onUnfollow={() => handleUnfollow(user.id)}
                    onMessage={() =>
                      alert(`Opening message thread with ${user.name}…`)
                    }
                  />
                ))}
            </div>
          </section>

          <section aria-labelledby="discover-heading">
            <h3
              id="discover-heading"
              className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500"
            >
              Discover — Follow + Message actions
            </h3>
            <div className="space-y-6">
              {sampleUsers
                .filter(
                  (user) =>
                    !user.isOwnProfile && user.initiallyFollowing !== true,
                )
                .map((user) => (
                  <UserProfile
                    key={user.id}
                    avatarUrl={user.avatarUrl}
                    name={user.name}
                    username={user.username}
                    bio={user.bio}
                    stats={user.stats}
                    isFollowing={following[user.id]}
                    onFollow={() => handleFollow(user.id)}
                    onUnfollow={() => handleUnfollow(user.id)}
                    onMessage={() =>
                      alert(`Opening message thread with ${user.name}…`)
                    }
                  />
                ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
