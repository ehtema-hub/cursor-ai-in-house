import { validateLoginInput, validateRegisterInput } from '@/lib/authValidation'
import { ApiError } from '@/lib/api'
import {
  clearAuthStorage,
  getSession,
  loginUser,
  logoutUser,
  registerUser,
  restoreSession,
  setSession,
} from '@/lib/auth'
import { clearTokens, setTokens } from '@/lib/api'

describe('auth validation', () => {
  it('validates register input', () => {
    expect(validateRegisterInput('', 'bad', 'short')).toContain('name')
    expect(validateRegisterInput('Test User', 'not-email', 'password123')).toContain('email')
    expect(validateRegisterInput('Test User', 'test@example.com', 'short')).toContain('8 characters')
    expect(validateRegisterInput('Test User', 'test@example.com', 'password123')).toBeNull()
  })

  it('validates login input', () => {
    expect(validateLoginInput('', '')).toContain('required')
    expect(validateLoginInput('test@example.com', 'password')).toBeNull()
  })
})

describe('auth session storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('reads and writes session data', () => {
    expect(getSession()).toBeNull()
    setSession({ id: '1', name: 'A', email: 'a@b.com' })
    expect(getSession()).toEqual({ id: '1', name: 'A', email: 'a@b.com' })
    setSession(null)
    expect(getSession()).toBeNull()
  })

  it('clears auth storage', () => {
    setSession({ id: '1', name: 'A', email: 'a@b.com' })
    setTokens('access', 'refresh')
    clearAuthStorage()
    expect(getSession()).toBeNull()
    expect(localStorage.getItem('taskflow_access_token')).toBeNull()
  })

  it('clears session on logout', async () => {
    setSession({ id: '1', name: 'A', email: 'a@b.com' })
    setTokens('access', 'refresh')
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ message: 'Successfully logged out.' }),
    }) as jest.Mock
    await logoutUser()
    expect(getSession()).toBeNull()
  })

  it('logs in and stores the current user', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          access_token: 'access',
          refresh_token: 'refresh',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 4, name: 'Test User', email: 'test@example.com' }),
      }) as jest.Mock

    const result = await loginUser('test@example.com', 'password123')
    expect(result.user?.email).toBe('test@example.com')
    expect(getSession()?.name).toBe('Test User')
  })

  it('returns friendly errors for invalid login', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ message: 'Invalid credentials' }),
    }) as jest.Mock

    const result = await loginUser('test@example.com', 'wrong')
    expect(result.error).toBe('Invalid email or password.')
    expect(getSession()).toBeNull()
  })

  it('registers then logs in the user', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: 2, name: 'New User', email: 'new@example.com' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          access_token: 'access',
          refresh_token: 'refresh',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 2, name: 'New User', email: 'new@example.com' }),
      }) as jest.Mock

    const result = await registerUser('New User', 'new@example.com', 'password123')
    expect(result.user?.email).toBe('new@example.com')
  })

  it('handles duplicate registration', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 409,
      statusText: 'Conflict',
      json: async () => ({ message: 'Email exists' }),
    }) as jest.Mock

    const result = await registerUser('New User', 'new@example.com', 'password123')
    expect(result.error).toBe('An account with this email already exists.')
  })

  it('restores session when token is valid', async () => {
    setTokens('access', 'refresh')
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 9, name: 'Restored', email: 'restored@example.com' }),
    }) as jest.Mock

    const user = await restoreSession()
    expect(user?.email).toBe('restored@example.com')
  })

  it('clears session when restore fails', async () => {
    setTokens('expired', 'refresh')
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ message: 'Expired' }),
    }) as jest.Mock

    const user = await restoreSession()
    expect(user).toBeNull()
    expect(getSession()).toBeNull()
  })

  it('returns null when no access token is stored', async () => {
    await expect(restoreSession()).resolves.toBeNull()
  })

  it('maps generic API failures during login', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down')) as jest.Mock
    const result = await loginUser('test@example.com', 'password123')
    expect(result.error).toBe('Unable to sign in. Please try again.')
  })

  it('maps ApiError messages during register', async () => {
    global.fetch = jest.fn().mockRejectedValue(new ApiError('Server busy', 503)) as jest.Mock
    const result = await registerUser('New User', 'new@example.com', 'password123')
    expect(result.error).toBe('Server busy')
  })
})
