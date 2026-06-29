import { getBlogAccessToken } from '@/lib/blogToken'

export class BlogApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'BlogApiError'
    this.status = status
  }
}

declare const __BLOG_API_BASE_URL__: string

export function getBlogApiBaseUrl(): string {
  return typeof __BLOG_API_BASE_URL__ !== 'undefined' ? __BLOG_API_BASE_URL__ : '/blog-api'
}

export interface ApiBlogUser {
  id: number
  email: string
  username: string
  created_at: string
}

export interface ApiBlogCategory {
  id: number
  name: string
  created_at: string
}

export interface ApiBlogComment {
  id: number
  content: string
  user_id: number
  post_id: number
  created_at: string
  author?: ApiBlogUser
}

export interface ApiBlogPost {
  id: number
  title: string
  content: string
  user_id: number
  category_id: number
  created_at: string
  updated_at: string
  author?: ApiBlogUser
  category?: ApiBlogCategory
  comments?: ApiBlogComment[]
}

export interface PaginatedBlogPosts {
  items: ApiBlogPost[]
  meta: {
    total: number
    pages: number
    page: number
    per_page: number
    next_page: number | null
    prev_page: number | null
  }
}

async function parseBlogError(response: Response): Promise<BlogApiError> {
  let message = response.statusText || 'Request failed'
  try {
    const body = (await response.json()) as { error?: string; message?: string }
    if (body.error) message = body.error
    else if (body.message) message = body.message
  } catch {
    // ignore JSON parse errors
  }
  return new BlogApiError(message, response.status)
}

export async function blogFetch<T>(
  path: string,
  options: RequestInit = {},
  auth = false,
): Promise<T> {
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (auth) {
    const token = getBlogAccessToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${getBlogApiBaseUrl()}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    throw await parseBlogError(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export async function fetchBlogPosts(page = 1): Promise<PaginatedBlogPosts> {
  return blogFetch<PaginatedBlogPosts>(`/api/posts?page=${page}`, {}, false)
}

export async function fetchBlogCategories(): Promise<ApiBlogCategory[]> {
  return blogFetch<ApiBlogCategory[]>('/api/categories', {}, false)
}

export async function createBlogPost(payload: {
  title: string
  content: string
  category_id: number
}): Promise<ApiBlogPost> {
  return blogFetch<ApiBlogPost>(
    '/api/posts',
    { method: 'POST', body: JSON.stringify(payload) },
    true,
  )
}

export async function createBlogComment(
  postId: string,
  content: string,
): Promise<ApiBlogComment> {
  return blogFetch<ApiBlogComment>(
    `/api/posts/${postId}/comments`,
    { method: 'POST', body: JSON.stringify({ content }) },
    true,
  )
}
