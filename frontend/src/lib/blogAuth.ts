import { BlogApiError, blogFetch } from '@/lib/blogApi'
import { setBlogAccessToken } from '@/lib/blogToken'

export { clearBlogAccessToken, getBlogAccessToken, setBlogAccessToken } from '@/lib/blogToken'

function blogUsernameFromEmail(email: string, name?: string): string {
  const raw = (name || email.split('@')[0] || 'user')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
  const base = raw.length >= 3 ? raw.slice(0, 20) : `user${Date.now()}`
  return base.slice(0, 20)
}

async function loginBlog(email: string, password: string): Promise<void> {
  const data = await blogFetch<{ access_token: string }>(
    '/api/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    },
    false,
  )
  setBlogAccessToken(data.access_token)
}

async function registerBlog(
  email: string,
  password: string,
  name?: string,
): Promise<void> {
  const username = blogUsernameFromEmail(email, name)
  await blogFetch(
    '/api/auth/register',
    {
      method: 'POST',
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        username,
        password,
      }),
    },
    false,
  )
  await loginBlog(email, password)
}

/** Sync blog-api JWT when user signs in to the main app (best-effort). */
export async function ensureBlogSession(
  email: string,
  password: string,
  name?: string,
): Promise<void> {
  try {
    await loginBlog(email, password)
    return
  } catch (error) {
    if (!(error instanceof BlogApiError) || error.status !== 401) {
      return
    }
  }

  try {
    await registerBlog(email, password, name)
  } catch {
    // Blog service may be offline during local dev — feed stays read-only.
  }
}
