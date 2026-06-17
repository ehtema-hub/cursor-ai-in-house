# Cursor AI In-House Module 6

Monorepo with three applications: a React frontend demo, a Flask task/support API, and a standalone blog API.

| Application | Directory | Port | Description |
|-------------|-----------|------|-------------|
| **Frontend** | `.` (root) | 5173 | React demo — e-commerce, tasks, Kanban, social feed, analytics |
| **Backend API** | [`backend/`](./backend/README.md) | 5000 | Task management + customer support ticket system |
| **Blog API** | [`blog-api/`](./blog-api/README.md) | 5001 | Blog platform REST API with posts, comments, and search |

Each application has its own README with setup instructions, API docs, and testing details.

---

# Frontend — ShopVerse / TaskFlow Demo

React demo application built with TypeScript, Vite, and Tailwind CSS v4. Showcases e-commerce UI, user profiles, team task management, analytics, a Kanban board, a social feed, and multi-step registration — with Playwright E2E test coverage.

## Tech Stack

- **React 19** + **TypeScript**
- **Vite 6** — dev server and build tooling
- **Tailwind CSS v4** — utility-first styling with dark mode
- **Lucide React** — icons
- **Playwright** — end-to-end testing
- **Axe (Playwright)** — accessibility checks in tests

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The app uses hash-based routing.

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
| `#feed` | Social media feed (posts, likes, comments) | Public |
| `#tasks` | Login / registration / task dashboard | Login required for dashboard |
| `#analytics` | KPI cards, charts, and data table | Public |

### Task Dashboard (after login)

Accessible via **Tasks** in the top nav. Sidebar sections:

| Section | Description |
|---------|-------------|
| **Dashboard** | Project overview, team avatars, progress charts, activity feed, quick actions |
| **My Tasks** | Filterable task list with create / update / delete |
| **Calendar** | Kanban board (To Do, In Progress, Done) |
| **Team** | Team member profiles and project overview |
| **Settings** | Profile, notifications, privacy, and appearance settings |
| **Analytics** | Links to the analytics page |

## Features

### Authentication
- Email/password login and logout
- **Multi-step registration** (3 steps: personal info → security → terms)
- Session stored in `localStorage`

### E-Commerce
- Product search, category/material filters, price range, sorting, pagination

### Task Management
- Task CRUD with status, priority, due dates, and assignees
- Centralized state via `TaskDashboardContext`
- Stats, project progress, and activity feed derived from live task data

### Kanban Board
- Drag-and-drop between columns (HTML5 DnD)
- Search and filter by priority / assignee
- State persisted in `localStorage`

### Social Feed
- Create posts, like/unlike, comments, infinite scroll placeholder
- Mock team posts with optional images

### Analytics
- KPI cards, chart placeholders (line, bar, pie), filterable data table

### Dark Mode
- Global theme toggle in the **top navbar** (sun/moon icon)
- Persists preference to `localStorage` (`light` / `dark` / `system`)
- Also configurable in Task Dashboard → Settings → Appearance

## Testing

Install Playwright browsers (first time only):

```bash
npx playwright install
```

```bash
# All browsers
npm run test:e2e

# Chromium only (fastest)
npm run test:e2e:chromium

# Interactive UI mode
npm run test:e2e:ui
```

Run a specific suite:

```bash
npx playwright test e2e/multi-step-registration.spec.ts
npx playwright test e2e/product-search.spec.ts
```

### E2E test suites

| File | Coverage |
|------|----------|
| `e2e/accessibility.spec.ts` | Login and register page a11y (axe) |
| `e2e/error-handling.spec.ts` | Auth validation errors |
| `e2e/multi-step-registration.spec.ts` | Registration flow + accessibility (desktop & mobile) |
| `e2e/product-search.spec.ts` | Product search, filters, pagination (desktop & mobile) |
| `e2e/task-workflow.spec.ts` | Task management workflows |
| `e2e/responsive.spec.ts` | Responsive layout checks |

## Project Structure

```
src/
├── components/
│   ├── analytics/     # KPI cards, charts, filters, data table
│   ├── dashboard/     # Task dashboard widgets and views
│   ├── ecommerce/     # ProductCard
│   ├── kanban/        # KanbanBoard, BoardColumn, TaskCard, AddTaskModal
│   ├── layout/        # Navbar, Header
│   ├── profile/       # UserProfile
│   ├── settings/      # SettingsPanel and form controls
│   ├── social/        # Feed, PostCard, CommentSection, CreatePost
│   └── ui/            # Button and other primitives
├── context/
│   ├── AuthContext.tsx
│   ├── TaskDashboardContext.tsx
│   └── ThemeContext.tsx
├── data/              # Mock/sample data
├── lib/               # Auth, validation, and utility helpers
├── pages/             # Route-level page components
├── types/             # Shared TypeScript interfaces
├── App.tsx            # Hash routing and layout
└── main.tsx           # App entry point

e2e/
├── helpers/           # Auth, tasks, registration, product helpers
├── pages/             # Page object models
└── *.spec.ts          # Test suites
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test:e2e` | Run all Playwright tests |
| `npm run test:e2e:chromium` | Run Chromium tests only |
| `npm run test:e2e:ui` | Open Playwright UI mode |

## Demo Credentials

Register a new account via **Tasks → Sign up**, or use any credentials you create during registration. Auth data is stored locally in the browser (`localStorage`).

For the backend support ticket API, see [backend/README.md](./backend/README.md) for server-side seed credentials.
