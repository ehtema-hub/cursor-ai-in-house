# Frontend — ShopVerse / TaskFlow Demo

React demo application built with TypeScript, Vite, and Tailwind CSS v4.

## Tech Stack

- **React 19** + **TypeScript**
- **Vite 6** — dev server and build tooling
- **Tailwind CSS v4** — utility-first styling with dark mode
- **Lucide React** — icons
- **Playwright** — end-to-end testing (see `../qa-automation/tests/e2e/` and `../qa-suite/ui-tests/`)

## Getting Started

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The app uses hash-based routing.

From repo root:

```bash
npm run dev
```

### Production build

```bash
npm run build
npm run preview
```

## App Routes

| Route | Feature | Auth |
|-------|---------|------|
| `#products` | Product catalog with search, filters, pagination | Public |
| `#profiles` | User profile component showcase | Public |
| `#feed` | Social media feed | Public |
| `#tasks` | Login / registration / task dashboard | Login required |
| `#analytics` | KPI cards, charts, data table | Public |
| `#qa` | QA quality dashboard | Public |

## Project Structure

```
frontend/
├── src/
│   ├── components/    # UI components (analytics, dashboard, kanban, social, …)
│   ├── context/       # Auth, theme, task dashboard state
│   ├── data/          # Mock/sample data
│   ├── lib/           # Auth, validation, utilities
│   ├── pages/         # Route-level pages
│   └── App.tsx        # Hash routing
├── public/
├── index.html
├── vite.config.ts
├── Dockerfile         # nginx production image
└── package.json
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check and production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |
| `npm run test` | Jest unit tests |
| `npm run test:e2e` | Playwright E2E tests |

## Docker

```bash
docker build -t shopverse-frontend .
docker run -p 8080:80 shopverse-frontend
```

## Demo Credentials

Register via **Tasks → Sign up**. Auth data is stored in browser `localStorage`.

For backend API credentials, see [../backend/README.md](../backend/README.md).
