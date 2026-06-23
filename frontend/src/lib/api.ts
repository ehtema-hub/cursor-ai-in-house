const TOKEN_KEY = 'taskflow_access_token'
const REFRESH_KEY = 'taskflow_refresh_token'

export class ApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

declare const __API_BASE_URL__: string

export function getApiBaseUrl(): string {
  return typeof __API_BASE_URL__ !== 'undefined' ? __API_BASE_URL__ : ''
}

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem(TOKEN_KEY, access)
  localStorage.setItem(REFRESH_KEY, refresh)
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

interface ApiErrorBody {
  status?: string
  message?: string
  code?: string
}

async function parseError(response: Response): Promise<ApiError> {
  let message = response.statusText || 'Request failed'
  let code: string | undefined
  try {
    const body = (await response.json()) as ApiErrorBody
    if (body.message) message = body.message
    code = body.code
  } catch {
    // ignore JSON parse errors
  }
  return new ApiError(message, response.status, code)
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  auth = true,
): Promise<T> {
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (auth) {
    const token = getAccessToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    throw await parseError(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
