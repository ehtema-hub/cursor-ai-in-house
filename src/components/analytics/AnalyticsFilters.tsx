import { Search, RotateCcw } from 'lucide-react'
import { CATEGORY_OPTIONS, STATUS_OPTIONS } from '@/data/analyticsData'

export interface FilterState {
  search: string
  dateFrom: string
  dateTo: string
  status: string
  category: string
}

export const defaultFilters: FilterState = {
  search: '',
  dateFrom: '',
  dateTo: '',
  status: 'all',
  category: 'all',
}

interface AnalyticsFiltersProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
  onReset: () => void
}

const inputClassName =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white'

export function AnalyticsFilters({ filters, onChange, onReset }: AnalyticsFiltersProps) {
  const update = (partial: Partial<FilterState>) =>
    onChange({ ...filters, ...partial })

  return (
    <section
      aria-label="Data filters"
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-5"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="relative sm:col-span-2 xl:col-span-2">
          <label htmlFor="analytics-search" className="sr-only">
            Search records
          </label>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          />
          <input
            id="analytics-search"
            type="search"
            placeholder="Search by name…"
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            className={`${inputClassName} pl-10`}
          />
        </div>

        <div>
          <label htmlFor="date-from" className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
            From
          </label>
          <input
            id="date-from"
            type="date"
            value={filters.dateFrom}
            onChange={(e) => update({ dateFrom: e.target.value })}
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="date-to" className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
            To
          </label>
          <input
            id="date-to"
            type="date"
            value={filters.dateTo}
            onChange={(e) => update({ dateTo: e.target.value })}
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="status-filter" className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
            Status
          </label>
          <select
            id="status-filter"
            value={filters.status}
            onChange={(e) => update({ status: e.target.value })}
            className={inputClassName}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="category-filter" className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
            Category
          </label>
          <select
            id="category-filter"
            value={filters.category}
            onChange={(e) => update({ category: e.target.value })}
            className={inputClassName}
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:focus:ring-offset-gray-900"
        >
          <RotateCcw aria-hidden="true" className="h-4 w-4" />
          Reset Filters
        </button>
      </div>
    </section>
  )
}
