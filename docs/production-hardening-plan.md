# OrbiBound AI — Production Hardening Plan

**Prepared:** 2026-10-09  
**Source:** Attached engineering review  
**Status:** H1+H2 implementation completed; Supabase and local verification recorded below

## Objective

OrbiBound AI ko technical MVP se supervised pilot aur phir production-ready system tak le jana. Plan ka focus security, scientific validity, reliable processing, explainability, alert trust, and recoverability hai.

## Priority Model

| Priority | Meaning |
|---|---|
| P0 | Security or data-isolation blocker; production work se pehle complete hona zaroori |
| P1 | Correctness/reliability blocker; supervised pilot se pehle complete hona chahiye |
| P2 | User operations and launch-readiness improvement |
| P3 | Post-launch enhancement or optimization |

## Phase H1 — RPC, RLS and Security Hardening

**Priority:** P0  
**Depends on:** Existing Phase 2 database foundation  
**Supabase migration:** Required

### Scope

1. Audit all public functions, especially `SECURITY DEFINER` functions.
2. Restrict `claim_due_asset_schedules` execution:
   - Revoke from `anon`.
   - Revoke from `authenticated`.
   - Grant only to the trusted worker execution path.
3. Verify the worker can still claim due schedules after permission changes.
4. Add two-user RLS integration tests:
   - User A cannot read User B assets.
   - User A cannot update or delete User B assets.
   - Processing logs, schedules, alert configuration, and alert history remain isolated.
5. Review `spatial_ref_sys` access and document whether public API access is required.
6. Audit browser bundles, server logs, and error responses for service-role key exposure.
7. Add webhook destination validation to block private/internal IP ranges and unsafe protocols.
8. Add security-focused tests for malformed URLs, redirects, and blocked destinations.

### Acceptance criteria

- RPC permission tests pass for worker and public roles.
- Two-user RLS test suite passes.
- No service-role key is present in browser output or committed files.
- Unsafe webhook destinations are rejected before delivery.
- Migration is applied and verified in the authorized Supabase project.

## Phase H2 — New Asset Baseline and Warm-up Mode

**Priority:** P1  
**Depends on:** H1 database security baseline  
**Supabase migration:** Likely required for observation metadata/status

### Scope

1. Add an explicit warm-up lifecycle, for example:
   - `pending`
   - `warming_up`
   - `ready`
   - `processing`
   - `failed`
2. Store valid observations or scene references needed for baseline calculation.
3. Require at least three valid historical scenes before normal anomaly scoring.
4. Ensure a new asset does not produce a misleading score with insufficient history.
5. Return an explainable warm-up message to the UI and API.
6. Test first run, second run, third valid observation, failed observation, and partial scene results.
7. Confirm future runs actually reuse the baseline rather than starting from zero.

### Acceptance criteria

- New asset enters warm-up mode instead of showing a false risk score.
- Score is produced only when baseline requirements are met.
- Baseline history survives worker restarts and subsequent schedules.
- User-facing status explains why scoring is not yet available.

## Phase H3 — Authentication and Account Recovery

**Priority:** P0/P1  
**Depends on:** H1 RLS tests  
**Supabase migration:** Usually not required; Auth configuration and frontend changes required

### Scope

1. Login page and session handling.
2. Signup page with validation.
3. Logout action.
4. Password reset and recovery callback.
5. Protected dashboard and asset routes.
6. Expired-session and unauthorized states.
7. Forbidden responses for cross-user resource access.
8. Auth rate-limit configuration and abuse-resistant error messages.
9. Two-user API integration tests using real Supabase Auth users.

### Acceptance criteria

- A new user can sign up, log in, add an asset, log out, and log in again.
- Password reset flow works in the configured environment.
- Unauthenticated requests cannot access protected asset data.
- User A cannot access User B resources through URL or API manipulation.

## Phase H4 — Worker Scheduler and Recovery Verification

**Priority:** P1  
**Depends on:** H1 and H2  
**Supabase migration:** Only if heartbeat/lock fields are added

### Scope

1. Deploy the worker in a persistent execution environment.
2. Configure and verify the expected 15-minute scheduler.
3. Add worker heartbeat and last-success metadata.
4. Test duplicate claims and concurrent workers.
5. Test stale locks and worker restart recovery.
6. Test STAC timeout, 429, 5xx, COG failure, and database failure paths.
7. Confirm retry and exponential backoff behavior.
8. Add queue/backlog, processing latency, and failure metrics.
9. Add operational alerting for repeated worker failure.

### Acceptance criteria

- A due schedule is processed automatically on the configured cadence.
- A schedule cannot be claimed twice concurrently.
- A crashed worker does not permanently strand an asset.
- Retry, backoff, and failure status are visible in logs and metrics.
- Worker restart recovery is demonstrated in a controlled test.

