# QA Automation Framework

Broad test automation and reporting for the monorepo. Use this for day-to-day development testing; use [`qa-suite/`](../qa-suite/README.md) for strict DevSecOps gates before release.

| | QA Automation (`npm run qa`) | QA Suite (`npm run qa:suite`) |
|--|---------------------------|-------------------------------|
| **Focus** | Full test matrix + reports | Quality gates (fail = block) |
| **UI tests** | `qa-automation/tests/e2e/` | `qa-suite/ui-tests/` (POM) |
| **Lint** | ESLint + Pylint scripts | ESLint + Pylint + radon + coverage gate |
| **Performance** | Lighthouse (+ k6 if API up) | k6 load test with thresholds |
| **Dashboard** | `qa-automation/reports/` | `qa-suite/reporting/output/` |

## Layout

```text
qa-automation/
├── tests/
│   ├── unit/               # Jest (frontend) + pytest (backend)
│   ├── integration/        # API integration pytest
│   ├── e2e/                # Playwright end-to-end tests
├── quality/
│   ├── eslint.config.js
│   ├── pylint.rc
│   ├── run-eslint.sh       # → reports/output/lint/
│   ├── run-pylint.sh
│   ├── run-lighthouse.sh   # → reports/output/lighthouse/
│   └── sonar-project.properties  # Optional SonarQube config
├── security/
│   ├── zap-config.yaml
│   ├── snyk.config
│   └── security-scan.sh
├── performance/
│   ├── lighthouse.config.js
│   ├── k6-load-test.js
│   └── performance-thresholds.json
├── reports/
│   ├── generate-report.py
│   ├── dashboard.html
│   └── output/             # Generated (gitignored)
└── scripts/
    ├── run-all-qa.sh       # Master runner
    └── analyze-results.py
```

## Quick Start

```bash
# Full automation run (unit + integration + lint + lighthouse + reports)
npm run qa
# or
bash qa-automation/scripts/run-all-qa.sh
```

### Individual suites

```bash
npm test                                              # Jest (frontend)
bash qa-automation/tests/unit/backend/run-unit.sh
bash qa-automation/tests/integration/run-integration.sh
npm run test:e2e                                      # Playwright E2E
bash qa-automation/quality/run-eslint.sh
bash qa-automation/quality/run-pylint.sh              # Uses backend/.venv
bash qa-automation/quality/run-lighthouse.sh
bash qa-automation/security/security-scan.sh          # Needs preview on :4173
```

### Root npm shortcuts

| Command | Script |
|---------|--------|
| `npm run test:backend` | `backend/run-tests.sh` |
| `npm run test:integration` | Integration pytest |
| `npm run qa` | `run-all-qa.sh` |

## Pipeline Order (`run-all-qa.sh`)

1. Unit tests (Jest + pytest)
2. Integration pytest
3. ESLint + Pylint
4. Lighthouse (builds frontend)
5. k6 (if backend on `:5000`)
6. Security scan (if preview on `:4173` or `:5173`)
7. Report generation + analysis

## Dashboard

- **Static HTML:** `qa-automation/reports/dashboard.html`
- **In-app:** `http://localhost:5173/#qa`
- **Data:** `qa-automation/reports/output/summary.json`

## CI

GitHub Actions: [`.github/workflows/qa.yml`](../.github/workflows/qa.yml)

## Secrets

| Secret | Purpose |
|--------|---------|
| `SNYK_TOKEN` | Snyk vulnerability scanning |
| `SLACK_WEBHOOK_URL` | Failure notifications |

## Notes

- Lint scripts use **quoted paths** so repos in directories with spaces (e.g. `Cursor Labs`) work correctly.
- Pylint requires the backend virtualenv (`backend/.venv`).
