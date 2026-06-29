import { useEffect, useState, type ReactNode } from 'react'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Gauge,
  TestTube2,
  Code2,
  Sparkles,
  XCircle,
  LayoutDashboard,
} from 'lucide-react'

type GateStatus = 'pass' | 'fail' | 'warn' | 'unknown'

interface TestGate {
  status: GateStatus
  passed?: number
  failed?: number
  total?: number
  coverage?: number
}

interface QualityGate {
  name: string
  status: string
  detail: string
  passed: boolean
}

interface QASummary {
  runId: string
  source?: string
  commit: string
  branch: string
  timestamp: string
  overallStatus: GateStatus
  qualityGates?: QualityGate[]
  gates: {
    unit_frontend: TestGate
    ui_e2e?: TestGate
    unit_backend: { status: GateStatus; coverage: number; unit?: object; integration?: object }
    lint: {
      status: GateStatus
      eslintErrors: number
      eslintWarnings: number
      pylintScore: number
      pylintIssues: number
    }
    performance: {
      status: GateStatus
      lighthousePerformance: number
      lighthouseAccessibility: number
      k6P95Ms: number | null
      k6AvgMs?: number | null
      k6ErrorRate?: number | null
    }
    security: {
      status: GateStatus
      zapHigh: number
      zapMedium: number
      zapLow: number
      snykHigh: number
      snykMedium: number
    }
  }
}

interface Recommendation {
  priority: 'critical' | 'high' | 'medium' | 'low'
  category: string
  title: string
  detail: string
  impact: string
}

interface RecommendationsPayload {
  generatedAt: string
  overallStatus: GateStatus
  recommendationCount: number
  recommendations: Recommendation[]
}

const statusStyles: Record<GateStatus, string> = {
  pass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  fail: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
  warn: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  unknown: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
}

function normalizeStatus(status: string): GateStatus {
  if (status === 'pass' || status === 'fail' || status === 'warn') return status
  return 'unknown'
}