## Phase H5 — Satellite Analysis Validation

**Priority:** P1  
**Depends on:** H2 baseline mode and H4 reliable execution  
**Supabase migration:** Required if analysis provenance is persisted

### Scope

1. Confirm production STAC collection and Sentinel-2 band mappings.
2. Define scene selection ordering using freshness, cloud cover, and data quality.
3. Handle missing assets, no-data pixels, and invalid scenes.
4. Apply the exact AOI polygon mask rather than only its bounding rectangle.
5. Persist provenance:
   - Scene ID and acquisition date
   - Collection and band configuration
   - Algorithm version
   - Input settings
   - Baseline/current values
   - Explanation text
6. Create known AOI and known-scene fixtures.
7. Measure expected behavior, false positives, false negatives, and threshold sensitivity.
8. Label the score as an experimental signal until validation gates are passed.

### Acceptance criteria

- Scene freshness is not silently sacrificed for low cloud cover without an explicit rule.
- Polygon masking is validated against a known AOI.
- Every score can be traced to its scene, configuration, and algorithm version.
- Threshold behavior is documented with controlled fixtures.

## Phase H6 — Secure Alert Delivery

**Priority:** P1  
**Depends on:** H1, H4, and H5  
**Supabase migration:** Possibly required for delivery attempts/cooldown metadata

### Scope

1. Secure webhook and SMTP secret configuration.
2. Per-asset alert settings UI.
3. Safe webhook destination validation and SSRF protection.
4. Test-send flow using only an approved safe test endpoint.
5. Delivery retries with bounded backoff.
6. Deduplication and cooldown/rate-limit behavior.
7. Delivery status and failure reason visibility.
8. Alert acknowledgement or resolution state.
9. End-to-end controlled AOI-to-alert test.

### Acceptance criteria

- No private/internal webhook destination is accepted.
- Duplicate threshold breaches do not create uncontrolled alert storms.
- Delivery failures are visible and retried according to policy.
- A controlled test proves score → threshold → delivery → history persistence.

## Phase H7 — Operations UI and Asset Detail

**Priority:** P2  
**Depends on:** H2, H4, H5, and H6

### Scope

1. Asset detail route: `/assets/[assetId]`.
2. AOI preview map.
3. Current score with date and explanation.
4. Warm-up, stale, failed, and processing states.
5. Last run and next scheduled run.
6. Processing logs.
7. Alert history and delivery status.
8. Edit asset settings.
9. Delete asset confirmation and safe cascade behavior.
10. Replace the public demo map style with an approved production tile provider.
11. Add privacy, retention, deletion, and alert limitation messaging.

### Acceptance criteria

- An operator can understand the current state of an asset without reading logs.
- Every score has a visible date, explanation, and provenance summary.
- Stale or failed data is not presented as current.
- Edit and delete actions respect ownership and confirmation requirements.

## Phase H8 — Staging, Release and Recovery Safeguards

**Priority:** P0/P1  
**Depends on:** H1 through H7  
**Supabase migration:** Required staging verification

### Scope

1. Reconcile local migration filenames with live Supabase migration IDs.
2. Apply and verify migrations in staging first.
3. Test migration rollback/recovery procedure.
4. Separate staging and production secrets.
5. Enable GitHub branch protection and required checks.
6. Run dependency, code, and secrets scanning.
7. Configure TLS/domain and production tile provider.
8. Configure error tracking, structured logs, uptime alerts, and incident contact.
9. Run backup and restore drill.
10. Perform production smoke test with safe AOI and safe alert endpoint.

### Acceptance criteria

- No unresolved critical/high security issue remains.
- Staging migration and rollback procedure is documented and tested.
- Backup restore is demonstrated.
- Production secrets are isolated and never logged.
- Required GitHub checks block unsafe merges.

## End-to-End Release Gate

Launch or supervised-pilot approval requires all of the following:

| Gate | Required result |
|---|---|
| RPC security | Public roles cannot execute trusted worker RPC |
| RLS isolation | Two-user cross-access tests pass |
| Authentication | Signup, login, logout, reset, and protected routes work |
| Baseline | Fresh assets warm up before scoring |
| Worker | 15-minute schedule is live and restart recovery is verified |
| Analysis | Scene, polygon mask, provenance, and thresholds are validated |
| Alerts | Safe endpoint test completes with delivery history |
| Operations UI | Current/stale/failed states are clear |
| Recovery | Backup restore drill passes |
| Security | No critical/high unresolved issue and no secret exposure |
| Documentation | Limitations are visible to users |

## Proposed Implementation Order

The recommended sequence is:

