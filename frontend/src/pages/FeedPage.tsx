import { Feed } from '@/components/social'
import { useAuth } from '@/context/AuthContext'

export function FeedPage() {
  const { user } = useAuth()

  return (
    <div
      data-testid="feed-page"
      className="min-h-screen bg-gray-50 dark:bg-gray-950"
    >
      <main className="mx-auto px-4 py-8 sm:px-6">
        <Feed currentUser={user} />
      </main>
    </div>
  )
}
