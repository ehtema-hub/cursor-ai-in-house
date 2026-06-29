const BLOG_TOKEN_KEY = 'blog_access_token'

export function getBlogAccessToken(): string | null {
  return localStorage.getItem(BLOG_TOKEN_KEY)
}

export function setBlogAccessToken(token: string) {
  localStorage.setItem(BLOG_TOKEN_KEY, token)
}

export function clearBlogAccessToken() {
  localStorage.removeItem(BLOG_TOKEN_KEY)
}
