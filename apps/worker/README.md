# Worker

Scheduled processing worker for Phase 5/6. It atomically claims due schedules through the Supabase `service_role` connection, fetches Sentinel-2 metadata, resolves Red/NIR assets, reads remote COG windows with HTTP range requests, computes the explainable anomaly score, writes processing metrics, and releases the schedule with success/retry timing. Run once with `pnpm --filter @orbibound-ai/worker start`; an external scheduler should invoke this command every 15 minutes.

The worker must only run server-side. `SUPABASE_SERVICE_ROLE_KEY` is never sent to the browser or committed to Git.
