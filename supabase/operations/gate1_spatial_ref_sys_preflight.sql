-- Gate 1 production preflight: READ ONLY.
-- Run this script before any migration and save the complete output.
-- It must be executed with an administrative/read-capable connection.
-- Do not run this file through the application API.

SELECT
  current_database() AS database_name,
  current_user AS executing_role,
  version() AS postgres_version,
  current_setting('server_version_num') AS server_version_num,
  now() AS captured_at;

SELECT
  n.nspname AS schema_name,
  c.relname AS object_name,
  r.rolname AS owner,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced,
  obj_description(c.oid, 'pg_class') AS object_description
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_roles r ON r.oid = c.relowner
WHERE n.nspname = 'public'
  AND c.relname = 'spatial_ref_sys'
LIMIT 1;

SELECT
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'spatial_ref_sys'
ORDER BY grantee, privilege_type
LIMIT 100;

SELECT
  has_table_privilege('anon', 'public.spatial_ref_sys', 'SELECT') AS anon_select,
  has_table_privilege('authenticated', 'public.spatial_ref_sys', 'SELECT') AS authenticated_select,
  has_table_privilege('public', 'public.spatial_ref_sys', 'SELECT') AS public_select,
  has_table_privilege('service_role', 'public.spatial_ref_sys', 'SELECT') AS service_role_select,
  has_table_privilege('service_role', 'public.spatial_ref_sys', 'MAINTAIN') AS service_role_maintain;

SELECT
  d.defaclnamespace::regnamespace AS schema_name,
  d.defaclobjtype,
  d.defaclacl::text AS default_acl
FROM pg_default_acl d
WHERE d.defaclnamespace = 'public'::regnamespace
ORDER BY d.defaclobjtype, d.defaclacl::text
LIMIT 100;

SELECT
  p.oid::regprocedure AS function_signature,
  r.rolname AS owner,
  p.prosecdef AS security_definer,
  p.proconfig,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_execute,
  has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_role_execute,
  pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
JOIN pg_roles r ON r.oid = p.proowner
WHERE n.nspname = 'public'
  AND (
    p.proname = 'rls_auto_enable'
    OR p.proname = 'st_estimatedextent'
  )
ORDER BY p.oid::regprocedure::text
LIMIT 20;

SELECT
  evtname,
  evtenabled,
  evtevent,
  evttags
FROM pg_event_trigger
WHERE evtname = 'ensure_rls'
LIMIT 1;
