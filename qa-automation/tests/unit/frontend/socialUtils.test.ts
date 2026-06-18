import { formatCount, formatRelativeTime } from '@/lib/socialUtils'

describe('formatCount', () => {
  it('formats thousands', () => {
    expect(formatCount(1500)).toBe('1.5K')
    expect(formatCount(1000)).toBe('1K')
  })

  it('formats millions', () => {
    expect(formatCount(2_500_000)).toBe('2.5M')
  })

  it('returns plain number below 1000', () => {
    expect(formatCount(42)).toBe('42')
  })
})

describe('formatRelativeTime', () => {
  it('returns Just now for recent timestamps', () => {
    const now = new Date().toISOString()
    expect(formatRelativeTime(now)).toBe('Just now')
  })

  it('returns minutes ago', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    expect(formatRelativeTime(fiveMinAgo)).toBe('5m ago')
  })
})
