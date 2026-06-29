import { AlertCircle, Loader2, Newspaper } from 'lucide-react'
import { PostCard } from './PostCard'
import type { Post, SocialUser } from '@/types/social'

interface FeedContentProps {
  isLoading: boolean
  loadError: string | null
  posts: Post[]
  socialUser?: SocialUser
  onAddComment: (postId: string, content: string) => void | Promise<void>
}

export function FeedContent({
  isLoading,
  loadError,
  posts,
  socialUser,
  onAddComment,
}: FeedContentProps) {
  if (isLoading) {
    return (
      <div
        role="status"
        data-testid="feed-loading"
        className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500 dark:text-gray-400"
      >
        <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
        Loading posts…
      </div>
    )
  }

  if (loadError) {
    return (
      <div
        role="alert"
        data-testid="feed-error"
        className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-red-200 px-6 py-16 text-center dark:border-red-900/50"
      >
        <AlertCircle
          aria-hidden="true"
          className="mb-3 h-12 w-12 text-red-300 dark:text-red-600"
        />
        <p className="text-base font-medium text-red-700 dark:text-red-300">
          {loadError}
        </p>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div
        data-testid="feed-empty-state"
        className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 px-6 py-16 text-center dark:border-gray-700"
      >
        <Newspaper
          aria-hidden="true"
          className="mb-3 h-12 w-12 text-gray-300 dark:text-gray-600"
        />
        <p className="text-base font-medium text-gray-600 dark:text-gray-400">
          No posts yet
        </p>
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
          Be the first to share something with your team.
        </p>
      </div>
    )
  }

  return (
    <div role="feed" aria-label="Blog posts" className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUser={socialUser}
          onAddComment={onAddComment}
          showSocialActions={false}
        />
      ))}
    </div>
  )
}
