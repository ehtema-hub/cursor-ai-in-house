import http from 'k6/http'
import { check, sleep } from 'k6'

const BASE_URL = __ENV.API_URL || 'http://127.0.0.1:5000'
const MAX_AVG_MS = Number(__ENV.MAX_AVG_MS || 500)
const MAX_ERROR_RATE = Number(__ENV.MAX_ERROR_RATE || 0.01)

// Ramp-up load profile (VUs scale over time)
export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 20 },
    { duration: '30s', target: 30 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: [`avg<${MAX_AVG_MS}`],
    http_req_failed: [`rate<${MAX_ERROR_RATE}`],
    checks: ['rate>0.99'],
  },
}

export default function () {
  const health = http.get(`${BASE_URL}/health`)
  check(health, {
    'health 200': (r) => r.status === 200,
    'health body': (r) => r.body && r.body.includes('ok'),
  })

  const products = http.get(`${BASE_URL}/api/products`)
  check(products, {
    'products 200': (r) => r.status === 200,
  })

  sleep(0.25)
}

export function handleSummary(data) {
  const avg = data.metrics.http_req_duration?.values?.avg ?? 0
  const p95 = data.metrics.http_req_duration?.values?.['p(95)'] ?? 0
  const failedRate = data.metrics.http_req_failed?.values?.rate ?? 0
  const summary = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    metrics: {
      avgMs: avg,
      p95Ms: p95,
      errorRate: failedRate,
      iterations: data.metrics.iterations?.values?.count ?? 0,
    },
    thresholds: {
      maxAvgMs: MAX_AVG_MS,
      maxErrorRate: MAX_ERROR_RATE,
    },
    passed: avg < MAX_AVG_MS && failedRate < MAX_ERROR_RATE,
  }
  return {
    'qa-suite/reporting/output/performance/k6-summary.json': JSON.stringify(summary, null, 2),
    stdout: [
      'k6 load test complete',
      `  avg: ${avg.toFixed(2)}ms (target <${MAX_AVG_MS}ms)`,
      `  p95: ${p95.toFixed(2)}ms`,
      `  error rate: ${(failedRate * 100).toFixed(2)}% (target <${MAX_ERROR_RATE * 100}%)`,
      `  gate: ${summary.passed ? 'PASS' : 'FAIL'}`,
    ].join('\n'),
  }
}
