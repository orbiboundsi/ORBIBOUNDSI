# OrbiBound AI

B2B satellite intelligence for hedge funds and supply-chain operators.

## Current phase

**Phase 1 — GitHub Foundation Structure** establishes the monorepo layout, strict TypeScript baseline, environment contract, documentation, and CI skeleton. Business logic and production schema changes are intentionally deferred to later approved phases.

## Workspace

- `apps/web` — Next.js application (future phase)
- `apps/worker` — scheduled processing worker (future phase)
- `packages/database` — Supabase database client/types (future phase)
- `packages/stac-fetcher` — STAC metadata client (future phase)
- `packages/anomaly-engine` — explainable scoring engine (future phase)
- `supabase` — migrations, seed and database tests
- `docs` — architecture and development workflow

## Development

```bash
pnpm install
pnpm typecheck
pnpm test
```

Do not commit `.env` files or service credentials. Every code change requires Supabase verification and synchronization with `orbiboundsi/ORBIBOUNDSI` before completion is reported.
