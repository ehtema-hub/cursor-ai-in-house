import { useEffect, useRef } from 'react'
import { FeedContent } from './FeedContent'
import { FeedPagination } from './FeedPagination'
import { FeedWritePanel } from './FeedWritePanel'
import { useBlogFeed } from './useBlogFeed'
import { getBlogAccessToken } from '@/lib/blogToken'
import type { User } from '@/lib/auth'

export interface FeedProps {
  currentUser?: User | null
}

export function Feed({ currentUser }: FeedProps) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const {
    posts,
    categories,
    nextPage,
    isLoading,
    isLoadingMore,
    loadError,
    actionError,
    socialUser,
    loadMore,
    handleCreatePost,
    handleAddComment,
  } = useBlogFeed(currentUser)
  const canWrite = Boolean(currentUser && getBlogAccessToken())

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !nextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore()
        }
      },
      { rootMargin: '200px' },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore, nextPage])

  return (
    <div
      className="mx-auto w-full max-w-xl space-y-4"
      data-testid="social-feed"
    >
      <header className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Blog
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Read and share posts from your team
        </p>
      </header>

      <FeedWritePanel
        actionError={actionError}
        socialUser={socialUser}
        canWrite={canWrite}
        categories={categories}
        onCreatePost={handleCreatePost}
      />

      <FeedContent
        isLoading={isLoading}
        loadError={loadError}
        posts={posts}
        socialUser={socialUser ?? undefined}
        onAddComment={handleAddComment}
      />

      <FeedPagination
        sentinelRef={sentinelRef}
        nextPage={nextPage}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        loadError={loadError}
        postCount={posts.length}
      />
    </div>
  )
}
