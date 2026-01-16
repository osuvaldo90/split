# Technology Stack

**Analysis Date:** 2025-01-16

## Languages

**Primary:**
- TypeScript 5.9.3 - All application code (frontend + backend)

**Secondary:**
- CSS - Tailwind utility classes only (`src/index.css`)

## Runtime

**Environment:**
- Node.js 24.10.0 (verified via `node --version`)
- ES Modules (`"type": "module"` in package.json)

**Package Manager:**
- npm (lockfile: `package-lock.json` present)

## Frameworks

**Core:**
- React 19.2.3 - UI rendering
- React Router DOM 7.12.0 - Client-side routing
- Convex 1.31.4 - Backend-as-a-service (database, real-time sync, serverless functions)

**Testing:**
- Vitest 4.0.17 - Unit and integration tests
- Playwright 1.57.0 - End-to-end tests
- convex-test 0.0.41 - Convex backend mocking

**Build/Dev:**
- Vite 7.3.1 - Build tool and dev server
- @vitejs/plugin-react 5.1.2 - React integration for Vite

**Styling:**
- Tailwind CSS 4.1.18 - Utility-first CSS
- @tailwindcss/vite 4.1.18 - Vite plugin for Tailwind
- PostCSS 8.5.6 - CSS processing
- Autoprefixer 10.4.23 - Vendor prefix handling

## Key Dependencies

**Critical:**
- `convex` 1.31.4 - Entire backend (database, real-time, functions)
- `react` 19.2.3 - UI framework
- `@anthropic-ai/sdk` 0.71.2 - Receipt OCR via Claude Vision API

**Infrastructure:**
- `@vercel/analytics` 1.6.1 - Production analytics
- `@edge-runtime/vm` 5.0.0 - Edge runtime for tests

## Configuration

**TypeScript:**
- `tsconfig.json` - Frontend config (ES2020, strict mode, React JSX)
- `convex/tsconfig.json` - Backend config (ESNext, isolated modules)

**Vite:**
- `vite.config.ts` - Plugins: React, Tailwind
- Dev server: `localhost:5173`

**Testing:**
- `vitest.config.ts` - Edge runtime environment, convex-test integration
- `playwright.config.ts` - Chromium, HTML reporter, auto-start dev server

**Deployment:**
- `vercel.json` - SPA rewrite rules (`/* -> /index.html`)

## Environment Variables

**Required for Frontend:**
- `VITE_CONVEX_URL` - Convex deployment URL

**Required for Backend (Convex Actions):**
- `ANTHROPIC_API_KEY` - Claude API key for receipt parsing

## Scripts

```bash
npm run dev          # Start Vite dev server
npm run build        # TypeScript check + Vite build
npm run lint         # ESLint
npm run test         # Vitest (unit/integration)
npm run test:watch   # Vitest watch mode
npm run test:e2e     # Playwright E2E tests
npm run test:e2e:ui  # Playwright UI mode
npm run test:all     # All tests (unit + E2E)
npm run preview      # Preview production build
```

## Platform Requirements

**Development:**
- Node.js 24.x
- npm
- Convex CLI (`npx convex dev` for local development)

**Production:**
- Vercel (frontend hosting)
- Convex Cloud (backend hosting)

## Build Output

- `dist/` - Vite production build output
- `dist/assets/` - Bundled JS/CSS

---

*Stack analysis: 2025-01-16*
