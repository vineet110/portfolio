# Portfolio — Digital Product Studio

A portfolio site for a premium digital product studio: a React frontend and
a FastAPI backend, deployed together as one Vercel project.

**Live**: https://port-front-lake.vercel.app

```
portfolio/
├── frontend/   — React + TypeScript + Vite + Tailwind + Framer Motion
├── backend/    — FastAPI + SQLAlchemy + PostgreSQL (Neon)
├── vercel.json — defines the frontend/backend as two Vercel Services on one domain
└── docs/       — goal.md (long-term vision) & memory.md (current state)
```

Project documentation is the source of truth:

- **`docs/goal.md`** — long-term vision and constraints. Changes rarely.
- **`docs/memory.md`** — current state: architecture, endpoints, decisions,
  pending work. Read this first when picking work back up.

## Run locally

**Frontend** — http://localhost:5173

```bash
cd frontend
npm install
npm run dev
```

**Backend** — http://localhost:8000 (Swagger at `/docs`)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
copy .env.example .env         # Windows, then edit with a real DATABASE_URL
uvicorn app.main:app --reload --port 8000
```

The backend requires a reachable PostgreSQL database (local or managed, e.g.
Neon) — it creates its own tables on startup. See `backend/README.md` for
details.

Locally, the frontend talks to the backend via `VITE_API_URL` (defaults to
`http://localhost:8000` — see `frontend/.env.example`). In production the
two are same-origin (see "Deploy" below), so this variable is empty there.

## Test

```bash
cd frontend
npm run build           # must pass before deploying
npm run test:ui          # Playwright UI/visual QA suite
```

## Deploy

The project is deployed as a single Vercel project (`portfolio-c0d8/port-front`)
using [Vercel Services](https://vercel.com/docs/services): `vercel.json` at
the repo root defines a `frontend` service and a `backend` service on one
shared domain, with `/api/*` routed to the backend and everything else to
the frontend. Run these from the **repository root**, not from `frontend/`:

```bash
vercel            # preview deployment
vercel --prod     # production deployment (only after preview looks right)
```

Optional: `vercel dev` runs both services together locally through the same
Services routing (useful for testing the production-like same-origin setup
without deploying).

Environment variables live in the Vercel project (Production and Preview),
never in source: `DATABASE_URL` (Neon, pooled connection string),
`ALLOWED_ORIGINS`, `ENVIRONMENT`, `VITE_API_URL` (empty string — same-origin).
Manage them with `vercel env add <NAME> <production|preview>` / `vercel env ls`.

See `docs/memory.md` ("Phase 6A/6B findings") for the full deployment
history, the exact `vercel.json`, and why this path was chosen over Render.

### If you ever need to run the backend outside Vercel

`backend/Procfile` (`uvicorn app.main:app --host 0.0.0.0 --port $PORT`) and
`backend/runtime.txt`/`backend/.python-version` (Python 3.12) document a
standalone deployment path (e.g. Render) that was evaluated but is not the
one currently in use — kept as a documented fallback, not required for the
live deployment above.
