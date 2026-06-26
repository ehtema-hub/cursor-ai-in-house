# QA Automation Framework

Structured quality assurance for the monorepo.

```
qa-automation/
├── tests/
│   ├── unit/               # Jest (frontend) + pytest (backend)
│   ├── integration/        # API integration pytest suites
│   ├── e2e/               # Playwright end-to-end tests
│   └── performance/       # API smoke tests
├── quality/
│   ├── eslint.config.js   # Frontend linting
│   ├── pylint.rc          # Backend linting
│   ├── run-eslint.sh      # ESLint → reports/output/lint/
│   ├── run-pylint.sh      # Pylint → reports/output/lint/
│   ├── run-lighthouse.sh  # Lighthouse CI → reports/output/lighthouse/
│   └── sonar-project.properties
├── security/
│   ├── zap-config.yaml    # OWASP ZAP configuration
│   ├── snyk.config        # Snyk configuration
│   └── security-scan.sh   # Security scanning script
├── performance/
│   ├── lighthouse.config.js
│   ├── k6-load-test.js
│   └── performance-thresholds.json
├── reports/
│   ├── generate-report.py
│   ├── dashboard.html
│   └── output/            # Generated reports (gitignored)
└── scripts/
    ├── run-all-qa.sh
    └── analyze-results.py
```

## Quick start

```bash
# Full QA suite
bash qa-automation/scripts/run-all-qa.sh
# or
npm run qa

# Individual suites
npm test                                          # Jest unit tests
bash qa-automation/tests/unit/backend/run-unit.sh
bash qa-automation/tests/integration/run-integration.sh
npm run test:e2e                                  # Playwright
bash qa-automation/quality/run-eslint.sh          # ESLint only
bash qa-automation/quality/run-pylint.sh          # Pylint only (uses backend/.venv)
bash qa-automation/quality/run-lighthouse.sh    # Lighthouse only
bash qa-automation/security/security-scan.sh
```

## Dashboard

- **Static HTML:** `qa-automation/reports/dashboard.html`
- **In-app:** `http://localhost:5173/#qa`
- **Data:** `qa-automation/reports/output/summary.json`

## CI

GitHub Actions workflow `.github/workflows/qa.yml` runs all framework checks in parallel.

## Secrets

| Secret | Purpose |
|--------|---------|
| `SNYK_TOKEN` | Snyk vulnerability scanning |
| `SLACK_WEBHOOK_URL` | Failure notifications |