1. **H1 — RPC/RLS and security hardening**
2. **H2 — Baseline warm-up mode**
3. **H3 — Authentication and two-user tests**
4. **H4 — Worker scheduler and recovery verification**
5. **H5 — Satellite analysis validation**
6. **H6 — Secure alert delivery**
7. **H7 — Asset detail and operations UI**
8. **H8 — Staging, backups, release safeguards**
9. Final supervised pilot gate

## Phase Approval Checkpoints

Each phase should follow this cycle:

1. Prepare detailed technical specification.
2. Identify code files, tests, and Supabase migration impact.
3. Present the scope and acceptance criteria for user approval.
4. Implement only after approval.
5. Run local validation.
6. Apply and verify Supabase migration when required.
7. Sync code and migrations to GitHub `main`.
8. Verify GitHub CI and report any failure.

## H1+H2 Implementation Result

The approved combined H1+H2 scope has been implemented. The combined migration is applied to the authorized Supabase project `thrgxznmblxtlzbicsrk`. Local typecheck, lint, and workspace tests pass. Live verification confirms six application tables have RLS enabled, the baseline observation table and indexes exist, and the trusted schedule-claim RPC is denied to `anon` and `authenticated` while remaining executable by `service_role`.

The two-user runtime RLS test still requires authenticated test-user credentials or a dedicated staging Auth fixture; structural RLS policy verification is complete, but this runtime gate is not claimed as completed in this report.

## Combined Execution Plan — H1 + H2

**Release name:** Security and Baseline Readiness  
**Scope:** H1 RPC/RLS security hardening + H2 new-asset baseline warm-up  
**Implementation status:** Not started; requires explicit user approval before code, migration, or permission changes

### Combined objective

H1 اور H2 کو ایک ہی controlled release میں implement کیا جائے گا تاکہ:

- Asset data اور processing RPCs user isolation کے ساتھ محفوظ ہوں۔
- نئے assets misleading risk score کے بجائے واضح warm-up lifecycle میں جائیں۔
- Worker trusted RPC کے ذریعے schedule claim کر سکے، مگر public roles اس RPC کو execute نہ کر سکیں۔
- Baseline observations اور asset status RLS کے تحت محفوظ رہیں۔

### Why these phases should be executed together

H1 کی RLS/RPC security changes worker access اور user access boundaries کو change کریں گی، جبکہ H2 baseline history/status کے لیے database behavior extend کرے گا۔ انہیں ایک release میں رکھنے سے:

1. New baseline tables/status fields شروع ہی سے correct RLS کے ساتھ create ہوں گے۔
2. Worker claim اور baseline update permissions ایک ہی end-to-end test میں verify ہوں گی۔
3. Fresh asset flow security hardening کے بعد test ہوگا، نہ کہ پرانے permissive behavior پر۔
4. Migration, rollback, and GitHub CI verification ایک coordinated checkpoint میں مکمل ہوں گے۔

### Workstream A — H1 security changes

1. Inspect current migrations, grants, policies, and `SECURITY DEFINER` functions.
2. Confirm the current execution identity used by the worker.
3. Revoke `claim_due_asset_schedules` from `anon` and `authenticated`.
4. Grant the minimum required permission to the trusted worker path.
5. Review all other callable RPCs and remove unnecessary public execution grants.
6. Validate `spatial_ref_sys` access policy without unintentionally breaking required PostGIS behavior.
7. Add/execute two-user isolation tests for assets, schedules, logs, and alerts.
8. Add webhook URL validation tests for localhost, private IPs, link-local ranges, unsafe protocols, and redirect cases.
9. Scan source, build output, logs, and environment usage for service-role key exposure.

### Workstream B — H2 baseline changes

1. Inspect current asset `processing_status`, scene persistence, and pipeline update behavior.
2. Define the minimum three-valid-observation warm-up rule.
3. Add the smallest required schema extension, preferably:
   - explicit warm-up status support;
   - baseline observation/scene reference storage;
   - timestamps and failure reason where required.
4. Preserve existing asset records through a safe default/backfill strategy.
5. Update worker state transitions:
   - `pending` → `warming_up`;
   - `warming_up` → `ready` after three valid observations;
   - `ready` → `processing` for normal scoring;
   - failure paths retain an explainable status and error context.
6. Prevent anomaly score updates while baseline requirements are unmet.
7. Ensure valid observations are not duplicated by repeated worker runs.
8. Return a clear warm-up explanation to API consumers and future UI surfaces.

### Shared migration design

The combined migration must be additive where possible, safe for existing assets, protected by RLS from the moment tables/columns are created, explicit about function grants and revokes, reversible through a documented rollback procedure, and compatible with the current worker claim path.

Before applying it, inspect the live Supabase migration state and reconcile any local/live migration ID mismatch.

### Combined test matrix

