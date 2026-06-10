# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Dynamic Gym** is a full-stack gym management system with two main parts:
- `frontend/` — React 19 + Vite SPA (deployed to Vercel)
- `servidor/` — Node.js Express 5 REST API (deployed to Render)

In production, frontend and backend are separate services. The Express server only serves `frontend/dist` as static files when `NODE_ENV !== "production"` and `frontend/dist` exists locally.

## Commands

### Frontend (`frontend/`)
```
npm run dev       # Vite dev server (http://localhost:5173)
npm run build     # Build to frontend/dist
npm run preview   # Preview production build
npm run lint      # ESLint
```

### Backend (`servidor/`)
```
npm run dev       # nodemon hot-reload
npm start         # Production start
```

No automated tests. Run both servers simultaneously for local development.

## Architecture

### Backend (`servidor/src/`)
- **Entry**: `server.js` → authenticates DB, sets timezone to `America/Argentina/Cordoba`, starts cron, calls `createApp()`, listens on port 3001
- **App factory**: `app.js` — registers helmet, compression, morgan, express.json, cookie-parser, CORS (explicit origin callback, never `*`), mounts `/api`
- **Routes**: `routes/index.js` aggregates all routers; `verificarSuscripcion` middleware is applied here before all operational routes
- **Pattern**: each feature follows `routes/ → controllers/ → services/` — all business logic and SQL lives in services
- **Database**: `database/sequelize.js` — uses `DATABASE_URL` if set (Render), otherwise individual `DB_*` env vars
- **Models**: defined in `models/`; all associations wired in `models/index.js` (imported once at startup in `server.js`)
- **Auth**: `middleware/auth_middleware.js` exports `requireAuth` and `requireRole(...roles)`; JWT Bearer token read from `Authorization` header
- **Subscription guard**: `middleware/suscripcion_middleware.js` — exports `verificarSuscripcion` and `invalidarCacheSuscripcion()`; GET requests always pass; POST/PUT/DELETE return 402 if `bloqueado: true`; 5-min in-memory cache; routes in `RUTAS_SIEMPRE_LIBRES` always pass (auth, suscripcion, ingresos, catalogos, health, consulta)
- **Cron**: `cron/estado_alumno_cron.js` runs every hour to auto-update student statuses
- **Env**: `configuracion_servidor/env.js` centralizes all `process.env` access; crashes on startup in production if required vars are missing

### Frontend (`frontend/src/`)
- **Entry**: `main.jsx` — `QueryClientProvider` → `AuthProvider` → `RouterProvider`
- **Router**: `app/router.jsx` — protected routes use `<ProtectedRoute roles={[...]}>`
- **Auth**: `auth/auth_context.jsx` — `AuthProvider` + `useAuth()` hook; JWT stored in `localStorage` via key from `config/auth_config.js` (`storageKey`); sent as `Authorization: Bearer` via Axios interceptor in `api/http.js`
- **API layer**: `api/` — one file per domain, all using the shared `http` axios instance (`baseURL = VITE_API_URL`, default `http://localhost:3001/api`)
- **Server state**: `@tanstack/react-query`; client in `app/query_client.js`
- **Forms**: `react-hook-form` + `zod` via `@hookform/resolvers`
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite` plugin — no `tailwind.config.js` or separate PostCSS needed
- **Icons**: `lucide-react`

### Data Model (key tables)
```
GymPersona (1) ──── (1) GymAlumno ──── (N) GymFechaDisponible (gym_plan_alumno)
                                              └── (N) GymDiaIngreso
GymCatTipoPlan (1) ─────────────────── (N) GymFechaDisponible
GymPersona (1) ──── (1) GymUsuario ─── (N:N via GymUsuarioRol) GymRol
```
- `gym_alumno_rela_estadoalumno = 1` → student is active
- Plans are stored per payment in `gym_plan_alumno`; a new plan always starts today, never after the current plan's end date

### Roles
- `admin` — full access
- `staff` — limited (payment registration, student list/detail)
- Public routes: `/`, `/kiosk`, `/login`, `/consulta-plan`

## Environment Variables

`servidor/.env` (local):
```
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dynamicgym
DB_USER=postgres
DB_PASS=your_password
JWT_SECRET=your_secret
DB_SSL=false
SEED_SECRET=secret_for_admin_endpoints
CORS_ORIGIN=                        # empty = dev localhost list
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@gmail.com
SMTP_PASS=gmail_app_password
SMTP_FROM=Nombre <your@gmail.com>
```

Production (Render): add `DATABASE_URL`, `DB_SSL=true`, `NODE_ENV=production`, `CORS_ORIGIN=https://your-app.vercel.app`, `JWT_SECRET` (use Render's Generate button), and all SMTP vars.

`frontend/.env` (local):
```
VITE_API_URL=http://localhost:3001/api
```

## API Routes

All prefixed with `/api/`:
- `GET /health` — DB health check (no auth)
- `/auth` — login, logout, me; seed-admin and seed-staff protected by `x-seed-token` header
- `/alumnos` — student list
- `/personas` — person CRUD + student registration
- `/ingresos` — kiosk check-in by DNI (always free, even when subscription expired)
- `/pagos` — payment registration
- `/estadisticas` — revenue and attendance stats
- `/recaudacion` — daily/monthly revenue calendars
- `/catalogos` — lookup tables (plans, document types, etc.)
- `/planes` — plan management
- `/staff` — staff management
- `/admin/usuarios` — user/role management
- `/admin/alumnos` — edit active student plans
- `/suscripcion` — software subscription management; admin routes protected by `x-seed-token`
- `/promociones` — mass email to students; admin only; uses Nodemailer + Gmail SMTP
