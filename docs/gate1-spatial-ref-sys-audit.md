# Gate 1 — `spatial_ref_sys` Read-only Supabase Audit

**Audit date:** 2026-10-10
**Project:** `ORBIBOUNDSI production` (`thrgxznmblxtlzbicsrk`)
**Scope:** Grants, RLS/policies, event-trigger auto-RLS behavior, PostGIS `SECURITY DEFINER` functions, default privileges, extension metadata, and repository references.
**Change policy:** Read-only audit only. No data, grant, policy, function, extension, or migration change was executed.

## Executive finding

`public.spatial_ref_sys` is a critical hardening blocker in the current production project:

- RLS is disabled.
- No RLS policies exist.
- `anon` and `authenticated` have full table privileges, including `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES`, and `TRIGGER`.
- The table is extension-managed PostGIS metadata, owned by `supabase_admin`.
- PostGIS is version `3.3.7` and the table is associated with the `postgis` extension.

The correct remediation is **not** to blindly enable RLS. The application currently has no source-level reference to `spatial_ref_sys`; only generated database types and documentation mention it. A staging compatibility test must first determine whether the API needs read-only SRID metadata access.

## 1. `spatial_ref_sys` table state

| Property | Observed value |
|---|---|
| Schema/table | `public.spatial_ref_sys` |
| Owner | `supabase_admin` |
| Rows reported by the project audit | approximately 8,500 |
| RLS enabled | `false` |
| RLS forced | `false` |
| Policies | none returned from `pg_policies` |
| Extension | `postgis` |
| PostGIS version | `3.3.7` |
| Columns | `srid`, `auth_name`, `auth_srid`, `srtext`, `proj4text` |

## 2. Direct table grants

`information_schema.role_table_grants` reports the following privileges on `public.spatial_ref_sys`:

| Role | Observed privileges |
|---|---|
| `anon` | `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES`, `TRIGGER` |
| `authenticated` | `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES`, `TRIGGER` |
| `service_role` | `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES`, `TRIGGER` |
| `postgres` | `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES`, `TRIGGER` |

No grant in the result was grantable onward (`is_grantable = NO`). The absence of RLS means these table grants are not narrowed by row policies.

## 3. RLS auto-enable mechanism

The active event trigger is:

| Property | Observed value |
|---|---|
| Event trigger | `ensure_rls` |
| Enabled | `O` (enabled) |
| Event | `ddl_command_end` |
| Tags | `CREATE TABLE`, `CREATE TABLE AS`, `SELECT INTO` |
| Owner | `postgres` |
| Trigger function | `public.rls_auto_enable()` |

`public.rls_auto_enable()` is:

- `SECURITY DEFINER`
- `search_path = pg_catalog`
- `plpgsql`
- configured to enable RLS for newly created tables in `public`
- configured to catch and log failures rather than aborting the DDL

The trigger does not retroactively enable RLS on the existing extension-managed `spatial_ref_sys` table. This explains why the table can remain unprotected even though the project has an auto-RLS trigger for future public tables.

## 4. `rls_auto_enable()` function grants

The function privilege check returned:

| Role | `EXECUTE` |
|---|---|
| `anon` | `true` |
| `authenticated` | `true` |
| `service_role` | `true` |

Although the event-trigger function is not an ordinary API operation, broad direct `EXECUTE` grants are unnecessary for the application roles and should be reviewed in the remediation design. The event trigger itself is owned by `postgres` and is the mechanism that invokes it for matching DDL events.

## 5. `SECURITY DEFINER` function findings

The public schema audit returned these `SECURITY DEFINER` functions:

| Function | Owner | `search_path` | anon | authenticated | service_role |
|---|---|---|---:|---:|---:|
| `claim_due_asset_schedules(text, integer, interval)` | project-owned public function | `public` | false | false | true |
| `rls_auto_enable()` | `postgres` | `pg_catalog` | true | true | true |
| `st_estimatedextent(text, text)` | `supabase_admin` | unset (`NULL`) | true | true | true |
| `st_estimatedextent(text, text, text)` | `supabase_admin` | unset (`NULL`) | true | true | true |
| `st_estimatedextent(text, text, text, boolean)` | `supabase_admin` | unset (`NULL`) | true | true | true |

The three `ST_EstimatedExtent` overloads are extension-provided C functions from `$libdir/postgis-3`, owned by `supabase_admin`, and executable by all three API-facing roles. Their `proconfig` is `NULL`, so no function-local `search_path` is set. This is a review finding, not proof of exploitability by itself; the functions must be evaluated against Supabase/PostGIS supported operating assumptions before altering extension-managed definitions or grants.

The OrbiBound claim RPC is correctly restricted: public roles are denied and only `service_role` is allowed.

## 6. Default privilege findings

`pg_default_acl` contains public-schema defaults granting broad access to API roles. Observed default ACL entries include:

- Tables (`r`): `anon` and `authenticated` receive `arwdDxtm`.
- Functions (`f`): `anon` and `authenticated` receive `X` (execute).
- Sequences (`S`): `anon` and `authenticated` receive `rwU`.
- Entries are present under both `postgres` and `supabase_admin` grantor contexts.

This is broader than the OrbiBound application-table policy model. Even if existing application tables are protected by RLS, future objects created under these defaults may receive excessive baseline privileges unless explicitly revoked or overridden. Default-privilege remediation should be handled as a separate, carefully scoped staging change because it may affect Supabase-managed objects and future migrations.

## 7. Repository usage audit

A repository-wide search found no application source usage of `spatial_ref_sys`, `ST_Transform`, or `ST_SRID`. Current references are:

