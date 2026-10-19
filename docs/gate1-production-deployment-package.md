# Gate 1 — Production Deployment and Verification Package

**Status:** Prepared only; not executed.  
**Target:** `ORBIBOUNDSI production` (`thrgxznmblxtlzbicsrk`)  
**Change class:** Security-sensitive database privilege change.  
**Current production state:** `spatial_ref_sys` has RLS disabled and broad API/public access.  
**Safety rule:** No step in this package runs automatically. Production execution requires a separate explicit approval after review of the preflight output.

## Scope

This package addresses only the `public.spatial_ref_sys` table access contract:

```text
anon: no access
authenticated: no access
PUBLIC: no inherited access
service_role: SELECT only
service_role MAINTAIN: denied
```

It intentionally does **not**:

- enable RLS on the extension-managed `spatial_ref_sys` table;
- force RLS on that table;
- alter or replace PostGIS C functions;
- change `st_estimatedextent` definitions;
- change `rls_auto_enable()` grants;
- change public-schema default privileges;
- change OrbiBound application-table policies.

Those are separate review and validation workstreams.

## Files

1. `supabase/operations/gate1_spatial_ref_sys_preflight.sql`
2. `supabase/migrations/candidates/20261010_gate1_spatial_ref_sys_no_public_access.sql`
3. `supabase/operations/gate1_spatial_ref_sys_postflight.sql`
4. `supabase/operations/gate1_security_definer_review.sql`
5. `supabase/operations/gate1_spatial_ref_sys_rollback.sql`
6. `supabase/tests/gate1_spatial_ref_sys_privileges.sql`

The candidate migration is stored outside the normal numbered migration directory so it cannot be mistaken for an already-approved production migration.

## Controlled execution sequence

### Phase 0 — Preconditions

- Confirm the target project is `thrgxznmblxtlzbicsrk`.
- Confirm a maintenance/change window.
- Confirm a recent database backup or provider-supported recovery point.
- Confirm the worker/API can tolerate a short metadata-read interruption.
- Confirm an administrator can execute DDL/grant statements.
- Record the current GitHub commit and this package version.

### Phase 1 — Read-only preflight

Run `gate1_spatial_ref_sys_preflight.sql` using an administrative/read-capable database connection and save the complete output. Verify:

- target database and PostgreSQL version;
- current RLS flags;
- table owner and current grants;
- inherited `PUBLIC` access using `has_table_privilege`;
- current `service_role` privileges, including `MAINTAIN`;
- default ACLs;
- `rls_auto_enable()` and `st_estimatedextent` definitions/grants;
- `ensure_rls` event-trigger state.

If the target or snapshot is unexpected, stop.

### Phase 2 — Explicit migration approval

Review the exact candidate SQL:

```sql
REVOKE ALL PRIVILEGES
ON TABLE public.spatial_ref_sys
FROM anon, authenticated, PUBLIC, service_role;

GRANT SELECT
ON TABLE public.spatial_ref_sys
TO service_role;
```

This is the only production change in this package. It is a grants-only change; it does not enable RLS on `spatial_ref_sys`.

### Phase 3 — Apply

Apply the candidate through the approved administrative Supabase/SQL workflow. Do not paste the rollback file or the function-review SQL into the apply step.

Record:

- executor identity;
- timestamp;
- exact SQL checksum or migration commit;
- provider/database response;
- any warning or error.

### Phase 4 — Immediate postflight

Run `gate1_spatial_ref_sys_postflight.sql` and the read-only assertion file. Expected results:

```text
anon_select: false
authenticated_select: false
public_select: false
service_role_select: true
service_role_maintain: false
```

The table's RLS flags should remain exactly as preflight recorded. This package does not change them.

The CRS smoke test must return:

```text
transformed_srid = 32642
transformed_x and transformed_y are finite numeric values
```

If any assertion fails, stop application rollout and follow the incident/rollback decision process.

### Phase 5 — Application regression

Run, at minimum:

- asset API read/write checks as an authenticated user;
- cross-user asset denial checks;
- worker service-role database connection check;
- STAC/COG pipeline smoke test;
- PostGIS polygon/SRID serialization check;
- alert history write/read check;
- anonymous request denial check for the metadata table/API surface.

No production customer data should be created solely for this smoke test unless a designated test tenant exists.

## Rollback decision

Rollback is not automatic. First determine whether the failure is caused by the candidate or by an unrelated service/configuration issue. If a verified outage is caused by the grant lockdown and immediate restoration is necessary, obtain explicit rollback approval and run `gate1_spatial_ref_sys_rollback.sql`.

The rollback restores broad table access and therefore returns the database to a known but insecure state. After rollback:

1. preserve all evidence;
2. open an incident;
3. confirm service recovery;
4. do not declare launch readiness;
5. prepare a corrected candidate.

## Separate follow-up workstreams

### Default privileges

The production audit found broad defaults for public tables, functions, and sequences. They must be handled in a separate design because grantor contexts include `postgres` and `supabase_admin`, and changes may affect Supabase-managed objects. No default-privilege change is included here.

### `rls_auto_enable()`

The function has a safe function-local `search_path = pg_catalog`, but direct API-role execute grants require a separate compatibility decision. The event trigger must remain functional. No grant change is included here.

### `st_estimatedextent`

The three PostGIS C overloads are extension-managed and retain their current definitions/grants in this package. Do not alter them as part of the table lockdown.

## Stop conditions

Stop before applying if:

- target project ID differs;
- preflight shows unexpected owner/version/grants;
- backup/recovery evidence is unavailable;
- current worker/API behavior requires public metadata reads;
- CRS smoke-test expectations are not accepted;
- the exact SQL differs from the reviewed candidate;
- a migration or settings change is requested outside this package.

## Approval boundary

This package is preparation only. GitHub/CI synchronization of these files does not authorize execution against production. A separate approval must state that the reviewed candidate may be applied to `thrgxznmblxtlzbicsrk` during a named change window.
