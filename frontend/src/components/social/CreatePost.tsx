import { useState, type KeyboardEvent } from 'react'
import { Send } from 'lucide-react'
import type { ApiBlogCategory } from '@/lib/blogApi'
import type { CreatePostData, SocialUser } from '@/types/social'
import { UserAvatar } from './UserAvatar'

export interface CreatePostProps {
  currentUser: SocialUser
  categories: ApiBlogCategory[]
  onCreatePost: (data: CreatePostData) => void | Promise<void>
}

export function CreatePost({
  currentUser,
  categories,
  onCreatePost,
}: CreatePostProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [categoryId, setCategoryId] = useState(
    () => String(categories[0]?.id ?? ''),
  )
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()
    const parsedCategoryId = Number(categoryId)

    if (trimmedTitle.length < 3) {
      setError('Title must be at least 3 characters.')
      return
    }
    if (trimmedContent.length < 10) {
      setError('Content must be at least 10 characters.')
      return
    }
    if (!parsedCategoryId) {
      setError('Please select a category.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      await onCreatePost({
        title: trimmedTitle,
        content: trimmedContent,
        category_id: parsedCategoryId,
      })
      setTitle('')
      setContent('')
    } catch {
      // Parent surfaces API errors.
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      void handleSubmit()
    }
  }

  return (
    <section
      aria-labelledby="create-post-heading"
      data-testid="create-post"
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <h2 id="create-post-heading" className="sr-only">
        Create a new blog post
      </h2>

      <div className="flex gap-3">
        <UserAvatar
          name={currentUser.name}
          avatarUrl={currentUser.avatarUrl}
        />

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <label htmlFor="create-post-title" className="sr-only">
              Post title
            </label>
            <input
              id="create-post-title"
              data-testid="create-post-title-input"
              type="text"
              placeholder="Post title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (error) setError('')
              }}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white dark:placeholder:text-gray-500"
            />
          </div>

          <div>
            <label htmlFor="create-post-category" className="sr-only">
              Category
            </label>
            <select
              id="create-post-category"
              data-testid="create-post-category-select"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value)
                if (error) setError('')
              }}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="create-post-content" className="sr-only">
              Post content
            </label>
            <textarea
              id="create-post-content"
              data-testid="create-post-input"
              rows={4}
              placeholder="Write your post…"
              value={content}
              onChange={(e) => {
                setContent(e.target.value)
                if (error) setError('')
              }}
              onKeyDown={handleKeyDown}
              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white dark:placeholder:text-gray-500"
            />
          </div>

          {error && (
            <p role="alert" className="text-xs text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={isSubmitting || !title.trim() || !content.trim()}
              data-testid="create-post-submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send aria-hidden="true" className="h-4 w-4" />
              {isSubmitting ? 'Publishing…' : 'Publish'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
