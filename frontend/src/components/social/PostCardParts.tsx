import { Heart, MessageCircle, Share2 } from 'lucide-react'
import type { Post } from '@/types/social'
import { UserAvatar } from './UserAvatar'
import { formatCount, formatRelativeTime } from '@/lib/socialUtils'

export function PostCardHeader({ post }: { post: Post }) {
  return (
    <header className="flex items-center gap-3 px-4 py-3">
      <UserAvatar name={post.author.name} avatarUrl={post.author.avatarUrl} />
      <div className="min-w-0 flex-1">
        <p
          id={`post-${post.id}-author`}
          className="truncate text-sm font-semibold text-gray-900 dark:text-white"
        >
          {post.author.name}
        </p>
        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
          @{post.author.username}
          {' · '}
          <time dateTime={post.timestamp}>
            {formatRelativeTime(post.timestamp)}
          </time>
        </p>
      </div>
      {post.categoryName && (
        <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
          {post.categoryName}
        </span>
      )}
    </header>
  )
}

interface PostCardActionsProps {
  post: Post
  showComments: boolean
  showSocialActions: boolean
  onToggleComments: () => void
  onLike?: (postId: string) => void
  onShare?: (postId: string) => void
}

export function PostCardActions({
  post,
  showComments,
  showSocialActions,
  onToggleComments,
  onLike,
  onShare,
}: PostCardActionsProps) {
  return (
    <div className="flex items-center gap-1 border-t border-gray-100 px-2 py-1 dark:border-gray-700">
      {showSocialActions && onLike && (
        <button
          type="button"
          onClick={() => onLike(post.id)}
          aria-label={post.likedByCurrentUser ? 'Unlike post' : 'Like post'}
          aria-pressed={post.likedByCurrentUser}
          data-testid={`like-button-${post.id}`}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            post.likedByCurrentUser
              ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
              : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'
          }`}
        >
          <Heart
            aria-hidden="true"
            className={`h-4 w-4 ${post.likedByCurrentUser ? 'fill-current' : ''}`}
          />
          {formatCount(post.likes)}
        </button>
      )}

      <button
        type="button"
        onClick={onToggleComments}
        aria-expanded={showComments}
        aria-controls={`comment-section-${post.id}`}
        data-testid={`comment-toggle-${post.id}`}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-400 dark:hover:bg-gray-700"
      >
        <MessageCircle aria-hidden="true" className="h-4 w-4" />
        {formatCount(post.comments.length)}
      </button>

      {showSocialActions && onShare && (
        <button
          type="button"
          onClick={() => onShare(post.id)}
          aria-label="Share post"
          data-testid={`share-button-${post.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          <Share2 aria-hidden="true" className="h-4 w-4" />
          {formatCount(post.shares)}
        </button>
      )}
    </div>
  )
}
