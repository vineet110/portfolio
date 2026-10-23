# Backend — Portfolio Studio API

FastAPI backend for the studio portfolio site. MVP scope: a health check and
a contact/enquiry endpoint backed by PostgreSQL.

## Stack

FastAPI · Uvicorn · Pydantic v2 · SQLAlchemy 2.0 · psycopg (PostgreSQL driver) · python-dotenv

## Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

pip install -r requirements.txt

copy .env.example .env         # Windows
# cp .env.example .env         # macOS/Linux
# then edit .env with a real DATABASE_URL
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

- API root: http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- Health check: http://localhost:8000/api/health

## Endpoints

| Method | Path            | Description                        |
|--------|-----------------|------------------------------------|
| GET    | `/api/health`   | Liveness check — `{"status":"ok"}` |
| POST   | `/api/contact`  | Submit a project enquiry           |

## Database

Tables are created automatically on startup (`init_db()` in
`app/db/database.py`) for MVP simplicity. This is fine while the schema only
grows additively; once real migrations are needed, introduce Alembic rather
than hand-rolling migration logic.

Without a reachable `DATABASE_URL`, the app will fail at startup when it
tries to create tables — a local or hosted PostgreSQL instance (e.g. Neon)
is required to run the backend at all in this MVP.

## Environment variables

See `.env.example`:

- `DATABASE_URL` — SQLAlchemy connection string, e.g.
  `postgresql+psycopg://user:pass@localhost:5432/portfolio`
- `ALLOWED_ORIGINS` — comma-separated list of origins allowed by CORS
- `ENVIRONMENT` — `development` or `production`
