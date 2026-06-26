import { useState } from 'react'
import type { Post, SocialUser } from '@/types/social'
import { CommentSection } from './CommentSection'
import { PostCardActions, PostCardHeader } from './PostCardParts'

export interface PostCardProps {
  post: Post
  currentUser?: SocialUser
  onLike?: (postId: string) => void
  onAddComment: (postId: string, content: string) => void | Promise<void>
  onShare?: (postId: string) => void
  showSocialActions?: boolean
}

export function PostCard({
  post,
  currentUser,
  onLike,
  onAddComment,
  onShare,
  showSocialActions = true,
}: PostCardProps) {
  const [showComments, setShowComments] = useState(post.comments.length > 0)

  return (
    <article
      aria-labelledby={`post-${post.id}-author`}
      data-testid={`post-card-${post.id}`}
      className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <PostCardHeader post={post} />

      <div className="px-4 pb-3">
        {post.title && (
          <h3 className="mb-2 text-base font-semibold text-gray-900 dark:text-white">
            {post.title}
          </h3>
        )}
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

      <PostCardActions
        post={post}
        showComments={showComments}
        showSocialActions={showSocialActions}
        onToggleComments={() => setShowComments((prev) => !prev)}
        onLike={onLike}
        onShare={onShare}
      />

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
