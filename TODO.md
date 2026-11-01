# OrbiBound AI — delivery checklist

## Public investor-facing website
- [ ] The public home page is available at `/` and clearly communicates the physical-risk problem, OrbiBound AI product, target customers, explainable anomaly scoring, satellite/STAC pipeline, alerting, and early-access call to action.
- [ ] The public home page uses a dark, responsive OrbiBound AI visual direction with slate surfaces, cyan/teal satellite-signal accents, concise technical messaging, accessible focus states, and reduced-motion behavior.
- [ ] The page avoids fabricated customer logos, traction, accuracy claims, or unsupported performance claims and does not include secrets or private data in browser code.

## Retained application surface
- [ ] The existing authenticated operations overview remains available under `/app`.
- [ ] Existing `/auth/*`, `/assets/new`, API routes, Supabase/PostGIS RLS integration, worker, STAC fetcher, anomaly engine, COG reader, alert service, tests, and migrations remain in the repository and continue to build.
- [ ] Public visitors can view `/` without authentication while `/app` and `/assets/*` remain protected when Supabase credentials are configured.

## Production readiness
- [ ] `manus-routes.json` covers all current page routes, including `/`, `/app`, `/assets/new`, and authentication pages.
- [ ] The project has a production Dockerfile that installs dependencies from the pinned pnpm workspace, builds the Next.js app, and honors `PORT` at runtime.
- [ ] Strict TypeScript diagnostics, workspace tests, lint, and the production build pass without committing credentials.
- [ ] Supabase migration/schema changes are reviewed and verified locally or against the authorized Supabase environment as available; no migration drift is introduced for this frontend-only change.
- [ ] Completed code is synchronized to `orbiboundsi/ORBIBOUNDSI` on `main`, a managed checkpoint is recorded, and the published URL is verified before delivery.
