import http from 'k6/http'
import { check, sleep } from 'k6'

const BASE_URL = __ENV.BASE_URL || 'http://127.0.0.1:5000'

// Thresholds loaded from performance-thresholds.json via env overrides
const P95_MS = Number(__ENV.K6_P95_MS || 500)
const VUS = Number(__ENV.K6_VUS || 10)
const DURATION = __ENV.K6_DURATION || '30s'

export const options = {
  vus: VUS,
  duration: DURATION,
  thresholds: {
    http_req_duration: [`p(95)<${P95_MS}`],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
}

export default function () {
  const health = http.get(`${BASE_URL}/health`)
  check(health, {
    'health status 200': (r) => r.status === 200,
    'health body ok': (r) => r.body && r.body.includes('ok'),
  })

  const products = http.get(`${BASE_URL}/api/products/`)
  check(products, {
    'products status 200': (r) => r.status === 200,
  })

  sleep(0.1)
}

export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    metrics: {
      http_req_duration_p95: data.metrics.http_req_duration?.values?.['p(95)'] ?? null,
      http_req_failed_rate: data.metrics.http_req_failed?.values?.rate ?? null,
      iterations: data.metrics.iterations?.values?.count ?? null,
      checks_pass_rate: data.metrics.checks?.values?.rate ?? null,
    },
  }
  const p95 = summary.metrics.http_req_duration_p95
  const failed = summary.metrics.http_req_failed_rate
  return {
    'qa-automation/reports/output/performance/k6-summary.json': JSON.stringify(summary, null, 2),
    stdout: [
      'k6 load test complete',
      `  p95 latency: ${p95?.toFixed(2) ?? 'n/a'}ms`,
      `  failed rate: ${((failed ?? 0) * 100).toFixed(2)}%`,
    ].join('\n'),
  }
}
