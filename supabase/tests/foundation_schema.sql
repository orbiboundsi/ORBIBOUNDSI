-- Read-only verification queries for the Phase 2 foundation schema.
-- Run against the authorized project or local Supabase database.
-- Each query should return the expected count/value documented below.

-- 1. Expected tables: 5
SELECT count(*) AS application_table_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('monitored_assets', 'processing_logs', 'asset_schedules', 'asset_alert_configs', 'alert_history');

-- 2. Expected RLS-enabled tables: 5
SELECT count(*) AS rls_enabled_table_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('monitored_assets', 'processing_logs', 'asset_schedules', 'asset_alert_configs', 'alert_history')
  AND c.relrowsecurity;

-- 3. Expected indexes include spatial, schedule and alert dedupe indexes.
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN ('monitored_assets_geo_boundary_gist_idx', 'asset_schedules_due_idx', 'alert_history_dedupe_key_uidx')
ORDER BY indexname;

-- 4. Expected trigger function exists.
SELECT proname
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname = 'set_updated_at'
LIMIT 1;

-- 5. RLS behavior, constraint rejection, and cascade behavior are executed in
-- authenticated test sessions by the integration test runner; no production
-- data is inserted by this read-only verification file.
