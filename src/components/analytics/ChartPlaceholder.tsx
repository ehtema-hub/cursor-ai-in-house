import type {
  RevenueTrendPoint,
  TrafficSourcePoint,
  UserGrowthPoint,
} from '@/data/analyticsData'

type ChartType = 'line' | 'bar' | 'pie'

interface ChartPlaceholderProps {
  title: string
  description?: string
  type?: ChartType
  isLoading?: boolean
  className?: string
  data?: RevenueTrendPoint[] | UserGrowthPoint[] | TrafficSourcePoint[]
}

function formatCurrency(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`
  return `$${value}`
}

function LoadingSkeleton() {
  return (
    <div className="w-full animate-pulse space-y-3" aria-hidden="true">
      <div className="flex h-40 items-end justify-between gap-2 px-2">
        {[40, 65, 45, 80, 55, 70, 50, 60, 75, 48].map((h, i) => (
          <div
            key={i}
            className="w-full rounded-t bg-gray-200 dark:bg-gray-700"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <span className="sr-only">Loading chart data</span>
    </div>
  )
}

function RevenueTrendChart({ data }: { data: RevenueTrendPoint[] }) {
  const max = Math.max(...data.map((d) => d.revenue))

  return (
    <div className="w-full" role="img" aria-label="Revenue trend line chart">
      <div className="flex h-44 items-end justify-between gap-1 sm:gap-2">
        {data.map((point) => {
          const height = (point.revenue / max) * 100
          return (
            <div
              key={point.month}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <span className="hidden text-xs font-medium text-gray-500 dark:text-gray-400 sm:block">
                {formatCurrency(point.revenue)}
              </span>
              <div
                className="w-full rounded-t bg-indigo-500 transition-all dark:bg-indigo-400"
                style={{ height: `${height}%`, minHeight: 4 }}
                title={`${point.month}: ${formatCurrency(point.revenue)}`}
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {point.month}
              </span>
            </div>
          )
        })}
      </div>
      <table className="sr-only">
        <caption>Monthly revenue</caption>
        <thead>
          <tr>
            <th>Month</th>
            <th>Revenue</th>
          </tr>
        </thead>
        <tbody>
          {data.map((point) => (
            <tr key={point.month}>
              <td>{point.month}</td>
              <td>{point.revenue}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function UserGrowthChart({ data }: { data: UserGrowthPoint[] }) {
  const max = Math.max(
    ...data.map((d) => d.newUsers + d.returningUsers),
  )

  return (
    <div className="w-full" role="img" aria-label="User growth bar chart">
      <div className="mb-3 flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500" aria-hidden="true" />
          New users
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-indigo-200 dark:bg-indigo-800" aria-hidden="true" />
          Returning
        </span>
      </div>
      <div className="flex h-40 items-end justify-between gap-2 sm:gap-3">
        {data.map((point) => {
          const total = point.newUsers + point.returningUsers
          const totalHeight = (total / max) * 100
          const newHeight = (point.newUsers / total) * 100

          return (
            <div
              key={point.week}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <div
                className="flex w-full flex-col justify-end rounded-t overflow-hidden"
                style={{ height: `${totalHeight}%`, minHeight: 8 }}
                title={`${point.week}: ${point.newUsers} new, ${point.returningUsers} returning`}
              >
                <div
                  className="w-full bg-indigo-200 dark:bg-indigo-800"
                  style={{ height: `${100 - newHeight}%` }}
                />
                <div
                  className="w-full bg-indigo-500 dark:bg-indigo-400"
                  style={{ height: `${newHeight}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {point.week}
              </span>
            </div>
          )
        })}
      </div>
      <table className="sr-only">
        <caption>Weekly user growth</caption>
        <thead>
          <tr>
            <th>Week</th>
            <th>New Users</th>
            <th>Returning Users</th>
          </tr>
        </thead>
        <tbody>
          {data.map((point) => (
            <tr key={point.week}>
              <td>{point.week}</td>
              <td>{point.newUsers}</td>
              <td>{point.returningUsers}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TrafficSourcesChart({ data }: { data: TrafficSourcePoint[] }) {
  return (
    <div className="w-full space-y-4" role="img" aria-label="Traffic sources breakdown">
      <div className="flex h-4 w-full overflow-hidden rounded-full">
        {data.map((source) => (
          <div
            key={source.source}
            className={`${source.color} transition-all`}
            style={{ width: `${source.percentage}%` }}
            title={`${source.source}: ${source.percentage}%`}
          />
        ))}
      </div>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((source) => (
          <li
            key={source.source}
            className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 dark:border-gray-700"
          >
            <span className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <span
                className={`h-3 w-3 shrink-0 rounded-full ${source.color}`}
                aria-hidden="true"
              />
              {source.source}
            </span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {source.percentage}%
            </span>
          </li>
        ))}
      </ul>
      <table className="sr-only">
        <caption>Traffic sources</caption>
        <thead>
          <tr>
            <th>Source</th>
            <th>Percentage</th>
          </tr>
        </thead>
        <tbody>
          {data.map((source) => (
            <tr key={source.source}>
              <td>{source.source}</td>
              <td>{source.percentage}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ChartContent({
  type,
  data,
}: {
  type: ChartType
  data: RevenueTrendPoint[] | UserGrowthPoint[] | TrafficSourcePoint[]
}) {
  if (type === 'line') {
    return <RevenueTrendChart data={data as RevenueTrendPoint[]} />
  }
  if (type === 'bar') {
    return <UserGrowthChart data={data as UserGrowthPoint[]} />
  }
  return <TrafficSourcesChart data={data as TrafficSourcePoint[]} />
}

export function ChartPlaceholder({
  title,
  description,
  type = 'line',
  isLoading = false,
  className = '',
  data = [],
}: ChartPlaceholderProps) {
  const headingId = `chart-${title.replace(/\s/g, '-').toLowerCase()}`
  const hasData = data.length > 0

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

      <div className="flex flex-1 items-center p-5 sm:p-6" style={{ minHeight: 220 }}>
        {isLoading ? (
          <LoadingSkeleton />
        ) : hasData ? (
          <ChartContent type={type} data={data} />
        ) : (
          <p className="w-full text-center text-sm text-gray-500 dark:text-gray-400">
            No chart data available.
          </p>
        )}
      </div>
    </article>
  )
}
