# Vercel preview and Kazakhstan production

The Vercel project is a **frontend-only build preview** on a `*.vercel.app`
address. Its `/api/*` routes intentionally return 404. It must not be promoted
as a working patient service or assigned `medserviceee.kz`: KazNIC requires
server equipment for `.kz` web resources to be physically in Kazakhstan.
Patient data must not be sent to the preview.

See [the Kazakhstan deployment guide](deploy/kz/README.md) to deploy Next.js,
FastAPI and PostgreSQL together on a PS Cloud server in Almaty or Astana.
Production uses same-origin `/api/*` calls and does not require an external API
URL in the frontend. Do not add database or authentication secrets to Vercel.

The catalog contains one source-verified clinic and three physicians. The
clinic's appointment calendar is not integrated, so no slots or online
reservations are invented; the booking control links to its official site.
There are no invented ratings, promo codes or paid subscriptions. A payment
provider, clinic-approved offers, live availability, map SDK keys and review
of overseas AI processing are separate launch prerequisites for those features.