- `packages/database/src/generated.ts`: generated table type for `spatial_ref_sys`.
- `docs/database-overview.md`: existing security advisory note.
- `docs/production-hardening-plan.md`: hardening plan references.
- H4 migration/code: only unrelated `SECURITY DEFINER` claim RPC references.

This supports testing a **no public access** policy first, while preserving trusted server-side PostGIS behavior. That conclusion still requires staging verification before production changes.

## 8. Risk classification

### Critical — confirmed

1. `spatial_ref_sys` has no RLS.
2. `anon`/`authenticated` have full CRUD-style table grants.
3. Public-schema default table/function/sequence privileges are broad.

### High — requires review before production hardening

1. Three extension-managed `ST_EstimatedExtent` `SECURITY DEFINER` overloads have unset function-local `search_path` and broad execute grants.
2. `rls_auto_enable()` has broad execute grants even though API roles should not need to invoke an event-trigger function directly.

### Not a finding

- The OrbiBound `claim_due_asset_schedules` RPC is not part of the exposure: its public execution is denied and `service_role` execution is allowed as intended.
- `rls_auto_enable()` being active does not prove all existing tables have RLS; it only covers matching future DDL events and logs failures.

## 9. No-change remediation options for approval

### Option A — No public access (recommended starting point)

- Revoke `anon`/`authenticated` table privileges on `spatial_ref_sys`.
- Do not expose the table through PostgREST.
- Preserve trusted server-side PostGIS operations and test all current geometry/CRS paths in staging.
- Review/restrict direct execute grants on `rls_auto_enable()`.
- Do not redefine extension-managed `ST_EstimatedExtent` functions until the staging compatibility result and Supabase support position are clear.

### Option B — Read-only public metadata access

- Revoke all write-like privileges from `anon`/`authenticated`.
- Preserve only narrowly required `SELECT` access, ideally through a controlled view or supported API path.
- Verify that PostgREST exposure does not create an unnecessary metadata surface.
- Test all geometry operations and API routes in staging.

### Not recommended without evidence

- Enabling RLS directly on the extension-managed table in production.
- Replacing or altering the three PostGIS C function definitions.
- Granting API roles execute on helper/event-trigger functions.
- Applying a global default-privilege change without a complete Supabase-managed-object impact test.

## 10. Next gate

The next action requires a separate implementation approval and should be performed in staging first:

1. Snapshot current grants and object state.
2. Confirm whether any API route needs `spatial_ref_sys` data; current source audit says no.
3. Apply the least-privilege candidate in staging only.
4. Run PostGIS geometry/CRS, API, worker, and migration regression tests.
5. Check PostgREST exposure and negative access tests as `anon` and `authenticated`.
6. Review `ST_EstimatedExtent` and `rls_auto_enable()` grant changes separately.
7. Prepare a reversible production migration only after staging passes.

**Audit conclusion:** Gate 1 has produced a confirmed critical finding and a safe remediation decision point. No production security change should be claimed until the staging compatibility test and explicit approval are complete.

## Addendum — Local Candidate Test Result

**Date:** 2026-10-10
**Scope:** Disposable local PostgreSQL 16/PostGIS 3.4 harness only. Production was not changed.

The local test identified an important PostgreSQL privilege detail: revoking privileges from `anon` and `authenticated` alone does not remove an inherited `PUBLIC` table grant. The tested candidate therefore explicitly removes `PUBLIC` access and resets `service_role` to read-only before granting its required access:

```sql
REVOKE ALL PRIVILEGES
ON TABLE public.spatial_ref_sys
FROM anon, authenticated, PUBLIC, service_role;

GRANT SELECT
ON TABLE public.spatial_ref_sys
TO service_role;
```

The local candidate passed the following checks:

- `anon` cannot read the table.
- `authenticated` cannot read the table.
- `PUBLIC` cannot provide inherited access.
- `service_role` can read CRS metadata.
- PostGIS CRS transformation remains functional with trusted read access.
- Existing repository migrations, tenant/RLS checks, worker RPC grant checks, CRS checks, 23 tests, and typecheck passed in the disposable harness.
- Candidate rollback completed successfully.

### Test limitations

- The harness was socket-only PostgreSQL 16/PostGIS 3.4, not the official Supabase local stack.
- Production is PostgreSQL 17/PostGIS 3.3.7.
- The harness did not reproduce the production default ACLs.
- Therefore this is a candidate result, not production approval or hosted Supabase compatibility proof.

### Candidate file

The non-production candidate is stored at:

`supabase/migrations/candidates/20261010_gate1_spatial_ref_sys_no_public_access.sql`

It intentionally does not enable RLS on the extension-managed table, alter PostGIS C functions, or modify production.

## Separate default-privilege remediation review

The production audit also found broad default privileges on public tables, functions, and sequences. These will not be combined blindly with the `spatial_ref_sys` candidate. Before any default-privilege migration is proposed, staging must verify:

1. Which grantor context (`postgres` or `supabase_admin`) owns each default ACL.
2. Whether changing defaults affects Supabase-managed objects or extensions.
3. Whether future OrbiBound migrations receive the intended least-privilege defaults.
4. Whether existing application-table grants remain unchanged.
5. Whether future public functions and sequences remain usable by trusted server paths.
6. Whether a reversible `ALTER DEFAULT PRIVILEGES` sequence is supported in the target environment.

## Separate `rls_auto_enable()` review

`public.rls_auto_enable()` remains an active event-trigger function with `search_path = pg_catalog`. Its direct `anon` and `authenticated` execute grants are unnecessary for normal application use, but no grant change is included in the candidate. The function's event-trigger ownership, behavior, and Supabase-managed compatibility must be tested separately before proposing a revoke.
