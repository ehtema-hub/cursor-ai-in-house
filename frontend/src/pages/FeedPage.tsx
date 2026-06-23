import { Feed } from '@/components/social'

export function FeedPage() {
  return (
    <div
      data-testid="feed-page"
      className="min-h-screen bg-gray-50 dark:bg-gray-950"
    >
      <main className="mx-auto px-4 py-8 sm:px-6">
        <Feed />
      </main>
    </div>
  )
}
