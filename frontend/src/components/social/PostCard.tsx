import { useState } from 'react'
import { Heart, MessageCircle, Share2 } from 'lucide-react'
import type { Post, SocialUser } from '@/types/social'
import { UserAvatar } from './UserAvatar'
import { CommentSection } from './CommentSection'
import { formatCount, formatRelativeTime } from '@/lib/socialUtils'

export interface PostCardProps {
  post: Post
  currentUser: SocialUser
  onLike: (postId: string) => void
  onAddComment: (postId: string, content: string) => void
  onShare: (postId: string) => void
}

export function PostCard({
  post,
  currentUser,
  onLike,
  onAddComment,
  onShare,
}: PostCardProps) {
  const [showComments, setShowComments] = useState(post.comments.length > 0)

  return (
    <article
      aria-labelledby={`post-${post.id}-author`}
      data-testid={`post-card-${post.id}`}
      className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <header className="flex items-center gap-3 px-4 py-3">
        <UserAvatar
          name={post.author.name}
          avatarUrl={post.author.avatarUrl}
        />
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
      </header>

      <div className="px-4 pb-3">
        <p className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
          {post.content}
        </p>
      </div>

      {post.imageUrl && (
        <div className="border-y border-gray-100 dark:border-gray-700">
          <img
            src={post.imageUrl}
            alt=""
            loading="lazy"
            className="max-h-96 w-full object-cover"
          />
        </div>
      )}

      <div className="flex items-center gap-1 border-t border-gray-100 px-2 py-1 dark:border-gray-700">
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

        <button
          type="button"
          onClick={() => setShowComments((prev) => !prev)}
          aria-expanded={showComments}
          aria-controls={`comment-section-${post.id}`}
          data-testid={`comment-toggle-${post.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          <MessageCircle aria-hidden="true" className="h-4 w-4" />
          {formatCount(post.comments.length)}
        </button>

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
      </div>

      {showComments && (
        <CommentSection
          postId={post.id}
          comments={post.comments}
          currentUser={currentUser}
          onAddComment={onAddComment}
        />
      )}
    </article>
  )
}
