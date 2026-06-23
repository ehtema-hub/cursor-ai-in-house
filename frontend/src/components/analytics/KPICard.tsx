import { TrendingDown, TrendingUp, Minus } from 'lucide-react'
import type { KPIMetric } from '@/data/analyticsData'

interface KPICardProps {
  metric: KPIMetric
  isLoading?: boolean
}

const TREND = {
  up: { icon: TrendingUp, className: 'text-emerald-600 dark:text-emerald-400' },
  down: { icon: TrendingDown, className: 'text-red-600 dark:text-red-400' },
  neutral: { icon: Minus, className: 'text-gray-500 dark:text-gray-400' },
} as const

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-3" aria-hidden="true">
      <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-8 w-32 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700" />
    </div>
  )
}

export function KPICard({ metric, isLoading = false }: KPICardProps) {
  const trend = TREND[metric.trend]
  const TrendIcon = trend.icon

  return (
    <article
      aria-busy={isLoading}
      aria-labelledby={isLoading ? undefined : `kpi-${metric.id}-label`}
      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          <p
            id={`kpi-${metric.id}-label`}
            className="text-sm font-medium text-gray-500 dark:text-gray-400"
          >
            {metric.label}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            {metric.value}
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-sm">
            <TrendIcon aria-hidden="true" className={`h-4 w-4 ${trend.className}`} />
            <span className={trend.className}>
              {metric.change > 0 ? '+' : ''}
              {metric.change}%
            </span>
            <span className="text-gray-500 dark:text-gray-400">vs last month</span>
          </p>
        </>
      )}
      {isLoading && <span className="sr-only">Loading {metric.label}</span>}
    </article>
  )
}
