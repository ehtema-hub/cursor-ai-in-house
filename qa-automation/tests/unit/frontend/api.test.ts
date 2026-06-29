import {
  ApiError,
  apiFetch,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from '@/lib/api'

describe('api client', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('stores and clears tokens', () => {
    setTokens('access-token', 'refresh-token')
    expect(getAccessToken()).toBe('access-token')
    expect(getRefreshToken()).toBe('refresh-token')
    clearTokens()
    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
  })

  it('throws ApiError with parsed message on failure', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ message: 'Invalid credentials', code: 'UNAUTHORIZED' }),
    }) as jest.Mock

    await expect(apiFetch('/api/auth/me')).rejects.toMatchObject({
      message: 'Invalid credentials',
      status: 401,
      code: 'UNAUTHORIZED',
    })
  })

  it('returns undefined for 204 responses', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 204,
    }) as jest.Mock

    await expect(apiFetch('/api/tasks/1', { method: 'DELETE' })).resolves.toBeUndefined()
  })

  it('attaches bearer token when authenticated', async () => {
    setTokens('my-token', 'refresh')
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 1 }),
    }) as jest.Mock

    await apiFetch('/api/projects/')

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/projects/',
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    )
    const headers = (global.fetch as jest.Mock).mock.calls[0][1].headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer my-token')
  })

  it('creates ApiError instances', () => {
    const error = new ApiError('failed', 500, 'SERVER_ERROR')
    expect(error.name).toBe('ApiError')
    expect(error.message).toBe('failed')
    expect(error.status).toBe(500)
    expect(error.code).toBe('SERVER_ERROR')
  })
})
