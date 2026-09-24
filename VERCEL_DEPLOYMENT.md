# Vercel deployment

The Next.js frontend and FastAPI backend are deployed from the repository root.
Vercel routes `/` to Next.js and `/api/*` to `api/index.py`, which exposes the
existing backend without changing its endpoint paths.

## Required production environment variables

- `DATABASE_URL`: persistent PostgreSQL connection string (include SSL settings
  required by the database provider). SQLite is rejected on Vercel because its
  filesystem is ephemeral and would lose bookings and accounts.
- `SECRET_KEY`: a long, unique random value used to sign authentication tokens.

Set optional secrets such as `GEMINI_API_KEY`, `MEILI_URL`, `MEILI_MASTER_KEY`,
and `ADMIN_API_KEY` in Vercel Project Settings → Environment Variables. Do not
commit real secrets or put private keys in `NEXT_PUBLIC_*` variables.

Leave `NEXT_PUBLIC_API_URL` unset in Vercel; the browser uses same-origin `/api`
requests. For local development it continues to use `http://localhost:8000`.

The in-process APScheduler is disabled on Vercel Functions; scheduled parsing
and cleanup require a durable worker or an external cron trigger.