function StatusBadge({ status }: { status: GateStatus }) {
  const Icon = status === 'pass' ? CheckCircle2 : status === 'fail' ? XCircle : AlertTriangle
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase ${statusStyles[status]}`}>
      <Icon className="h-3.5 w-3.5" />
      {status}
    </span>
  )
}

function MetricCard({
  title,
  icon: Icon,
  status,
  children,
}: {
  title: string
  icon: typeof Activity
  status: GateStatus
  children: ReactNode
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-indigo-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
        </div>
        <StatusBadge status={status} />
      </div>
      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">{children}</div>
    </div>
  )
}

function GateCard({ gate }: { gate: QualityGate }) {
  const status = normalizeStatus(gate.status)
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{gate.name}</h3>
        <StatusBadge status={status} />
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300">{gate.detail}</p>
    </div>
  )
}

const priorityColors = {
  critical: 'border-l-red-500 bg-red-50 dark:bg-red-950/30',
  high: 'border-l-orange-500 bg-orange-50 dark:bg-orange-950/30',
  medium: 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/30',
  low: 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/30',
}

interface QADashboardProps {
  onNavigateAway?: () => void
}

export function QADashboard({ onNavigateAway }: QADashboardProps) {
  const [summary, setSummary] = useState<QASummary | null>(null)
  const [recommendations, setRecommendations] = useState<RecommendationsPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [summaryRes, recsRes] = await Promise.all([
          fetch('/qa/summary.json'),
          fetch('/qa/recommendations.json'),
        ])
        if (summaryRes.ok) setSummary(await summaryRes.json())
        if (recsRes.ok) setRecommendations(await recsRes.json())
        if (!summaryRes.ok) {
          setError('No QA data yet — run `npm run qa:suite` or `npm run qa` first.')
        }
      } catch {
        setError('Failed to load QA dashboard data.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const frontend = summary?.gates.unit_frontend
  const uiE2e = summary?.gates.ui_e2e
  const showJestCounts = (frontend?.total ?? 0) > 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 px-4 py-4 backdrop-blur-md dark:border-gray-700 dark:bg-gray-900/80 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
              QA Quality Dashboard
            </h1>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              Quality gates, test results, lint, security, and performance.
            </p>
          </div>
          {onNavigateAway && (
            <button
              type="button"
              onClick={onNavigateAway}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              ← Demos
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        {loading && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading QA reports…</p>
        )}
        {error && !summary && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            {error}
          </div>
        )}

        {summary && (
          <>
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
              <StatusBadge status={summary.overallStatus} />
              {summary.source && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Source: <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">{summary.source}</code>
                </span>
              )}
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Branch <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">{summary.branch}</code>
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Commit <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">{summary.commit}</code>
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(summary.timestamp).toLocaleString()}
              </span>
            </div>

            {summary.qualityGates && summary.qualityGates.length > 0 && (
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <LayoutDashboard className="h-5 w-5 text-indigo-500" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Quality Gates
                  </h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {summary.qualityGates.map((gate) => (
                    <GateCard key={gate.name} gate={gate} />
                  ))}
                </div>
              </section>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {uiE2e && (uiE2e.total ?? 0) > 0 && (
                <MetricCard title="UI / E2E (Playwright)" icon={TestTube2} status={uiE2e.status}>
                  <p>{uiE2e.passed}/{uiE2e.total} tests passed</p>
                  {(uiE2e.failed ?? 0) > 0 && (
                    <p className="text-red-600 dark:text-red-400">{uiE2e.failed} failed</p>
                  )}
                </MetricCard>
              )}

              <MetricCard
                title={showJestCounts ? 'Frontend (Jest)' : 'Frontend Coverage'}
                icon={TestTube2}
                status={frontend?.status ?? 'unknown'}
              >
                {showJestCounts ? (
                  <p>{frontend?.passed}/{frontend?.total} unit tests passed</p>
                ) : (
                  <p>Run Jest via QA pipeline for per-test counts</p>
                )}
                <p>Coverage: {frontend?.coverage ?? 0}%</p>
              </MetricCard>

              <MetricCard title="Backend (pytest)" icon={TestTube2} status={summary.gates.unit_backend.status}>
                <p>Coverage: {summary.gates.unit_backend.coverage}%</p>
                {summary.gates.unit_backend.integration && (
                  <p className="text-xs text-gray-500">
                    Integration: {(summary.gates.unit_backend.integration as { coveragePercent?: number }).coveragePercent ?? 'n/a'}%
                  </p>
                )}
              </MetricCard>

              <MetricCard title="Code Quality" icon={Code2} status={summary.gates.lint.status}>
                <p>ESLint: {summary.gates.lint.eslintErrors} errors, {summary.gates.lint.eslintWarnings} warnings</p>
                <p>Pylint: {summary.gates.lint.pylintScore}/10</p>
              </MetricCard>

              <MetricCard title="Performance" icon={Gauge} status={summary.gates.performance.status}>
                {summary.gates.performance.lighthousePerformance > 0 && (
                  <p>Lighthouse perf: {summary.gates.performance.lighthousePerformance}/100</p>
                )}
                {summary.gates.performance.lighthouseAccessibility > 0 && (
                  <p>Lighthouse a11y: {summary.gates.performance.lighthouseAccessibility}/100</p>
                )}
                {summary.gates.performance.k6P95Ms != null && (
                  <p>k6 p95: {Math.round(summary.gates.performance.k6P95Ms)}ms</p>
                )}
                {summary.gates.performance.k6AvgMs != null && (
                  <p>k6 avg: {summary.gates.performance.k6AvgMs.toFixed(1)}ms</p>
                )}
                {summary.gates.performance.k6ErrorRate != null && (
                  <p>k6 errors: {(summary.gates.performance.k6ErrorRate * 100).toFixed(2)}%</p>
                )}
              </MetricCard>

              <MetricCard title="Security" icon={Shield} status={summary.gates.security.status}>
                <p>ZAP: {summary.gates.security.zapHigh} high, {summary.gates.security.zapMedium} medium</p>
                <p>Snyk: {summary.gates.security.snykHigh} high, {summary.gates.security.snykMedium} medium</p>
              </MetricCard>

              <MetricCard title="CI Run" icon={Activity} status={summary.overallStatus}>
                <p>Run ID: {summary.runId}</p>
                <p>Tools: Jest, pytest, Playwright, ESLint, Pylint, k6, ZAP, Snyk</p>
              </MetricCard>
            </div>
          </>
        )}

        {recommendations && recommendations.recommendations.length > 0 && (
          <section>
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Improvement Recommendations
              </h2>
              <span className="text-sm text-gray-500">({recommendations.recommendationCount})</span>
            </div>
            <div className="space-y-3">
              {recommendations.recommendations.map((rec) => (
                <article
                  key={rec.title}
                  className={`rounded-lg border-l-4 p-4 ${priorityColors[rec.priority]}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase text-gray-500">{rec.priority}</span>
                    <span className="text-xs text-gray-400">· {rec.category}</span>
                  </div>
                  <h3 className="mt-1 font-semibold text-gray-900 dark:text-white">{rec.title}</h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{rec.detail}</p>
                  <p className="mt-2 text-xs italic text-gray-500 dark:text-gray-400">Impact: {rec.impact}</p>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
