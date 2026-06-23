import { validateLoginInput, validateRegisterInput } from '@/lib/authValidation'
import { clearTokens, setTokens } from '@/lib/api'
import { getSession, logoutUser, setSession } from '@/lib/auth'

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
})
