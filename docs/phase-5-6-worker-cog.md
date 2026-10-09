# Phase 5 + 6: Worker and COG execution

## Runtime flow

1. `apps/worker/src/main.ts` starts one worker run.
2. `claim_due_asset_schedules` atomically claims up to 50 due assets with `FOR UPDATE SKIP LOCKED`; stale locks older than 30 minutes are reclaimable.
3. `pipeline.ts` searches Earth Search STAC using each asset AOI, resolves Red/NIR with `findBandAsset`, and calls `readCogWindow` directly.
4. `packages/cog-reader` uses GeoTIFF remote sources so the COG reader requests the required IFD/tile ranges instead of downloading the complete object.
5. The worker loads successful historical `processing_logs`, runs `computeRiskScore`, updates the asset, writes success/failure metrics, and schedules the next run with up to three hours of jitter.

## Operational contract

- Run the worker server-side with `SUPABASE_SERVICE_ROLE_KEY`; never expose that key to the web app.
- An external scheduler invokes `pnpm --filter @orbibound-ai/worker start` every 15 minutes.
- Each asset is isolated: one processing failure is recorded and scheduled for retry without stopping later assets.
- The current phase does not send alerts yet; alert threshold evaluation belongs to Phase 7.
- `bytesRead` is retained in the processing contract. A future tile-source instrumentation pass can replace the current reader metric with exact range-byte accounting without changing the worker interface.
