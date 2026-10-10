# Worker Operations Runbook

## Runtime contract

OrbiBound's worker is a bounded run-once process. A managed scheduler invokes it every 15 minutes:

```bash
pnpm --filter @orbibound-ai/worker start
```

A successful empty queue is a healthy no-op. A top-level configuration, Supabase, or claim failure exits non-zero so the managed scheduler can retry.

## Required server-side configuration

```text
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
STAC_API_URL
STAC_COLLECTION
WORKER_ID
WORKER_MAX_ASSETS
WORKER_STALE_AFTER_MINUTES
```

Never place `SUPABASE_SERVICE_ROLE_KEY` in client variables, commits, logs, or alert payloads.

## Scheduling policy

- Frequency: 15 minutes
- Invocation mode: managed scheduled invocation
- Maximum batch: 50 assets by default
- Stale lock recovery: 30 minutes by default
- Overlap: disable overlapping invocations when the scheduler provides that option
- Retry: use bounded platform retry for non-zero process exits

The database claim RPC is still authoritative. It uses row-level locking and `SKIP LOCKED`, so overlapping invocations cannot claim the same due schedule simultaneously.

## Run evidence

Every successful run emits `worker_run_finished` with:

- `runId`
- `workerId`
- start/end timestamps
- duration
- claimed count
- completed count
- failed count
- skipped count

Infrastructure failures emit `worker_run_failed` and return a non-zero exit status.

## Failure handling

### Failed asset

1. Inspect the asset's latest `processing_logs` row.
2. Check `error_code`, `error_message`, and schedule lock fields.
3. Confirm the next run is scheduled and the lock is cleared.
4. Allow the next managed invocation to retry.

### Stale lock

Do not edit lock fields manually in production. The claim RPC treats locks older than `WORKER_STALE_AFTER_MINUTES` as reclaimable.

### Scheduler failure

1. Check the managed scheduler execution history.
2. Check the worker exit status and structured run event.
3. Retry the invocation once through the platform's bounded retry mechanism.
4. If failures repeat, disable further retries temporarily and preserve the error evidence before changing configuration.

## Release smoke test

Use one safe due asset and verify:

1. The scheduler invokes the worker.
2. The worker claims the asset once.
3. Processing logs contain started and terminal entries.
4. The schedule lock is released.
5. The next run is scheduled with jitter.
6. A failure remains explainable and retryable.
7. No secret appears in logs.
