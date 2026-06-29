import { filterAnalyticsRecords, recordMatchesFilters } from '@/lib/analyticsFilters'
import { defaultFilters } from '@/components/analytics'
import type { AnalyticsRecord } from '@/data/analyticsData'

const records: AnalyticsRecord[] = [
  {
    id: '1',
    name: 'Alpha Report',
    status: 'active',
    category: 'electronics',
    date: '2026-06-01',
    revenue: 100,
  },
  {
    id: '2',
    name: 'Beta Summary',
    status: 'pending',
    category: 'software',
    date: '2026-05-01',
    revenue: 50,
  },
]

describe('analyticsFilters', () => {
  it('filters by search, status, category, and date range', () => {
    expect(recordMatchesFilters(records[0], defaultFilters)).toBe(true)

    expect(
      recordMatchesFilters(records[0], { ...defaultFilters, search: 'beta' }),
    ).toBe(false)

    expect(
      recordMatchesFilters(records[1], { ...defaultFilters, status: 'pending' }),
    ).toBe(true)

    expect(
      recordMatchesFilters(records[0], { ...defaultFilters, category: 'electronics' }),
    ).toBe(true)

    expect(
      recordMatchesFilters(records[1], { ...defaultFilters, dateFrom: '2026-06-01' }),
    ).toBe(false)

    const filtered = filterAnalyticsRecords(records, {
      ...defaultFilters,
      search: 'alpha',
    })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].name).toContain('Alpha')
  })
})
