# CI/CD Pipeline — Bottleneck Analysis & Optimizations

Analysis of the original pipeline and optimizations targeting **≥50% wall-clock reduction**.

## Bottlenecks identified

| # | Bottleneck | Impact | Fix applied |
|---|------------|--------|-------------|
| 1 | **Sequential test gate** — E2E waited on frontend build | ~30s wasted | Removed unnecessary `needs:` between build and test |
| 2 | **Single monolithic pytest job** | ~90–150s | **3 parallel shards** (`core`, `support`, `commerce`) |
| 3 | **Single Playwright job** | ~60–120s | **2 parallel shards** (`--shard=1/2`, `--shard=2/2`) + **4 workers** |
| 4 | **No Playwright browser cache** | ~60s install every run | **`actions/cache`** on `~/.cache/ms-playwright` |
| 5 | **Full pipeline on every PR** | Runs unrelated jobs | **`dorny/paths-filter`** skips frontend/backend when unchanged |
| 6 | **Repeated dependency installs** | ~20–40s per job | **npm/pip cache** + reusable **`setup-*-deps`** actions |
| 7 | **No container validation** | Deploy surprises | **Docker build** with **GHA layer cache** + **smoke health checks** |
| 8 | **Weak security coverage** | Vulnerabilities ship | **npm audit**, **Snyk**, **pip-audit**, **Bandit**, **CodeQL** |
| 9 | **Silent CI failures** | Slow incident response | **Slack webhook** on any job failure |
| 10 | **Shallow deploy checks** | Bad releases promoted | **`deploy-health-check.sh`** — HTTP 200, SPA mount, latency |

## Estimated time savings

| Stage | Before (approx.) | After (approx.) | Savings |
|-------|------------------|-----------------|---------|
| Backend tests | 90–150s sequential | 30–50s (3 shards) | **~60–100s** |
| Frontend E2E | 60–120s (1 job) | 20–40s (2 shards × 4 workers) | **~40–80s** |
| Focused PR (path filter) | Full ~4–6 min | ~1.5–3 min | **~50–60%** |
| Docker rebuild | Cold ~3–5 min | Cached ~30–90s | **~60–80%** on cache hit |
| **Net wall-clock (full run)** | ~4–6 min | ~2–3 min | **~50%** |

## Workflow architecture

```
detect-changes ─────────────────────────────────────────────┐
security-npm ─────────────┬─ security-snyk-npm ──────────────┤
security-python ──────────┼─ security-snyk-python ───────────┤
security-sast-bandit ─────┤                                  │
docker-build (×2, GHA cache) ──► docker-smoke ────────────────┤
frontend-build ─────────────┤                                  │
backend-build ──────────────┤                                  ├──► ci-gate ──► deploy
frontend-test (×2 shards) ──┤                                  │                    │
backend-test (×3 shards) ───┤                                  │           deploy-health-check
performance-test ───────────┘                                  │                    │
                                                         notify-slack (on failure)
```

## Secrets to configure

| Secret | Purpose |
|--------|---------|
| `SLACK_WEBHOOK_URL` | Slack incoming webhook for CI failure alerts |
| `SNYK_TOKEN` | Snyk API token (scans skipped if unset) |
| `MONITORING_WEBHOOK_URL` | Datadog / PagerDuty / custom deploy events |

## GitHub environments

- `production-green` — inactive slot deploy
- `production` — promoted / live traffic
- `production-rollback` — automated rollback

## Docker images

| Image | Dockerfile | Health endpoint |
|-------|------------|-----------------|
| Frontend | `Dockerfile` | `GET /health` (nginx) |
| Backend | `backend/Dockerfile` | `GET /health` (Flask) |

Build locally:

```bash
docker build -t cursor-frontend:ci .
docker build -t cursor-backend:ci -f backend/Dockerfile backend/
```

## Further optimizations

1. **pytest-xdist** — `pytest -n auto` within shards
2. **Test impact analysis** — finer-grained path → shard mapping
3. **k6 load tests** — staged load instead of curl smoke
4. **Merge CodeQL** into required branch protection checks
