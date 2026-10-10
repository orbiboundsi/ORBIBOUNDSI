-- Gate 1 post-candidate assertions.
-- Run only against a disposable/staging database after applying the candidate.
-- This file is read-only and intentionally fails if expected least-privilege
-- access is not present.

DO $$
DECLARE
  role_name text;
  privilege_name text;
BEGIN
  FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    FOREACH privilege_name IN ARRAY ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN'] LOOP
      IF has_table_privilege(role_name, 'public.spatial_ref_sys', privilege_name) THEN
        RAISE EXCEPTION 'Gate 1 failure: % retains % on public.spatial_ref_sys', role_name, privilege_name;
      END IF;
    END LOOP;
  END LOOP;

  FOREACH privilege_name IN ARRAY ARRAY['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN'] LOOP
    IF has_table_privilege('service_role', 'public.spatial_ref_sys', privilege_name) THEN
      RAISE EXCEPTION 'Gate 1 failure: service_role retains % on public.spatial_ref_sys', privilege_name;
    END IF;
  END LOOP;

  IF NOT has_table_privilege('service_role', 'public.spatial_ref_sys', 'SELECT') THEN
    RAISE EXCEPTION 'Gate 1 failure: service_role lost SELECT on public.spatial_ref_sys';
  END IF;
END;
$$;

SELECT
  has_table_privilege('anon', 'public.spatial_ref_sys', 'SELECT') AS anon_select,
  has_table_privilege('authenticated', 'public.spatial_ref_sys', 'SELECT') AS authenticated_select,
  has_table_privilege('service_role', 'public.spatial_ref_sys', 'SELECT') AS service_role_select,
  has_table_privilege('service_role', 'public.spatial_ref_sys', 'MAINTAIN') AS service_role_maintain;
