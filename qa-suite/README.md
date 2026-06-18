# QA Suite — DevSecOps Quality & Security Pipeline

Enterprise-grade automated QA ecosystem with strict quality gates before production.

## Architecture

```text
qa-suite/
├── config/              # Thresholds, Playwright config, environment
├── ui-tests/            # Playwright POM framework
├── code-quality/        # ESLint, Pylint, cyclomatic complexity
├── security/            # OWASP ZAP + Snyk
├── performance/         # k6 load tests with ramp-up
├── reporting/           # HTML dashboard generator
├── run_qa_suite.sh      # Master pipeline script
└── README.md
```

## Quality Gates

| Gate | Threshold | Fail Condition |
|------|-----------|----------------|
| Code coverage | ≥ 80% | Frontend unit coverage below 80% |
| Cyclomatic complexity | ≤ 10 | ESLint `complexity` or radon CC violations |
| Critical vulnerabilities | 0 | Any Snyk or ZAP critical finding |
| UI / E2E tests | 100% pass | Any Playwright failure |
| Performance (k6) | avg < 500ms, errors < 1% | KPI breach under load |

## Dependencies

### Required

- **Node.js 20+** — frontend build, ESLint, Playwright, Jest
- **Python 3.12+** — Pylint, radon, report generation
- **npm ci** — install project dependencies

### Optional (recommended)

- **Docker** — OWASP ZAP baseline scanner container
- **k6** — `brew install k6` or [k6.io](https://k6.io/docs/get-started/installation/)
- **Snyk CLI** — `npm install -g snyk` + `SNYK_TOKEN` env var

## Setup

```bash
# Install dependencies
npm ci
cd backend && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt -r requirements-qa.txt
pip install radon pylint

# Configure environment
cp qa-suite/config/env.example qa-suite/config/.env.qa
# Edit SNYK_TOKEN, URLs as needed
source qa-suite/config/.env.qa
```

## Running the Pipeline

### Full master pipeline

```bash
bash qa-suite/run_qa_suite.sh
# or
npm run qa:suite
```

Pipeline order: **Linting → Security → UI Tests → Performance → Dashboard**

Exit code `0` = all gates passed. Non-zero = blocked from production.

### Individual modules

```bash
# Code quality only
bash qa-suite/code-quality/run-lint.sh

# Security only (requires preview on :4173)
npm run build && npm run preview -- --port 4173 &
bash qa-suite/security/run-security.sh

# UI tests only (Playwright POM)
bash qa-suite/ui-tests/run-ui-tests.sh

# Performance only (requires API on :5000)
cd backend && gunicorn --bind 127.0.0.1:5000 "run:app" &
bash qa-suite/performance/run-k6.sh

# Regenerate dashboard from existing reports
python3 qa-suite/reporting/generate-dashboard.py
```

## Docker — OWASP ZAP

```bash
# Manual ZAP baseline scan
docker run --rm --network host \
  -v "$(pwd)/qa-suite/reporting/output/security:/zap/wrk:rw" \
  ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py -t http://127.0.0.1:4173 \
  -J /zap/wrk/zap-report.json -r /zap/wrk/zap-report.html
```

## UI Test Framework (POM)

```
ui-tests/
├── base/BasePage.ts       # Shared waits, locators, assertions
├── pages/
│   ├── LoginPage.ts
│   ├── DashboardPage.ts
│   └── RegisterPage.ts
├── fixtures/test-data.ts
└── specs/
    ├── login.spec.ts
    ├── dashboard.spec.ts
    └── task-workflow.spec.ts
```

## Reports

| Output | Path |
|--------|------|
| HTML Dashboard | `qa-suite/reporting/output/dashboard.html` |
| JSON Summary | `qa-suite/reporting/output/summary.json` |
| UI test report | `qa-suite/reporting/output/ui-tests/` |
| Security | `qa-suite/reporting/output/security/` |
| Performance | `qa-suite/reporting/output/performance/` |

Open dashboard: `open qa-suite/reporting/output/dashboard.html`

In-app dashboard: `http://localhost:5173/#qa`

## CI Integration

GitHub Actions workflow: `.github/workflows/qa-suite.yml`

## Configuration

Central thresholds: `qa-suite/config/thresholds.json`

```json
{
  "coverage": { "minimumPercent": 80 },
  "complexity": { "maxCyclomatic": 10 },
  "security": { "maxCritical": 0 },
  "performance": { "maxAvgResponseMs": 500, "maxErrorRate": 0.01 }
}
```
