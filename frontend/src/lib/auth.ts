import {
  apiFetch,
  clearTokens,
  getAccessToken,
  setTokens,
  ApiError,
} from '@/lib/api'
import { validateLoginInput, validateRegisterInput } from '@/lib/authValidation'
import type { ApiUser } from '@/lib/mappers'

export interface User {
  id: string
  name: string
  email: string
}

const SESSION_KEY = 'taskflow_session'

interface TokenResponse {
  access_token: string
  refresh_token: string
}

function mapUser(user: ApiUser): User {
  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
  }
}

export function getSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

export function setSession(user: User | null) {
  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(SESSION_KEY)
  }
}

async function fetchCurrentUser(): Promise<User> {
  const user = await apiFetch<ApiUser>('/api/auth/me')
  const mapped = mapUser(user)
  setSession(mapped)
  return mapped
}

export async function registerUser(
  name: string,
  email: string,
  password: string,
): Promise<{ user?: User; error?: string }> {
  const validationError = validateRegisterInput(name, email, password)
  if (validationError) return { error: validationError }

  try {
    await apiFetch<ApiUser>(
      '/api/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      },
      false,
    )
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) {
        return { error: 'Invalid email or password.' }
      }
      if (error.status === 409) {
        return { error: 'An account with this email already exists.' }
      }
      return { error: error.message }
    }
    return { error: 'Unable to register. Please try again.' }
  }

  return loginUser(email, password)
}

export async function loginUser(
  email: string,
  password: string,
): Promise<{ user?: User; error?: string }> {
  const validationError = validateLoginInput(email, password)
  if (validationError) return { error: validationError }

  try {
    const tokens = await apiFetch<TokenResponse>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      },
      false,
    )
    setTokens(tokens.access_token, tokens.refresh_token)
    const user = await fetchCurrentUser()
    return { user }
  } catch (error) {
    clearTokens()
    setSession(null)
    if (error instanceof ApiError) {
      if (error.status === 401) {
        return { error: 'Invalid email or password.' }
      }
      return { error: error.message }
    }
    return { error: 'Unable to sign in. Please try again.' }
  }
}

export async function logoutUser() {
  try {
    if (getAccessToken()) {
      await apiFetch('/api/auth/logout', { method: 'POST' })
    }
  } catch {
    // ignore logout errors — clear local session regardless
  } finally {
    clearTokens()
    setSession(null)
  }
}

/** Restore session from stored token on app load */
export async function restoreSession(): Promise<User | null> {
  if (!getAccessToken()) {
    setSession(null)
    return null
  }

  try {
    return await fetchCurrentUser()
  } catch {
    clearTokens()
    setSession(null)
    return null
  }
}

/** Clears all auth data — used by E2E tests for isolation */
export function clearAuthStorage() {
  clearTokens()
  localStorage.removeItem(SESSION_KEY)
}
