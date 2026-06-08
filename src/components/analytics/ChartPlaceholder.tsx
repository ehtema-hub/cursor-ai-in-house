import { BarChart3, LineChart, PieChart } from 'lucide-react'

type ChartType = 'line' | 'bar' | 'pie'

interface ChartPlaceholderProps {
  title: string
  description?: string
  type?: ChartType
  isLoading?: boolean
  className?: string
}

const CHART_ICONS = {
  line: LineChart,
  bar: BarChart3,
  pie: PieChart,
} as const

export function ChartPlaceholder({
  title,
  description,
  type = 'line',
  isLoading = false,
  className = '',
}: ChartPlaceholderProps) {
  const Icon = CHART_ICONS[type]
  const headingId = `chart-${title.replace(/\s/g, '-').toLowerCase()}`

  return (
    <article
      aria-busy={isLoading}
      aria-labelledby={headingId}
      className={`flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 ${className}`}
    >
      <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
        <h3 id={headingId} className="text-base font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        {description && (
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>

      <div className="flex flex-1 items-center justify-center p-6" style={{ minHeight: 220 }}>
        {isLoading ? (
          <div className="w-full animate-pulse space-y-3" aria-hidden="true">
            <div className="flex h-40 items-end justify-between gap-2 px-4">
              {[40, 65, 45, 80, 55, 70, 50].map((h, i) => (
                <div
                  key={i}
                  className="w-full rounded-t bg-gray-200 dark:bg-gray-700"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <span className="sr-only">Loading chart data</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900/30">
              <Icon aria-hidden="true" className="h-8 w-8 text-indigo-400 dark:text-indigo-300" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Chart placeholder — replace with a chart library
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              e.g. Recharts, Chart.js, or Victory
            </p>
          </div>
        )}
      </div>
    </article>
  )
}
