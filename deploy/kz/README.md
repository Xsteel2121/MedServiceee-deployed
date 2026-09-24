# Kazakhstan-hosted production stack

This Compose stack runs **Next.js, FastAPI, PostgreSQL and HTTPS on one server
physically located in Kazakhstan**. Only ports 80/443 are exposed. A `.kz`
website must not point to hosting abroad; see
[KazNIC's domain rules](https://www.nic.kz/ru/doc/reminder-domain-holder).

1. Confirm the provider's **specific server region is Kazakhstan**, not a
   default overseas region. At PS Cloud choose Almaty or Astana.
2. Register `medserviceee.kz` after the registrar confirms its availability.
   Point its A/AAAA record to the Kazakhstan server. Do not proxy it through
   an overseas CDN. Set `SITE_DOMAIN=medserviceee.kz` and
   `CORS_ORIGINS=https://medserviceee.kz`.
3. Create `deploy/kz/.env` from `.env.example`, replace every placeholder,
   keep it out of Git, and restrict file access. Use independent random secrets.
   The password in `DATABASE_URL` must be the same as `DB_PASSWORD` and URL-safe.
4. From `deploy/kz`, run `docker compose --env-file .env up -d --build`.
   Allow inbound TCP 80/443 for Caddy HTTPS; do not expose PostgreSQL or 8000.
5. Verify `https://medserviceee.kz/`, `/api/health` and `/api/clinics`.
   The browser uses same-origin `/api` calls. Confirm registration, login,
   profile and chat in a real browser before inviting patients.
6. Configure encrypted PostgreSQL backups and test a restore before accepting
   patient data. Review the privacy notice, consent flow, audit logging,
   retention and cross-border processors with Kazakhstan counsel.

Do not add a Gemini or other overseas AI provider key for patient symptom
messages until data processing and transfer have been reviewed. The local
rule-based triage works without an external key, but it is **not a substitute
for a clinician or a full clinical AI system**. Clinic-owned appointment slots
must be connected before online booking can accept reservations.

For a PS Cloud managed PostgreSQL cluster, remove the `db` service and the
backend's `depends_on: db` block, then point `DATABASE_URL` to its
Kazakhstan-region private endpoint. The web server and cluster must both be
in Kazakhstan.
