# OrbiBound Worker

The worker is a **run-once** process. A managed scheduler should invoke `pnpm --filter @orbibound-ai/worker start` every 15 minutes.

## Contract

- Each invocation claims at most `WORKER_MAX_ASSETS` due assets (default `50`).
- The claim RPC uses a configurable stale-lock threshold (default `30` minutes).
- Due assets in `pending`, `warming_up`, `ready`, `complete`, and `failed` states are eligible for processing.
- Each asset is processed independently; one asset failure does not abort the rest of the claimed batch.
- The process exits with status `0` after a successful bounded run, including an empty queue.
- Infrastructure/configuration failure exits non-zero and should be retried by the managed scheduler.

## Environment

```bash
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
STAC_API_URL=https://earth-search.aws.element84.com/v1/search
STAC_COLLECTION=sentinel-2-l2a
WORKER_ID=worker-production-1
WORKER_MAX_ASSETS=50
WORKER_STALE_AFTER_MINUTES=30
```

The service-role key is server-side only and must never be committed or printed.

## Managed scheduler settings

- Frequency: every 15 minutes
- Invocation: `pnpm --filter @orbibound-ai/worker start`
- Concurrency: do not allow overlapping invocations when the platform exposes this setting
- Retry: retry non-zero invocations with the platform's bounded retry policy
- Timeout: greater than the expected maximum batch duration, but bounded by the deployment platform

The Supabase claim function remains the authoritative concurrency boundary through row locks and `SKIP LOCKED`, so overlapping invocations are still safe against duplicate schedule claims.

## Operations

A successful invocation emits a structured `worker_run_finished` summary with worker ID, run ID, claimed/completed/failed/skipped counts, timestamps, and duration. A top-level infrastructure failure emits `worker_run_failed` and exits non-zero.

For a failed asset, inspect its processing log and retry on the next scheduled run. Manual replay should be performed by making the asset schedule due through an approved operational workflow; do not modify locks directly in production.
