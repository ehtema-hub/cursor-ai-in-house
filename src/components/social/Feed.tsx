import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, Newspaper } from 'lucide-react'
import { PostCard } from './PostCard'
import { CreatePost } from './CreatePost'
import type { Comment, CreatePostData, Post } from '@/types/social'
import { CURRENT_USER, MOCK_POSTS, POSTS_PER_PAGE } from '@/data/samplePosts'

function createPost(data: CreatePostData): Post {
  return {
    id: `post-${Date.now()}`,
    author: CURRENT_USER,
    content: data.content,
    imageUrl: data.imageUrl,
    timestamp: new Date().toISOString(),
    likes: 0,
    likedByCurrentUser: false,
    comments: [],
    shares: 0,
  }
}

function createComment(postId: string, content: string): Comment {
  return {
    id: `comment-${Date.now()}`,
    postId,
    author: CURRENT_USER,
    content,
    timestamp: new Date().toISOString(),
  }
}

export function Feed() {
  const [allPosts] = useState<Post[]>(MOCK_POSTS)
  const [visiblePosts, setVisiblePosts] = useState<Post[]>(() =>
    MOCK_POSTS.slice(0, POSTS_PER_PAGE),
  )
  const [newPosts, setNewPosts] = useState<Post[]>([])
  const [page, setPage] = useState(1)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(MOCK_POSTS.length > POSTS_PER_PAGE)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const displayedPosts = [...newPosts, ...visiblePosts]

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return

    setIsLoadingMore(true)

    setTimeout(() => {
      const nextPage = page + 1
      const end = nextPage * POSTS_PER_PAGE
      const nextBatch = allPosts.slice(0, end)

      setVisiblePosts(nextBatch)
      setPage(nextPage)
      setHasMore(end < allPosts.length)
      setIsLoadingMore(false)
    }, 800)
  }, [allPosts, hasMore, isLoadingMore, page])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore()
        }
      },
      { rootMargin: '200px' },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore])

  const handleCreatePost = (data: CreatePostData) => {
    const post = createPost(data)
    setNewPosts((prev) => [post, ...prev])
  }

  const handleLike = (postId: string) => {
    const toggle = (post: Post): Post => {
      if (post.id !== postId) return post
      const liked = !post.likedByCurrentUser
      return {
        ...post,
        likedByCurrentUser: liked,
        likes: liked ? post.likes + 1 : Math.max(0, post.likes - 1),
      }
    }

    setNewPosts((prev) => prev.map(toggle))
    setVisiblePosts((prev) => prev.map(toggle))
  }

  const handleAddComment = (postId: string, content: string) => {
    const comment = createComment(postId, content)

    const append = (post: Post): Post =>
      post.id === postId
        ? { ...post, comments: [...post.comments, comment] }
        : post

    setNewPosts((prev) => prev.map(append))
    setVisiblePosts((prev) => prev.map(append))
  }

  const handleShare = (postId: string) => {
    alert(`Share link copied for post ${postId}`)
  }

  return (
    <div
      className="mx-auto w-full max-w-xl space-y-4"
      data-testid="social-feed"
    >
      <header className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Feed
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          See what your team is sharing
        </p>
      </header>

      <CreatePost currentUser={CURRENT_USER} onCreatePost={handleCreatePost} />

      {displayedPosts.length === 0 ? (
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
      ) : (
        <div role="feed" aria-label="Social media posts" className="space-y-4">
          {displayedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={CURRENT_USER}
              onLike={handleLike}
              onAddComment={handleAddComment}
              onShare={handleShare}
            />
          ))}
        </div>
      )}

      {hasMore && (
        <div
          ref={sentinelRef}
          data-testid="feed-load-sentinel"
          className="flex items-center justify-center py-6"
          aria-hidden={!isLoadingMore}
        >
          {isLoadingMore && (
            <div
              role="status"
              data-testid="feed-loading"
              className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"
            >
              <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
              Loading more posts…
            </div>
          )}
        </div>
      )}

      {!hasMore && displayedPosts.length > 0 && (
        <p className="py-4 text-center text-sm text-gray-400 dark:text-gray-500">
          You&apos;re all caught up!
        </p>
      )}
    </div>
  )
}
