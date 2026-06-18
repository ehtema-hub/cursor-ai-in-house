import { getSession, loginUser, logoutUser, registerUser, setSession } from '@/lib/auth'

describe('auth', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('registers and logs in a user', () => {
    const reg = registerUser('Test User', 'test@example.com', 'password123')
    expect(reg.user?.email).toBe('test@example.com')

    const login = loginUser('test@example.com', 'password123')
    expect(login.user?.email).toBe('test@example.com')
    expect(getSession()?.email).toBe('test@example.com')
  })

  it('rejects invalid login', () => {
    registerUser('Test User', 'test@example.com', 'password123')
    const result = loginUser('test@example.com', 'wrongpass')
    expect(result.error).toBe('Invalid email or password.')
  })

  it('rejects duplicate registration', () => {
    registerUser('Test User', 'dup@example.com', 'password123')
    const dup = registerUser('Other', 'dup@example.com', 'password456')
    expect(dup.error).toContain('already exists')
  })

  it('rejects short password on register', () => {
    const result = registerUser('Test', 'short@example.com', 'short')
    expect(result.error).toContain('8 characters')
  })

  it('clears session on logout', () => {
    setSession({ id: '1', name: 'A', email: 'a@b.com' })
    logoutUser()
    expect(getSession()).toBeNull()
  })
})
