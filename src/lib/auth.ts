export interface User {
  id: string
  name: string
  email: string
}

interface StoredUser extends User {
  password: string
}

const USERS_KEY = 'taskflow_users'
const SESSION_KEY = 'taskflow_session'

function readUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? (JSON.parse(raw) as StoredUser[]) : []
  } catch {
    return []
  }
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
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

export function registerUser(
  name: string,
  email: string,
  password: string,
): { user?: User; error?: string } {
  const trimmedEmail = email.trim().toLowerCase()

  if (!name.trim()) return { error: 'Full name is required.' }
  if (!trimmedEmail) return { error: 'Email is required.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return { error: 'Please enter a valid email address.' }
  }
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }

  const users = readUsers()
  if (users.some((u) => u.email === trimmedEmail)) {
    return { error: 'An account with this email already exists.' }
  }

  const user: StoredUser = {
    id: `user-${Date.now()}`,
    name: name.trim(),
    email: trimmedEmail,
    password,
  }

  writeUsers([...users, user])
  const { password: _, ...publicUser } = user
  setSession(publicUser)
  return { user: publicUser }
}

export function loginUser(
  email: string,
  password: string,
): { user?: User; error?: string } {
  const trimmedEmail = email.trim().toLowerCase()

  if (!trimmedEmail || !password) {
    return { error: 'Email and password are required.' }
  }

  const users = readUsers()
  const match = users.find(
    (u) => u.email === trimmedEmail && u.password === password,
  )

  if (!match) {
    return { error: 'Invalid email or password.' }
  }

  const { password: _, ...publicUser } = match
  setSession(publicUser)
  return { user: publicUser }
}

export function logoutUser() {
  setSession(null)
}

/** Clears all auth data — used by E2E tests for isolation */
export function clearAuthStorage() {
  localStorage.removeItem(USERS_KEY)
  localStorage.removeItem(SESSION_KEY)
}
