# Cursor AI In-House Labs

A full-stack demo application for learning modern web development, API design, and DevSecOps quality practices. The monorepo combines a React SPA, a task-management/support API, a blog API, and two complementary QA pipelines.

## What This Application Does

**ShopVerse** is a single-page demo that showcases multiple product areas in one UI:

| Area | Route | Description |
|------|-------|-------------|
| **Products** | `#products` | E-commerce catalog — search, filters, pagination |
| **Profiles** | `#profiles` | User profile component showcase |
| **Tasks** | `#tasks` | Auth, registration, Kanban board, task dashboard |
| **Blog** | `#feed` | Team blog powered by the blog API (posts, comments, categories) |
| **Analytics** | `#analytics` | KPI cards, charts, and data tables |
| **QA** | `#qa` | In-app quality dashboard from CI/QA reports |

The **backend** (`:5000`) powers authentication, projects, tasks, notifications, e-commerce endpoints, and a customer-support ticket system. The **blog API** (`:5001`) is a separate service for blog content; the frontend proxies `/blog-api` to it during development.

## Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│  Frontend (React + Vite)                         :5173        │
│  Hash routing · Tailwind v4 · JWT in localStorage           │
└──────────────┬──────────────────────────┬───────────────────┘
               │ /api, /health           │ /blog-api
               ▼                         ▼
┌──────────────────────────┐  ┌──────────────────────────────┐
│  Backend API (Flask)     │  │  Blog API (Flask)      :5001 │
│  Tasks · Support · Shop  │  │  Posts · Comments · Search   │
│  :5000                   │  └──────────────────────────────┘
└──────────────────────────┘
```

## Applications

| Module | Directory | Port | README |
|--------|-----------|------|--------|
| Frontend | [`frontend/`](./frontend/README.md) | 5173 | React SPA, Vite proxies |
| Backend API | [`backend/`](./backend/README.md) | 5000 | Tasks, support, e-commerce |
| Blog API | [`blog-api/`](./blog-api/README.md) | 5001 | Blog REST API |

## Prerequisites

- **Node.js 20+** and npm
- **Python 3.11+** with venv per Python app
- **Redis** (optional locally — caches fall back; Celery runs in-process in dev)
- **k6**, **Docker** (optional — for QA performance and ZAP scans)

## Local Development

Run all three services for the full experience (tasks + blog):

```bash
# Terminal 1 — Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
flask db upgrade
python run.py

# Terminal 2 — Blog API
cd blog-api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
flask seed
python run.py

# Terminal 3 — Frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Register via **Tasks → Sign up** for the main API; blog auth syncs automatically on login when the blog API is running.

**Tasks-only** (no blog): start backend + frontend. The blog section shows a friendly error if `:5001` is offline.

## Testing & Quality

| Command | What it runs |
|---------|----------------|
| `npm test` | Frontend Jest unit tests |
| `npm run test:backend` | Backend pytest (from `backend/`) |
| `npm run test:integration` | API integration pytest suite |
| `npm run test:e2e` | Playwright E2E (`qa-automation/tests/e2e/`) |
| `npm run qa` | [QA Automation](./qa-automation/README.md) — unit, integration, lint, Lighthouse |
| `npm run qa:suite` | [QA Suite](./qa-suite/README.md) — DevSecOps gates (lint, security, UI, k6) |

| QA module | Purpose |
|-----------|---------|
| [`qa-automation/`](./qa-automation/README.md) | Broad test framework, reports, E2E specs |
| [`qa-suite/`](./qa-suite/README.md) | Strict production gates with HTML dashboard |
| [`.github/workflows/`](./.github/workflows/) | CI/CD (ci.yml, qa.yml, qa-suite.yml) |

## Repository Layout

```text
├── frontend/          # React web application
├── backend/           # Flask task & support API
├── blog-api/          # Flask blog API
├── qa-automation/     # Test automation framework
├── qa-suite/          # DevSecOps quality pipeline
├── scripts/ci/        # Shared CI helper scripts
└── .github/           # GitHub Actions workflows
```

Each module has its own README with setup, API details, and testing instructions.
