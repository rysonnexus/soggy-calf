# The Soggy Calf — DnD Campaign App

## Stack

- **Frontend**: React + Vite + Tailwind CSS + Font Awesome
- **Backend**: Node.js + Express + Prisma + PostgreSQL
- **Auth**: 4-digit PIN, bcrypt, JWT (15 min access token) + httpOnly refresh cookie (7 days)
- **Infrastructure**: Docker Compose (dev + prod)
- **Git**: `main` (production) + `develop` (integration) + `feature/*` branches

---

## Quick Start (Development)

### Prerequisites

- Docker Desktop installed and running
- Node.js 20+ (for local frontend/backend development)

### 1. Clone and configure

```bash
git clone <repo-url> soggy-calf
cd soggy-calf
cp .env.example .env
# Edit .env — set DB_PASSWORD and JWT_SECRET
```

### 2. Start Docker-backed PostgreSQL

```bash
npm run db:up
```

PostgreSQL is exposed on `localhost:55432` so it does not conflict with existing PostgreSQL listeners commonly found on `5432` or `5433`.

### 3. Run the app locally

```bash
cd backend
npx prisma migrate dev
npm run seed
npm run dev

# in a second terminal
cd frontend
npm run dev
```

### 4. Optional: run the full stack in Docker

```bash
docker compose up --build
```

Services:
| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3001 |
| PostgreSQL | localhost:55432 |

### 5. Seed the database (first run, if you use full Docker)

```bash
docker compose exec backend npm run seed
```

This creates the initial Dungeon Master account:

- **Username**: `dm`
- **PIN**: `0000`
- You will be forced to change the PIN on first login.

---

## Local Development (without Docker)

### Backend

```bash
npm run db:up
cd backend
cp ../.env.example .env
npm install
npx prisma migrate dev
npm run seed
npm run dev
```

The backend expects Docker-backed PostgreSQL at `localhost:55432` during local development.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Git Workflow

### Branch Strategy

```
main          ← production-ready, tagged releases only
  └─ develop  ← integration branch, PRs merge here
       └─ feature/my-feature   ← all work starts here
       └─ fix/bug-description
       └─ release/v1.1.0       ← cut from develop, merge to main + develop
```

### Daily workflow

```bash
# Start a new feature
git checkout develop && git pull
git checkout -b feature/my-feature

# Commit with Conventional Commits
git commit -m "feat: add campaign creation form"
git commit -m "fix: correct token refresh expiry"
git commit -m "chore: update dependencies"

# Push and create PR targeting develop
git push -u origin feature/my-feature
```

### Releasing to production

```bash
git checkout develop && git pull
git checkout -b release/v1.0.0
# Bump version in package.json files
git commit -m "chore: release v1.0.0"
git checkout main && git merge --no-ff release/v1.0.0
git tag v1.0.0
git push origin main --tags
git checkout develop && git merge --no-ff release/v1.0.0
git branch -d release/v1.0.0
```

---

## Environment Variables

See `.env.example` for all required variables.

| Variable             | Description                                               |
| -------------------- | --------------------------------------------------------- |
| `DATABASE_URL`       | PostgreSQL connection string                              |
| `JWT_SECRET`         | Secret for signing access tokens (32+ chars)              |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens (32+ chars)             |
| `PORT`               | Backend port (default: 3001)                              |
| `FRONTEND_URL`       | Frontend origin for CORS (default: http://localhost:5173) |
| `NODE_ENV`           | `development` or `production`                             |
| `DB_PASSWORD`        | PostgreSQL password for the Docker dev database           |

---

## Project Structure

```
soggy-calf/
├── frontend/                  # React + Vite app
│   └── src/
│       ├── pages/             # Login, admin/Players, player/Dashboard
│       ├── components/        # Shared UI components
│       ├── context/           # AuthContext
│       ├── hooks/             # useAuth
│       ├── services/          # api.js (fetch wrapper)
│       └── utils/             # validators, constants
├── backend/                   # Express + Prisma API
│   └── src/
│       ├── routes/            # auth.js, admin.js
│       ├── middleware/        # auth.js (JWT + RBAC)
│       ├── services/          # authService.js
│       └── index.js
│   └── prisma/
│       ├── schema.prisma
│       └── seed.js
├── docker-compose.yml         # Development
├── docker-compose.prod.yml    # Production
└── .env.example
```

---

## Roles

| Role           | Capabilities                                         |
| -------------- | ---------------------------------------------------- |
| **DM (Admin)** | Create/manage players, manage campaigns, full access |
| **Player**     | View own campaigns and character sheet               |
