import { BlogApiError } from '@/lib/blogApi'
import type { User } from '@/lib/auth'
import type { SocialUser } from '@/types/social'

export function userToSocialUser(user: User): SocialUser {
  const username = user.email.split('@')[0] || user.name
  return {
    id: user.id,
    name: user.name,
    username,
    avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`,
  }
}

export function blogErrorMessage(error: unknown, fallback: string): string {
  return error instanceof BlogApiError ? error.message : fallback
}
