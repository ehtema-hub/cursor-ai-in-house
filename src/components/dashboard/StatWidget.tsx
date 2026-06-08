import { TrendingDown, TrendingUp, Minus } from 'lucide-react'
import type { DashboardStat } from '@/data/sampleTasks'

interface StatWidgetProps {
  stat: DashboardStat
}

const TREND_CONFIG = {
  up: {
    icon: TrendingUp,
    className: 'text-emerald-700 dark:text-emerald-400',
    label: 'increase',
  },
  down: {
    icon: TrendingDown,
    className: 'text-red-600 dark:text-red-400',
    label: 'decrease',
  },
  neutral: {
    icon: Minus,
    className: 'text-gray-500 dark:text-gray-400',
    label: 'no change',
  },
} as const

export function StatWidget({ stat }: StatWidgetProps) {
  const trend = TREND_CONFIG[stat.trend]
  const TrendIcon = trend.icon

  return (
    <article
      aria-labelledby={`stat-${stat.id}-label`}
      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <p
        id={`stat-${stat.id}-label`}
        className="text-sm font-medium text-gray-500 dark:text-gray-400"
      >
        {stat.label}
      </p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
        {stat.value}
      </p>
      <p className="mt-2 flex items-center gap-1.5 text-sm">
        <TrendIcon aria-hidden="true" className={`h-4 w-4 ${trend.className}`} />
        <span className={trend.className}>
          {stat.change > 0 ? '+' : ''}
          {stat.change}%
        </span>
        <span className="sr-only">{trend.label} from last week</span>
        <span className="text-gray-500 dark:text-gray-400" aria-hidden="true">
          vs last week
        </span>
      </p>
    </article>
  )
}
