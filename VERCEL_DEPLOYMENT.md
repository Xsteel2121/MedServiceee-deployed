# Production deployment

Vercel hosts **only the Next.js frontend**. Do not put the patient API, symptom
messages, authentication or PostgreSQL in Vercel Functions or a foreign region.
See [the Kazakhstan API deployment guide](deploy/kz/README.md) for the FastAPI,
PostgreSQL and HTTPS stack hosted in Kazakhstan.

1. Deploy the Kazakhstan backend and verify `/api/health` and `/api/clinics`.
2. Add `app.your-domain.kz` to the Vercel frontend and point
   `api.your-domain.kz` at the Kazakhstan server. Using subdomains of the same
   site allows the API's `SameSite=Lax` authentication cookie to work.
3. In the Vercel frontend's Production environment set
   `NEXT_PUBLIC_API_URL=https://api.your-domain.kz` and redeploy. This is a
   public URL, not a secret. Do not add `DATABASE_URL`, `SECRET_KEY`, patient
   data or private API keys to Vercel.
4. On the Kazakhstan backend set `CORS_ORIGINS=https://app.your-domain.kz`.
   Allow only exact trusted origins. Confirm browser registration, login,
   profile, catalog and chat end-to-end before public launch.

The catalog contains one source-verified clinic and three physicians. The
clinic's appointment calendar is not integrated, so no slots or online
reservations are invented; the booking control links to its official site.
There are no invented ratings, promo codes or paid subscriptions. A payment
provider, clinic-approved offers, live availability, map SDK keys and review
of overseas AI processing are separate launch prerequisites for those features.
