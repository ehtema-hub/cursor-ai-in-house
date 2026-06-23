# Cursor AI In-House Module 6

Monorepo with three applications, each in its own directory:

| Application | Directory | Port | Description |
|-------------|-----------|------|-------------|
| **Frontend** | [`frontend/`](./frontend/README.md) | 5173 | React + Vite demo (e-commerce, tasks, Kanban, social, analytics) |
| **Backend API** | [`backend/`](./backend/README.md) | 5000 | Flask task management + customer support API |
| **Blog API** | [`blog-api/`](./blog-api/README.md) | 5001 | Blog REST API with posts, comments, search |

## Quick Start

```bash
# Frontend
npm run dev                    # or: cd frontend && npm install && npm run dev

# Backend
cd backend && source .venv/bin/activate && flask run

# Blog API
cd blog-api && make run
```

## QA & CI

| Tool | Location |
|------|----------|
| QA Suite (DevSecOps) | [`qa-suite/`](./qa-suite/README.md) |
| QA Automation | [`qa-automation/`](./qa-automation/README.md) |
| CI/CD | [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) |

```bash
npm run qa:suite               # Full quality pipeline
npm test                       # Frontend unit tests
npm run test:backend           # Backend integration tests
```

## Repository Layout

```
├── frontend/          # React web application
├── backend/           # Flask API
├── blog-api/          # Blog Flask API
├── qa-suite/          # DevSecOps quality pipeline
├── qa-automation/     # Test automation framework
├── scripts/ci/        # Shared CI scripts
└── .github/           # GitHub Actions workflows
```

Each application has its own README with setup, API docs, and testing details.
