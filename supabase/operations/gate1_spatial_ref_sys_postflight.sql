-- Gate 1 production postflight: READ ONLY.
-- Run after the grants-only candidate migration and save the complete output.
-- Expected result: all denied API/public access false; service_role SELECT true;
-- service_role MAINTAIN false; spatial_ref_sys RLS remains unchanged/false.

SELECT
  current_database() AS database_name,
  current_user AS executing_role,
  version() AS postgres_version,
  now() AS verified_at;

SELECT
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'spatial_ref_sys'
LIMIT 1;

SELECT
  has_table_privilege('anon', 'public.spatial_ref_sys', 'SELECT') AS anon_select,
  has_table_privilege('authenticated', 'public.spatial_ref_sys', 'SELECT') AS authenticated_select,
  has_table_privilege('public', 'public.spatial_ref_sys', 'SELECT') AS public_select,
  has_table_privilege('service_role', 'public.spatial_ref_sys', 'SELECT') AS service_role_select,
  has_table_privilege('service_role', 'public.spatial_ref_sys', 'INSERT') AS service_role_insert,
  has_table_privilege('service_role', 'public.spatial_ref_sys', 'UPDATE') AS service_role_update,
  has_table_privilege('service_role', 'public.spatial_ref_sys', 'DELETE') AS service_role_delete,
  has_table_privilege('service_role', 'public.spatial_ref_sys', 'TRUNCATE') AS service_role_truncate,
  has_table_privilege('service_role', 'public.spatial_ref_sys', 'REFERENCES') AS service_role_references,
  has_table_privilege('service_role', 'public.spatial_ref_sys', 'TRIGGER') AS service_role_trigger,
  has_table_privilege('service_role', 'public.spatial_ref_sys', 'MAINTAIN') AS service_role_maintain;

-- Fail closed if the intended grant contract is not active.
DO $$
BEGIN
  IF has_table_privilege('anon', 'public.spatial_ref_sys', 'SELECT')
    OR has_table_privilege('authenticated', 'public.spatial_ref_sys', 'SELECT')
    OR has_table_privilege('public', 'public.spatial_ref_sys', 'SELECT') THEN
    RAISE EXCEPTION 'Gate 1 failure: public/API SELECT remains on spatial_ref_sys';
  END IF;

  IF NOT has_table_privilege('service_role', 'public.spatial_ref_sys', 'SELECT') THEN
    RAISE EXCEPTION 'Gate 1 failure: service_role lost required SELECT';
  END IF;

  IF has_table_privilege('service_role', 'public.spatial_ref_sys', 'MAINTAIN') THEN
    RAISE EXCEPTION 'Gate 1 failure: service_role retains MAINTAIN';
  END IF;
END;
$$;

-- Trusted server-side CRS smoke test. This checks geometry behavior without
-- changing data. Run using the trusted server-side/service connection.
SELECT
  ST_SRID(ST_Transform(ST_SetSRID(ST_MakePoint(67.0011, 24.8607), 4326), 32642)) AS transformed_srid,
  ST_X(ST_Transform(ST_SetSRID(ST_MakePoint(67.0011, 24.8607), 4326), 32642)) AS transformed_x,
  ST_Y(ST_Transform(ST_SetSRID(ST_MakePoint(67.0011, 24.8607), 4326), 32642)) AS transformed_y;
