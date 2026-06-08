import { useEffect, useMemo, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import {
  KPICard,
  ChartPlaceholder,
  AnalyticsFilters,
  DataTable,
  defaultFilters,
  type FilterState,
} from '@/components/analytics'
import { analyticsRecords, kpiMetrics } from '@/data/analyticsData'

function getInitialDarkMode(): boolean {
  const stored = localStorage.getItem('theme')
  if (stored === 'dark') return true
  if (stored === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function filterRecords(records: typeof analyticsRecords, filters: FilterState) {
  return records.filter((record) => {
    if (
      filters.search &&
      !record.name.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      return false
    }
    if (filters.status !== 'all' && record.status !== filters.status) return false
    if (filters.category !== 'all' && record.category !== filters.category) return false
    if (filters.dateFrom && record.date < filters.dateFrom) return false
    if (filters.dateTo && record.date > filters.dateTo) return false
    return true
  })
}

interface AnalyticsDashboardProps {
  onNavigateAway?: () => void
}

export function AnalyticsDashboard({ onNavigateAway }: AnalyticsDashboardProps) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [isLoading, setIsLoading] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(getInitialDarkMode)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode)
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  const filteredRecords = useMemo(
    () => filterRecords(analyticsRecords, filters),
    [filters],
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 px-4 py-4 backdrop-blur-md dark:border-gray-700 dark:bg-gray-900/80 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
              Analytics Dashboard
            </h1>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              Monitor performance, trends, and key business metrics.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onNavigateAway && (
              <button
                type="button"
                onClick={onNavigateAway}
                className="hidden rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:inline-flex dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                ← Demos
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsDarkMode((prev) => !prev)}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              {isDarkMode ? (
                <Sun aria-hidden="true" className="h-5 w-5" />
              ) : (
                <Moon aria-hidden="true" className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <section aria-labelledby="kpi-heading">
          <h2 id="kpi-heading" className="sr-only">
            Key performance indicators
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpiMetrics.map((metric) => (
              <KPICard key={metric.id} metric={metric} isLoading={isLoading} />
            ))}
          </div>
        </section>

        <section aria-labelledby="charts-heading">
          <h2 id="charts-heading" className="sr-only">
            Charts
          </h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartPlaceholder
              title="Revenue Trend"
              description="Monthly revenue over the last 12 months"
              type="line"
              isLoading={isLoading}
            />
            <ChartPlaceholder
              title="User Growth"
              description="New and returning users per week"
              type="bar"
              isLoading={isLoading}
            />
            <ChartPlaceholder
              title="Traffic Sources"
              description="Breakdown by channel"
              type="pie"
              isLoading={isLoading}
              className="lg:col-span-2"
            />
          </div>
        </section>

        <AnalyticsFilters
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(defaultFilters)}
        />

        <DataTable records={filteredRecords} isLoading={isLoading} />
      </main>
    </div>
  )
}
