import type { RefObject } from 'react'
import { Loader2 } from 'lucide-react'

interface FeedPaginationProps {
  sentinelRef: RefObject<HTMLDivElement | null>
  nextPage: number | null
  isLoading: boolean
  isLoadingMore: boolean
  loadError: string | null
  postCount: number
}

export function FeedPagination({
  sentinelRef,
  nextPage,
  isLoading,
  isLoadingMore,
  loadError,
  postCount,
}: FeedPaginationProps) {
  const showSentinel = Boolean(nextPage && !isLoading && !loadError)
  const showCaughtUp = !nextPage && postCount > 0 && !isLoading

  return (
    <>
      {showSentinel && (
        <div
          ref={sentinelRef}
          data-testid="feed-load-sentinel"
          className="flex items-center justify-center py-6"
          aria-hidden={!isLoadingMore}
        >
          {isLoadingMore && (
            <div
              role="status"
              className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"
            >
              <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
              Loading more posts…
            </div>
          )}
        </div>
      )}

      {showCaughtUp && (
        <p className="py-4 text-center text-sm text-gray-400 dark:text-gray-500">
          You&apos;re all caught up!
        </p>
      )}
    </>
  )
}
