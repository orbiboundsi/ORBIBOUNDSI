-- Gate 1 emergency rollback: DESTRUCTIVE SECURITY CHANGE.
-- Do not execute automatically. Requires explicit rollback approval.
-- Use only if the grants-only lockdown causes a verified service outage and
-- after preserving preflight/postflight evidence.
-- This restores the broad pre-candidate table access observed in production;
-- it is intentionally insecure and must be followed by a new remediation plan.

GRANT ALL PRIVILEGES
ON TABLE public.spatial_ref_sys
TO anon, authenticated, PUBLIC, service_role;

-- Verify the rollback state, then open an incident and do not treat this as
-- a launch-ready security baseline.
SELECT
  has_table_privilege('anon', 'public.spatial_ref_sys', 'SELECT') AS anon_select,
  has_table_privilege('authenticated', 'public.spatial_ref_sys', 'SELECT') AS authenticated_select,
  has_table_privilege('public', 'public.spatial_ref_sys', 'SELECT') AS public_select,
  has_table_privilege('service_role', 'public.spatial_ref_sys', 'MAINTAIN') AS service_role_maintain;
