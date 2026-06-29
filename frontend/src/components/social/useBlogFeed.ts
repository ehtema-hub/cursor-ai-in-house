import { useCallback, useEffect, useState } from 'react'
import type { CreatePostData, Post } from '@/types/social'
import {
  createBlogComment,
  createBlogPost,
  fetchBlogCategories,
  fetchBlogPosts,
  type ApiBlogCategory,
} from '@/lib/blogApi'
import { blogErrorMessage, userToSocialUser } from '@/lib/blogFeedUtils'
import { mapBlogComment, mapBlogPost, mapBlogPosts } from '@/lib/blogMappers'
import type { User } from '@/lib/auth'

export function useBlogFeed(currentUser?: User | null) {
  const [posts, setPosts] = useState<Post[]>([])
  const [categories, setCategories] = useState<ApiBlogCategory[]>([])
  const [nextPage, setNextPage] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const socialUser = currentUser ? userToSocialUser(currentUser) : null

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
        setLoadError(
          blogErrorMessage(
            error,
            'Unable to load blog posts. Is the blog API running on port 5001?',
          ),
        )
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
      setActionError(blogErrorMessage(error, 'Unable to load more posts.'))
    } finally {
      setIsLoadingMore(false)
    }
  }, [isLoadingMore, nextPage])

  const handleCreatePost = async (data: CreatePostData) => {
    setActionError(null)
    try {
      const created = await createBlogPost(data)
      setPosts((prev) => [mapBlogPost(created), ...prev])
    } catch (error) {
      setActionError(blogErrorMessage(error, 'Unable to create post. Please try again.'))
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
      setActionError(blogErrorMessage(error, 'Unable to add comment. Please try again.'))
    }
  }

  return {
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
  }
}
