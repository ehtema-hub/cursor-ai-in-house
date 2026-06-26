# Frontend — ShopVerse

React single-page application for the ShopVerse demo: e-commerce, tasks/Kanban, team blog, analytics, profiles, and an in-app QA dashboard.

## Tech Stack

- **React 19** + **TypeScript**
- **Vite 6** — dev server, build, API proxies
- **Tailwind CSS v4** — styling with dark mode
- **Lucide React** — icons

## Getting Started

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Routing uses URL hashes (`#tasks`, `#feed`, etc.).

From repo root: `npm run dev`

### With backend services

| Service | Port | Required for |
|---------|------|----------------|
| [Backend API](../backend/README.md) | 5000 | Tasks, auth, products API |
| [Blog API](../blog-api/README.md) | 5001 | Blog feed (`#feed`) |

Vite proxies (see `vite.config.ts`):

- `/api`, `/health` → `http://localhost:5000`
- `/blog-api` → `http://localhost:5001` (path rewritten to `/`)

### Production build

```bash
npm run build
npm run preview   # serves dist/ with same proxies on :4173
```

## Routes

| Hash | Feature | Auth |
|------|---------|------|
| `#products` | Product catalog (search, filters, pagination) | Public |
| `#profiles` | User profile component demo | Public |
| `#tasks` | Login, registration, Kanban task dashboard | Login required |
| `#feed` | Team blog (live blog API) | Read: public · Write: login + blog token |
| `#analytics` | KPI cards, charts, data table | Public |
| `#qa` | QA quality dashboard | Public |

Register via **Tasks → Sign up**. Main auth uses the backend JWT; blog auth syncs on login/register when the blog API is available.

## Project Structure

```text
frontend/
├── src/
│   ├── app/           # Nav config, route gates
│   ├── components/    # UI (analytics, dashboard, kanban, social, …)
│   ├── context/       # Auth, theme, task dashboard state
│   ├── data/          # Sample/demo data (products, analytics)
│   ├── lib/           # API clients, auth, mappers, blog integration
│   ├── pages/         # Route-level pages
│   └── App.tsx        # Hash routing shell
├── public/
├── vite.config.ts     # Proxies for backend + blog-api
└── package.json
```

### Key libraries (`src/lib/`)

| File | Role |
|------|------|
| `api.ts`, `auth.ts` | Main backend API + session |
| `tasksApi.ts`, `mappers.ts` | Task/project API mapping |
| `blogApi.ts`, `blogAuth.ts`, `blogMappers.ts` | Blog API integration |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |
| `npm run test` | Jest unit tests (`qa-automation/tests/unit/frontend/`) |
| `npm run test:e2e` | Playwright E2E (`qa-automation/tests/e2e/`) |

## Docker

```bash
docker build -t shopverse-frontend .
docker run -p 8080:80 shopverse-frontend
```

See [../backend/README.md](../backend/README.md) for API credentials and seed users.
