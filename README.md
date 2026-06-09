# React + TypeScript + Vite + Tailwind CSS

A modern React project scaffolded with Vite, TypeScript, and Tailwind CSS v4.

## Getting Started

```bash
npm install
npm run dev
```

# Tests
### Install browsers (first time only)
```bash
npx playwright install
```
### Run all E2E tests (all browsers)
```bash
npm run test:e2e
```
### Chromium only (fastest)
```bash
npm run test:e2e:chromium
```
### Interactive UI mode
```bash
npm run test:e2e:ui
```

###Run specific test folder
```bash
npx playwright test e2e/multi-step-registration.spec.ts
```

## Project Structure

```
src/
├── components/
│   ├── ui/          # Reusable UI primitives (Button, Input, etc.)
│   ├── layout/      # Layout components (Header, Footer, Sidebar, etc.)
│   └── index.ts     # Barrel exports for clean imports
├── App.tsx
├── main.tsx
└── index.css        # Tailwind CSS entry point
```

## Scripts

- `npm run dev` — Start development server
- `npm run build` — Type-check and build for production
- `npm run preview` — Preview production build
- `npm run lint` — Run ESLint
