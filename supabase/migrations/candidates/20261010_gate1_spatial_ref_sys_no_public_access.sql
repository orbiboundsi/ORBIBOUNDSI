-- Gate 1 candidate only: do not apply to production until staging approval.
-- Target compatibility: PostgreSQL 17 / PostGIS 3.3.x.
-- Purpose: remove inherited/public access to PostGIS metadata while preserving
-- trusted server-side CRS lookup for the service role.
-- REVOKE ALL covers PostgreSQL table privileges including MAINTAIN where
-- supported by the target PostgreSQL version.
-- This candidate intentionally does not enable RLS on the extension-managed table
-- and does not alter PostGIS C functions.

REVOKE ALL PRIVILEGES
ON TABLE public.spatial_ref_sys
FROM anon, authenticated, PUBLIC, service_role;

GRANT SELECT
ON TABLE public.spatial_ref_sys
TO service_role;

-- Expected access after apply:
--   anon: no table privileges, including MAINTAIN
--   authenticated: no table privileges, including MAINTAIN
--   PUBLIC: no inherited table privileges, including SELECT/MAINTAIN
--   service_role: SELECT only; no INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER/MAINTAIN
