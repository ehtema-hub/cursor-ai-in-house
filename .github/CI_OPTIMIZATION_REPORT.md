# CI/CD Pipeline — Bottleneck Analysis & Optimizations

Analysis of the original pipeline and changes applied in the optimized workflow.

## Bottlenecks identified

| # | Bottleneck | Impact | Fix applied |
|---|------------|--------|-------------|
| 1 | **Sequential test gate** — `frontend-test` waited on `frontend-build` | ~30s wasted; E2E uses `npm run dev`, not `dist/` | Removed unnecessary `needs:` between build and E2E |
| 2 | **Single monolithic pytest job** | ~90–150s on one runner | **3 parallel shards** (`core`, `support`, `commerce`) |
| 3 | **Playwright `workers: 1` in CI** | E2E ~3–5× slower than necessary | **`workers: 4`** in CI |
| 4 | **No Playwright browser cache** | ~60s `playwright install` every run | **`actions/cache`** on `~/.cache/ms-playwright` |
| 5 | **Security scans absent** | Vulnerabilities reach production | **pip-audit**, **npm audit**, **Bandit SAST**, **CodeQL** (separate workflow) |
| 6 | **No performance gate** | Regressions undetected | **`scripts/ci/performance-test.sh`** — 20 requests, &lt;500ms avg |
| 7 | **Deploy without health check / rollback** | Bad deploys stay live | **Blue-green** composite action + **rollback job** |
| 8 | **No monitoring hooks** | Silent failures in production | **`notify-monitoring.sh`** → `MONITORING_WEBHOOK_URL` secret |
| 9 | **Redundant pip/npm installs** | Partially addressed | `cache: npm` / `cache: pip` on all jobs (already present, extended) |

## Estimated time savings

| Stage | Before (approx.) | After (approx.) | Savings |
|-------|------------------|-----------------|---------|
| Backend tests | 90–150s sequential | 30–50s parallel (3 shards) | **~60–100s** |
| Frontend E2E | 60–120s (1 worker) | 20–40s (4 workers + browser cache) | **~40–80s** |
| Security | 0 (not run) | 30–45s parallel with build | +30s but parallel |
| **Net wall-clock** | ~4–6 min | ~2.5–4 min | **~30–40%** |

## Workflow architecture

```
security-dependencies ──┐
security-sast-bandit ───┤
frontend-build ─────────┤
backend-build ──────────┼──► ci-gate ──► deploy-snapshot ──► deploy-green
frontend-test ──────────┤                                      │
backend-test (×3) ──────┤                              deploy-health-check
performance-test ───────┘                                      │
                                                         rollback (on failure)
```

## Secrets to configure

| Secret | Purpose |
|--------|---------|
| `MONITORING_WEBHOOK_URL` | Datadog, Slack, PagerDuty, or custom webhook |
| `BACKEND_DEPLOY_WEBHOOK` | Optional backend host deploy trigger |

## GitHub environments

Create in **Settings → Environments**:

- `production-green` — inactive slot deploy
- `production` — promoted / live traffic
- `production-rollback` — automated rollback

## Further optimizations (future)

1. **Test impact analysis** — run only shards affected by changed paths (`dorny/paths-filter`)
2. **Docker layer cache** — if moving to container deploys
3. **pytest-xdist** — `pytest -n auto` within shards for finer parallelism
4. **Merge CodeQL into required checks** — enable branch protection on CodeQL + ci-gate
5. **k6 load tests** — replace curl smoke with staged load for realistic perf gates
