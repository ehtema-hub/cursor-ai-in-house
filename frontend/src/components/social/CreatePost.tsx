import { useState, type KeyboardEvent } from 'react'
import { ImagePlus, Send } from 'lucide-react'
import type { CreatePostData, SocialUser } from '@/types/social'
import { UserAvatar } from './UserAvatar'

export interface CreatePostProps {
  currentUser: SocialUser
  onCreatePost: (data: CreatePostData) => void
}

export function CreatePost({ currentUser, onCreatePost }: CreatePostProps) {
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [showImageInput, setShowImageInput] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = () => {
    const trimmed = content.trim()
    if (!trimmed) {
      setError('Post content cannot be empty.')
      return
    }

    onCreatePost({
      content: trimmed,
      imageUrl: imageUrl.trim() || undefined,
    })

    setContent('')
    setImageUrl('')
    setShowImageInput(false)
    setError('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      handleSubmit()
    }
  }

  return (
    <section
      aria-labelledby="create-post-heading"
      data-testid="create-post"
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <h2 id="create-post-heading" className="sr-only">
        Create a new post
      </h2>

      <div className="flex gap-3">
        <UserAvatar
          name={currentUser.name}
          avatarUrl={currentUser.avatarUrl}
        />

        <div className="min-w-0 flex-1">
          <label htmlFor="create-post-content" className="sr-only">
            What's on your mind?
          </label>
          <textarea
            id="create-post-content"
            data-testid="create-post-input"
            rows={3}
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => {
              setContent(e.target.value)
              if (error) setError('')
            }}
            onKeyDown={handleKeyDown}
            className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white dark:placeholder:text-gray-500"
          />

          {error && (
            <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          {showImageInput && (
            <div className="mt-2">
              <label htmlFor="create-post-image" className="sr-only">
                Image URL
              </label>
              <input
                id="create-post-image"
                type="url"
                data-testid="create-post-image-input"
                placeholder="Image URL (optional)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white"
              />
            </div>
          )}

          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowImageInput((prev) => !prev)}
              aria-label="Add image"
              data-testid="create-post-add-image"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              <ImagePlus aria-hidden="true" className="h-4 w-4" />
              Photo
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!content.trim()}
              data-testid="create-post-submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send aria-hidden="true" className="h-4 w-4" />
              Post
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