| Area | Tests |
|---|---|
| RPC permissions | `anon` denied; `authenticated` denied; trusted worker succeeds |
| RLS assets | User A cannot read, update, or delete User B assets |
| RLS baseline data | User A cannot read or modify User B observations/scenes |
| RLS operational data | Logs, schedules, and alerts remain user-isolated through asset ownership |
| Fresh asset | First valid observation enters warm-up |
| Insufficient history | One or two observations never produce a normal risk score |
| Readiness | Third valid observation transitions asset to score-ready state |
| Invalid scene | Missing/no-data/failed observation does not count toward baseline |
| Duplicate run | Same scene/run cannot inflate observation count |
| Worker flow | Secure schedule claim → observation persist → status update succeeds |
| Failure recovery | Database/STAC failure preserves explainable status and allows later retry |
| Webhook validation | Unsafe destinations rejected before any network delivery |
| Secret safety | Service-role key absent from client bundle, logs, and test output |
| Regression | Existing fetcher, scorer, worker, and API tests remain green |

### Execution sequence after approval

#### Step 1 — Baseline inspection

- Read current relevant migrations and grants.
- Inspect worker service-role/server-side Supabase client usage.
- Inspect current processing status transitions and scene persistence.
- Capture current test and CI baseline.
- No behavior change in this step.

#### Step 2 — Write combined migration and tests

- Add H1 grant/revoke and RLS changes.
- Add H2 schema/status changes only where necessary.
- Add migration-level verification queries.
- Add two-user RLS/RPC tests.
- Add warm-up lifecycle unit and integration tests.

#### Step 3 — Update application code

- Update strict TypeScript domain types.
- Update worker orchestration and status transitions.
- Update anomaly scoring guard for insufficient baseline data.
- Update API response types with warm-up state and explanation.
- Add structured context to errors without exposing secrets.

#### Step 4 — Local verification

Run, at minimum: typecheck, lint, unit tests, worker tests, API tests, migration verification, two-user RLS tests against the authorized test environment where available, secret scan, and webhook safety tests.

#### Step 5 — Supabase application and verification

- Apply the combined migration to the authorized Supabase project.
- Verify tables/columns, policies, function grants, and revokes.
- Execute positive worker permission test.
- Execute negative public-role permission tests.
- Execute two-user isolation tests.
- Record migration ID and verification result.

#### Step 6 — GitHub synchronization and CI

- Commit only the approved H1+H2 scope.
- Push to `orbiboundsi/ORBIBOUNDSI` `main` according to the project workflow.
- Wait for CI completion.
- Confirm typecheck, lint, tests, and migration-related checks pass.
- Report any Supabase, permission, connection, migration, push, or CI failure without claiming completion.

#### Step 7 — Post-release smoke test

1. Asset is owned by the test user.
2. Schedule is claimed only through the trusted worker path.
3. First and second valid observations remain in warm-up.
4. Third valid observation enables normal scoring.
5. A failed observation does not incorrectly advance readiness.
6. A second user cannot access any of the first user’s data.
7. No unsafe webhook request is attempted.

### Rollback plan

If migration or application verification fails:

1. Stop worker processing before changing grants or status behavior.
2. Revoke newly introduced public permissions immediately if required.
3. Restore the prior worker-compatible grant state only through a controlled migration.
4. Preserve existing asset records and avoid destructive deletion of observations.
5. Revert application code to the previous known-good commit if CI or smoke tests fail.
6. Re-run permission, RLS, and pipeline smoke tests after rollback.
7. Document the failure and correction before retrying.

### Combined acceptance gate

H1+H2 کو complete تب مانا جائے گا جب:

- Public roles trusted schedule-claim RPC execute نہ کر سکیں۔
- Worker schedule claim successfully کر سکے۔
- Two-user RLS tests تمام relevant records پر pass ہوں۔
- New asset کم از کم تین valid observations تک warm-up میں رہے۔
- Insufficient/invalid data پر misleading score نہ بنے۔
- Third valid observation کے بعد scoring flow deterministic طور پر ready ہو۔
- Worker restart یا failed run کے بعد state recoverable رہے۔
- Webhook unsafe destinations reject ہوں۔
- Local tests اور GitHub CI pass ہوں۔
- Authorized Supabase migration state verified ہو۔
- GitHub sync verified ہو۔

### Approval boundary

User approval ملنے سے پہلے درج ذیل actions نہیں کیے جائیں گے:

- Supabase migration apply کرنا
- RPC grants/revokes بدلنا
- RLS policies بدلنا
- Worker/application code modify کرنا
- GitHub commit یا push کرنا
- Production/staging behavior change کرنا

Approval کے بعد implementation کو **H1+H2 combined release** کے طور پر execute کیا جائے گا، اور دونوں phases کے لیے ایک مشترکہ validation اور sync report فراہم کی جائے گی۔
