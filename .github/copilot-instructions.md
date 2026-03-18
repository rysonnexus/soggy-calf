# Copilot Instructions — The Soggy Calf

## Project Overview

"The Soggy Calf" is a DnD campaign management web app.

- Players and a Dungeon Master (DM) log in with a 4-digit PIN
- The DM creates and manages player accounts via an admin panel
- Monorepo with npm workspaces: `frontend/` and `backend/`
- **Language: JavaScript only** — no TypeScript, no `.ts` files, no type annotations anywhere

## Tech Stack

### Frontend

- React 18, Vite 8, React Router v6
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin
- Font Awesome (`@fortawesome/react-fontawesome` + svg-core + free-solid + free-brands)
- Vitest + React Testing Library for tests

### Backend

- Node.js + Express 4
- Prisma 5 + PostgreSQL
- bcrypt v6 (12 rounds prod, 1 round test), jsonwebtoken, cookie-parser
- express-rate-limit (skip in `NODE_ENV=test`)
- Jest + Supertest for tests

## Tailwind CSS v4 Rules

- **Always** use `@import "tailwindcss";` — never the v3 directives (`@tailwind base` etc.)
- Custom theme colors are defined in `frontend/src/index.css` under `@theme {}` as CSS custom properties:
  ```css
  @theme {
    --color-tavern-dark: #1a1208;
    --color-tavern-brown: #3d2b1f;
    --color-tavern-amber: #c8922a;
    --color-tavern-gold: #f0c040;
    --color-tavern-parchment: #f5e6c8;
    --color-tavern-muted: #8b7355;
    --font-display: Georgia, serif;
  }
  ```
- Use `var(--color-tavern-amber)` in CSS; use arbitrary values like `bg-[var(--color-tavern-amber)]` in JSX classNames
- **No** `tailwind.config.js` — **No** `postcss.config.js`

## Auth Model

- 4-digit numeric PIN stored as bcrypt hash
- JWT access token: 15 min lifetime, includes `jti` (random nonce via `crypto.randomBytes(8)`)
- httpOnly refresh cookie: 7 days, refresh token rotation on every use
- Roles: `DM` and `PLAYER` (Prisma enum)
- `mustChangePIN: true` on all new accounts; enforced by frontend router
- Account lockout after 5 failed login attempts (30 min)
- Rate limiters on login and globally — always add `skip: () => process.env.NODE_ENV === 'test'`

## Key Architecture Patterns

### Frontend

- All API calls go through `src/services/api.js` — never use raw `fetch` directly
- Auth state (user, accessToken) lives in `AuthContext` — access token is **in-memory only**, never localStorage
- Use the `useAuth()` hook to read auth state in components
- `AuthContext` is exported as a named export so tests can use `AuthContext.Provider` directly
- Routes use `PrivateRoute` (requires auth) and `AdminRoute` (requires DM role) wrappers

### Backend

- Single shared `PrismaClient` instance exported from `src/services/authService.js` as `prisma`
- **Never** instantiate a new `PrismaClient` — always import `{ prisma }` from `authService`
- Middleware chain: `requireAuth` (JWT verify → attaches `req.user`) then `requireDM` (role check)
- Centralized error handling via `src/middleware/errorHandler.js`

## Prisma Schema Key Points

- `User` model: `username` (unique), `pinHash`, `role` (DM/PLAYER enum), `isLocked`, `lockedUntil`, `failedAttempts`, `mustChangePIN`, `createdById` (self-relation to DM who created them)
- `RefreshToken` model: `token` (unique), `userId` (FK cascade delete), `expiresAt`, `revoked`
- Run `npx prisma generate` after any schema change
- Seed script: `backend/prisma/seed.js` — creates DM (`username: 'dm'`, PIN `0000`, `mustChangePIN: true`), idempotent

## Git Conventions

- Branches: `main` (production) → `develop` (integration) → `feature/short-name`
- **Never** commit directly to `main` — always PR into `develop` first
- Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`
- PRs always target `develop`

## What to Avoid

- No TypeScript — keep everything `.js` / `.jsx`
- No raw `fetch` — use the `api` service wrapper
- No second `PrismaClient` instantiation
- No Tailwind v3 `@apply` with custom color names — use CSS variables
- No `console.log` in committed code
- No rate limiter calls that hit during `NODE_ENV=test` tests

## Running the Project

```bash
# Install all workspace deps from root
npm install

# Dev (from root)
npm run dev                  # runs frontend + backend concurrently

# Individual
cd frontend && npm run dev   # Vite dev server on :5173
cd backend && npm run dev    # Express on :3001

# Tests
cd backend && npm test       # Jest + Supertest (18 tests)
cd frontend && npm test      # Vitest (7 tests)

# Database
cd backend && npx prisma migrate dev   # apply migrations in dev
cd backend && npx prisma generate      # regenerate client after schema change
cd backend && node prisma/seed.js      # seed DM account

# Build
cd frontend && npm run build  # production Vite build
```

## Docker

- `docker-compose.yml` — dev with hot reload and bind mounts
- `docker-compose.prod.yml` — production with built images and nginx
- Backend container runs `npx prisma migrate deploy && npm run dev` on start
