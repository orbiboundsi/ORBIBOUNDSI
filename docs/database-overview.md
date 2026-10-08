# Database overview

The approved MVP model uses tenant-owned `monitored_assets` with PostGIS polygon AOIs. `processing_logs` records worker attempts, `asset_schedules` controls due processing, `asset_alert_configs` stores encrypted destination configuration, and `alert_history` records explainable threshold events.

All application tables require Row-Level Security. Authenticated users can access only rows belonging to their own assets. Worker writes are server-only and use the Supabase service role from a protected runtime; that key is never exposed to the browser.

The database migration is intentionally deferred to the approved Database phase. Phase 1 contains only documentation and empty migration/test directories.
