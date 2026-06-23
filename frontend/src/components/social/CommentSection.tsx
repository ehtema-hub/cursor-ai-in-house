import { useState, type KeyboardEvent } from 'react'
import { Send } from 'lucide-react'
import type { Comment, SocialUser } from '@/types/social'
import { UserAvatar } from './UserAvatar'
import { formatRelativeTime } from '@/lib/socialUtils'

export interface CommentSectionProps {
  postId: string
  comments: Comment[]
  currentUser: SocialUser
  onAddComment: (postId: string, content: string) => void
}

export function CommentSection({
  postId,
  comments,
  currentUser,
  onAddComment,
}: CommentSectionProps) {
  const [draft, setDraft] = useState('')
  const [isExpanded, setIsExpanded] = useState(comments.length > 0)

  const handleSubmit = () => {
    const trimmed = draft.trim()
    if (!trimmed) return
    onAddComment(postId, trimmed)
    setDraft('')
    setIsExpanded(true)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div
      className="border-t border-gray-100 px-4 py-3 dark:border-gray-700"
      data-testid={`comment-section-${postId}`}
    >
      {comments.length > 0 && (
        <ul role="list" className="mb-3 space-y-3" aria-label="Comments">
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-2">
              <UserAvatar
                name={comment.author.name}
                avatarUrl={comment.author.avatarUrl}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <div className="rounded-2xl bg-gray-50 px-3 py-2 dark:bg-gray-700/50">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {comment.author.name}
                  </p>
                  <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">
                    {comment.content}
                  </p>
                </div>
                <time
                  dateTime={comment.timestamp}
                  className="mt-1 block text-xs text-gray-400 dark:text-gray-500"
                >
                  {formatRelativeTime(comment.timestamp)}
                </time>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-end gap-2">
        <UserAvatar
          name={currentUser.name}
          avatarUrl={currentUser.avatarUrl}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <label htmlFor={`comment-input-${postId}`} className="sr-only">
            Write a comment
          </label>
          <textarea
            id={`comment-input-${postId}`}
            data-testid={`comment-input-${postId}`}
            rows={isExpanded ? 2 : 1}
            placeholder="Write a comment…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            onKeyDown={handleKeyDown}
            className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white dark:placeholder:text-gray-500"
          />
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!draft.trim()}
          aria-label="Post comment"
          data-testid={`comment-submit-${postId}`}
          className="shrink-0 rounded-full bg-indigo-600 p-2 text-white transition-colors hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
