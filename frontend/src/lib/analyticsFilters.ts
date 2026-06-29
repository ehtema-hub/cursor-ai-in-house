import type { FilterState } from '@/components/analytics'
import type { analyticsRecords } from '@/data/analyticsData'

type AnalyticsRecord = (typeof analyticsRecords)[number]

function matchesSearch(record: AnalyticsRecord, search: string): boolean {
  if (!search) return true
  return record.name.toLowerCase().includes(search.toLowerCase())
}

function matchesStatus(record: AnalyticsRecord, status: FilterState['status']): boolean {
  return status === 'all' || record.status === status
}

function matchesCategory(record: AnalyticsRecord, category: FilterState['category']): boolean {
  return category === 'all' || record.category === category
}

function matchesDateRange(
  record: AnalyticsRecord,
  dateFrom: string,
  dateTo: string,
): boolean {
  if (dateFrom && record.date < dateFrom) return false
  if (dateTo && record.date > dateTo) return false
  return true
}

export function recordMatchesFilters(
  record: AnalyticsRecord,
  filters: FilterState,
): boolean {
  return (
    matchesSearch(record, filters.search) &&
    matchesStatus(record, filters.status) &&
    matchesCategory(record, filters.category) &&
    matchesDateRange(record, filters.dateFrom, filters.dateTo)
  )
}

export function filterAnalyticsRecords(
  records: AnalyticsRecord[],
  filters: FilterState,
): AnalyticsRecord[] {
  return records.filter((record) => recordMatchesFilters(record, filters))
}
