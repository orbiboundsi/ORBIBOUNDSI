-- Gate 1 function review: READ ONLY.
-- No function definitions or grants are changed by this file.
-- PostGIS extension-managed C functions remain untouched.

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
  AND p.proname IN ('rls_auto_enable', 'st_estimatedextent')
ORDER BY p.oid::regprocedure::text
LIMIT 20;

SELECT
  evtname,
  evtenabled,
  evtevent,
  evttags,
  evtfoid::regprocedure AS trigger_function
FROM pg_event_trigger
WHERE evtname = 'ensure_rls'
LIMIT 1;
