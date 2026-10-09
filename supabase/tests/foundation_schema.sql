-- Read-only verification queries for the OrbiBound foundation and H1/H2 schema.
-- Run against the authorized project or local Supabase database.

-- 1. Expected application tables: 6
SELECT count(*) AS application_table_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('monitored_assets', 'processing_logs', 'asset_schedules', 'asset_alert_configs', 'alert_history', 'asset_observations');

-- 2. Expected RLS-enabled application tables: 6
SELECT count(*) AS rls_enabled_table_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('monitored_assets', 'processing_logs', 'asset_schedules', 'asset_alert_configs', 'alert_history', 'asset_observations')
  AND c.relrowsecurity;

-- 3. Expected indexes include spatial, schedule, observation, and alert dedupe indexes.
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN ('monitored_assets_geo_boundary_gist_idx', 'asset_schedules_due_idx', 'asset_observations_asset_date_idx', 'alert_history_dedupe_key_uidx')
ORDER BY indexname;

-- 4. Expected trigger function exists.
SELECT proname
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname = 'set_updated_at'
LIMIT 1;

-- 5. Trusted worker RPC execution grants.
SELECT has_function_privilege('anon', 'public.claim_due_asset_schedules(text,integer,interval)', 'EXECUTE') AS anon_can_claim,
       has_function_privilege('authenticated', 'public.claim_due_asset_schedules(text,integer,interval)', 'EXECUTE') AS authenticated_can_claim,
       has_function_privilege('service_role', 'public.claim_due_asset_schedules(text,integer,interval)', 'EXECUTE') AS service_role_can_claim;

-- 6. RLS behavior, constraint rejection, and cascade behavior are executed in
-- authenticated test sessions by the integration test runner; no production
-- data is inserted by this read-only verification file.
