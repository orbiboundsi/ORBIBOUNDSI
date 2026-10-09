# Database overview

Phase 2 applies four migrations in order: `enable_extensions`, `create_monitored_assets`, `create_processing_infrastructure`, and `create_alert_infrastructure`. The H1+H2 readiness migration then adds explicit worker RPC role revokes, the RLS-protected `asset_observations` baseline table, and `warming_up`/`ready` processing states. They enable PostGIS/pgcrypto, create the six application tables, add constraints and indexes, install timestamp triggers, and enable Row-Level Security.

The tenant-owned `monitored_assets` table stores PostGIS polygon AOIs. `processing_logs` records worker attempts, `asset_schedules` controls due processing, `asset_observations` stores de-duplicated valid scenes used for the three-observation warm-up baseline, `asset_alert_configs` stores encrypted destination configuration, and `alert_history` records explainable threshold events.

Authenticated users can access only rows belonging to their own assets. Worker writes are server-only and use the Supabase service role from a protected runtime; that key is never exposed to the browser. The schedule-claim RPC is explicitly denied to `anon` and `authenticated` and granted only to `service_role`. Schema verification queries are in `supabase/tests/foundation_schema.sql`.

Supabase's security advisory reports `public.spatial_ref_sys` as an extension-managed PostGIS table without RLS. The five OrbiBound application tables are RLS-enabled. Enabling RLS on `spatial_ref_sys` is intentionally not automated because it is a shared PostGIS metadata table and the advisory requires an explicit policy decision before applying that change.
