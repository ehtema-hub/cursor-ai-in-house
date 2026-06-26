import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertCircle, Loader2, Newspaper } from 'lucide-react'
import { PostCard } from './PostCard'
import { CreatePost } from './CreatePost'
import type { CreatePostData, Post, SocialUser } from '@/types/social'
import {
  BlogApiError,
  createBlogComment,
  createBlogPost,
  fetchBlogCategories,
  fetchBlogPosts,
  type ApiBlogCategory,
} from '@/lib/blogApi'
import { getBlogAccessToken } from '@/lib/blogToken'
import { mapBlogComment, mapBlogPost, mapBlogPosts } from '@/lib/blogMappers'
import type { User } from '@/lib/auth'

function userToSocialUser(user: User): SocialUser {
  const username = user.email.split('@')[0] || user.name
  return {
    id: user.id,
    name: user.name,
    username,
    avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`,
  }
}

export interface FeedProps {
  currentUser?: User | null
}

export function Feed({ currentUser }: FeedProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [categories, setCategories] = useState<ApiBlogCategory[]>([])
  const [nextPage, setNextPage] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const socialUser = currentUser ? userToSocialUser(currentUser) : null
  const canWrite = Boolean(currentUser && getBlogAccessToken())

  useEffect(() => {
    let active = true

    async function loadInitial() {
      setIsLoading(true)
      setLoadError(null)

      try {
        const [postsResult, categoriesResult] = await Promise.all([
          fetchBlogPosts(1),
          fetchBlogCategories(),
        ])

        if (!active) return

        setPosts(mapBlogPosts(postsResult.items))
        setNextPage(postsResult.meta.next_page)
        setCategories(categoriesResult)
      } catch (error) {
        if (!active) return
        const message =
          error instanceof BlogApiError
            ? error.message
            : 'Unable to load blog posts. Is the blog API running on port 5001?'
        setLoadError(message)
      } finally {
        if (active) setIsLoading(false)
      }
    }

    void loadInitial()
    return () => {
      active = false
    }
  }, [])

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !nextPage) return

    setIsLoadingMore(true)
    try {
      const data = await fetchBlogPosts(nextPage)
      setPosts((prev) => [...prev, ...mapBlogPosts(data.items)])
      setNextPage(data.meta.next_page)
    } catch (error) {
      const message =
        error instanceof BlogApiError
          ? error.message
          : 'Unable to load more posts.'
      setActionError(message)
    } finally {
      setIsLoadingMore(false)
    }
  }, [isLoadingMore, nextPage])

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

  const handleCreatePost = async (data: CreatePostData) => {
    setActionError(null)
    try {
      const created = await createBlogPost(data)
      setPosts((prev) => [mapBlogPost(created), ...prev])
    } catch (error) {
      const message =
        error instanceof BlogApiError
          ? error.message
          : 'Unable to create post. Please try again.'
      setActionError(message)
      throw error
    }
  }

  const handleAddComment = async (postId: string, content: string) => {
    if (!socialUser) return

    setActionError(null)
    try {
      const apiComment = await createBlogComment(postId, content)
      const comment = mapBlogComment(apiComment)
      if (comment.author.id === 'unknown') {
        comment.author = socialUser
      }

      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, comments: [...post.comments, comment] }
            : post,
        ),
      )
    } catch (error) {
      const message =
        error instanceof BlogApiError
          ? error.message
          : 'Unable to add comment. Please try again.'
      setActionError(message)
    }
  }

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

      {actionError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{actionError}</p>
        </div>
      )}

      {socialUser && canWrite && categories.length > 0 && (
        <CreatePost
          currentUser={socialUser}
          categories={categories}
          onCreatePost={handleCreatePost}
        />
      )}

      {socialUser && !canWrite && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          Sign in again to publish posts and comments when the blog service was
          offline during your last login.
        </p>
      )}

      {isLoading ? (
        <div
          role="status"
          data-testid="feed-loading"
          className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500 dark:text-gray-400"
        >
          <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
          Loading posts…
        </div>
      ) : loadError ? (
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
      ) : posts.length === 0 ? (
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
        <div role="feed" aria-label="Blog posts" className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={socialUser ?? undefined}
              onAddComment={handleAddComment}
              showSocialActions={false}
            />
          ))}
        </div>
      )}

      {nextPage && !isLoading && !loadError && (
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

      {!nextPage && posts.length > 0 && !isLoading && (
        <p className="py-4 text-center text-sm text-gray-400 dark:text-gray-500">
          You&apos;re all caught up!
        </p>
      )}
    </div>
  )
}
