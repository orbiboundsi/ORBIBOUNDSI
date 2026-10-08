# Development workflow

Each phase is planned first and implemented only after explicit user approval. Work is performed on a feature branch, validated locally, reviewed, and then synchronized to `main` in `orbiboundsi/ORBIBOUNDSI`.

For every code or schema change, the corresponding Supabase migration or local database verification must be run and recorded. The completed commit must be pushed to GitHub, and both Supabase and GitHub targets must be verified before completion is reported. Credentials, service-role keys, tokens, and webhook secrets must never enter source control or logs.

The default checks are `pnpm typecheck`, `pnpm lint`, and `pnpm test`. New packages must use strict TypeScript and include tests appropriate to their responsibility.
