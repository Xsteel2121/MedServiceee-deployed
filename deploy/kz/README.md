# Kazakhstan-hosted patient API

The public Next.js frontend may be hosted on Vercel. This Compose stack is for
a Kazakhstan-located server only: FastAPI, PostgreSQL and the HTTPS reverse
proxy all run there. The PostgreSQL port is not exposed publicly.

1. Confirm the provider's **specific server region is Kazakhstan**, not a
   default overseas region. At PS Cloud choose Almaty or Astana.
2. Point `api.your-domain.kz` at that server. Put the frontend on
   `app.your-domain.kz` (a custom domain in Vercel). With both subdomains on
   the same site, the existing `SameSite=Lax` authentication cookie works.
3. Create `deploy/kz/.env` from `.env.example`, replace every placeholder,
   keep it out of Git, and restrict file access. Use independent random secrets.
   The password in `DATABASE_URL` must be the same as `DB_PASSWORD` and URL-safe.
4. From `deploy/kz`, run `docker compose --env-file .env up -d --build`.
   Allow inbound TCP 80/443 for Caddy HTTPS; do not expose PostgreSQL or 8000.
5. Verify `https://api.your-domain.kz/api/health` and the clinics endpoint.
   Set `NEXT_PUBLIC_API_URL=https://api.your-domain.kz` in the Vercel frontend
   project and rebuild the frontend. Set `CORS_ORIGINS` to its exact origin.
6. Configure encrypted PostgreSQL backups and test a restore before accepting
   patient data. Review the privacy notice, consent flow, audit logging,
   retention and cross-border processors with Kazakhstan counsel.

Do not add a Gemini or other overseas AI provider key for patient symptom
messages until data processing and transfer have been reviewed. The local
rule-based triage works without an external key, but it is **not a substitute
for a clinician or a full clinical AI system**. Clinic-owned appointment slots
must be connected before online booking can accept reservations.

For a PS Cloud managed PostgreSQL cluster, remove the `db` service and point
`DATABASE_URL` to the provider's Kazakhstan-region private endpoint instead.
The server and cluster must both be in Kazakhstan.
