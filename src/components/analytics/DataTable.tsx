import type { AnalyticsRecord, RecordStatus } from '@/data/analyticsData'

interface DataTableProps {
  records: AnalyticsRecord[]
  isLoading?: boolean
}

const STATUS_STYLES: Record<RecordStatus, string> = {
  active: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  cancelled: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
}

function formatRevenue(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount / 100)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="animate-pulse border-b border-gray-100 dark:border-gray-700">
          {Array.from({ length: 5 }).map((__, j) => (
            <td key={j} className="px-4 py-4">
              <div className="h-4 rounded bg-gray-200 dark:bg-gray-700" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <p className="text-sm font-medium text-gray-900 dark:text-white">No records found</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Try adjusting your filters or search query.
      </p>
    </div>
  )
}

export function DataTable({ records, isLoading = false }: DataTableProps) {
  return (
    <section
      aria-label="Analytics data table"
      aria-busy={isLoading}
      className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          Recent Records
        </h3>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          {isLoading
            ? 'Loading data…'
            : `${records.length} record${records.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
              {['Name', 'Status', 'Category', 'Date', 'Revenue'].map((col) => (
                <th
                  key={col}
                  scope="col"
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <LoadingRows />
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center">
                  <EmptyState />
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr
                  key={record.id}
                  className="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/30"
                >
                  <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-white">
                    {record.name}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[record.status]}`}
                    >
                      {capitalize(record.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-gray-600 dark:text-gray-400">
                    {capitalize(record.category)}
                  </td>
                  <td className="px-4 py-3.5 text-gray-600 dark:text-gray-400">
                    <time dateTime={record.date}>{formatDate(record.date)}</time>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-white">
                    {formatRevenue(record.revenue)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-gray-100 md:hidden dark:divide-gray-700">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse space-y-2 p-4" aria-hidden="true">
              <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          ))
        ) : records.length === 0 ? (
          <div className="p-8">
            <EmptyState />
          </div>
        ) : (
          records.map((record) => (
            <article key={record.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-gray-900 dark:text-white">{record.name}</p>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[record.status]}`}
                >
                  {capitalize(record.status)}
                </span>
              </div>
              <dl className="mt-2 grid grid-cols-2 gap-1 text-sm">
                <dt className="text-gray-500 dark:text-gray-400">Category</dt>
                <dd className="text-gray-700 dark:text-gray-300">
                  {capitalize(record.category)}
                </dd>
                <dt className="text-gray-500 dark:text-gray-400">Date</dt>
                <dd className="text-gray-700 dark:text-gray-300">
                  <time dateTime={record.date}>{formatDate(record.date)}</time>
                </dd>
                <dt className="text-gray-500 dark:text-gray-400">Revenue</dt>
                <dd className="font-medium text-gray-900 dark:text-white">
                  {formatRevenue(record.revenue)}
                </dd>
              </dl>
            </article>
          ))
        )}
      </div>
    </section>
  )
}
