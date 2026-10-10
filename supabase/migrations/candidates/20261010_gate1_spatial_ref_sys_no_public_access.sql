-- Gate 1 candidate only: do not apply to production until staging approval.
-- Purpose: remove inherited/public access to PostGIS metadata while preserving
-- trusted server-side CRS lookup for the worker/service role.
-- This candidate intentionally does not enable RLS on the extension-managed table
-- and does not alter PostGIS C functions.

REVOKE ALL PRIVILEGES
ON TABLE public.spatial_ref_sys
FROM anon, authenticated, PUBLIC, service_role;

GRANT SELECT
ON TABLE public.spatial_ref_sys
TO service_role;

-- Expected access after apply:
--   anon: no table privileges
--   authenticated: no table privileges
--   PUBLIC: no inherited table privileges
--   service_role: SELECT only
