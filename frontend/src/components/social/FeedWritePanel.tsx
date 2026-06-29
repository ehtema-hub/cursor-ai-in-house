import { AlertCircle } from 'lucide-react'
import { CreatePost } from './CreatePost'
import type { ApiBlogCategory } from '@/lib/blogApi'
import type { CreatePostData, SocialUser } from '@/types/social'

interface FeedWritePanelProps {
  actionError: string | null
  socialUser: SocialUser | null
  canWrite: boolean
  categories: ApiBlogCategory[]
  onCreatePost: (data: CreatePostData) => void | Promise<void>
}

export function FeedWritePanel({
  actionError,
  socialUser,
  canWrite,
  categories,
  onCreatePost,
}: FeedWritePanelProps) {
  return (
    <>
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
          onCreatePost={onCreatePost}
        />
      )}

      {socialUser && !canWrite && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          Sign in again to publish posts and comments when the blog service was
          offline during your last login.
        </p>
      )}
    </>
  )
}
