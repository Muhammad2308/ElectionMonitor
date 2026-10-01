# EIP — Application Corrections Plan

> **Purpose**: This document is a corrections brief for the v3 multi-tenancy work
> (`EIP_Data_Design_Plan.md` / `EIP_Multi_Tenant_Data_Design_Plan.md`) against the
> actual state of the codebase. It was produced by reading every new migration and
> tenancy class, running `migrate:fresh --seed` and `migrate:rollback` on a disposable
> MariaDB database, and executing a set of isolation/integrity probes against that
> database. The findings below are reproducible; where a claim is "by reading" rather
> than "verified by running", it is labelled as such.
>
> **Scope**: `EIP Backend` (Laravel 11) and `EIP PWA` (React/Vite).
> **Not scope**: this document does not re-litigate the plan's product decisions
> (D1–D4); it corrects implementation defects and gaps between the plan and the code.

---

## 0. How to use this document

Each item has:
- **What's wrong** — the defect, in concrete terms.
- **Evidence** — how it was found (file:line, or the command/query that proved it).
- **Why it matters** — the consequence if left unfixed.
- **Fix** — the concrete correction.

Work through the sections in order — later sections assume earlier ones are fixed.
Section 8 gives a suggested execution order across all of them.

---

## 1. The application is currently broken against its own migrated schema

This is the most urgent problem: 25 new migrations were applied to `eip_db`
(they are not yet committed to git), and they renamed columns and tables that
existing, running application code still references by the old names. None of
the following code paths currently work.

### 1.1 `ObserverCheckIn` model points at a table that no longer exists

- **What's wrong**: Migration `2026_09_27_010020_add_tenant_to_check_ins_table.php`
  renames `observer_check_ins` → `check_ins`. The model
  `app/Modules/Observers/Models/ObserverCheckIn.php` still has no `$table` override,
  so Eloquent looks for `observer_check_ins`.
- **Evidence**: `ObserverCheckIn::count()` →
  `SQLSTATE[42S02]: Base table or view not found: 1146 Table 'eip_db.observer_check_ins' doesn't exist`.
- **Why it matters**: `CheckInController@store` (the field app's check-in endpoint) is
  dead on arrival.
- **Fix**: Add `protected $table = 'check_ins';` to `ObserverCheckIn`, or rename the
  model to `CheckIn` to match the table (preferred, since the migration itself calls
  it `check_ins`). Update the column names to match too (`observer_id` not `user_id`,
  `captured_at` not `check_in_time` — see 1.3).

### 1.2 `Incident` model's fillable/service payload use pre-migration column names

- **What's wrong**: `IncidentReportingService::report()` builds a payload keyed
  `user_id`; migration `2026_09_27_010018_add_tenant_to_incidents.php` renamed
  `incidents.user_id` → `reporter_id`.
- **Evidence**: `Incident::create([...'user_id'=>10...])` →
  `SQLSTATE[42S22]: Column not found: 1054 Unknown column 'user_id' in 'field list'`.
- **Why it matters**: every incident report submitted by the field app fails.
- **Fix**: Update `IncidentReportingService::report()` and `Incident::$fillable` to use
  `reporter_id`. Update `IncidentController`, `IncidentResource`, and the
  `User::incidents()` / `PollingUnit::incidents()` relationships (they currently
  assume the FK is `user_id`).

### 1.3 `observer_assignments.user_id` renamed to `observer_id`

- **What's wrong**: Migration `2026_09_27_010016_rebuild_observer_assignments_for_tenancy.php`
  renames `user_id` → `observer_id`. `User::assignments()` (in `app/Models/User.php`)
  and `AssignmentController` still query/write `user_id`.
- **Evidence**: `User::withCount('assignments')` →
  `SQLSTATE[42S22]: Column not found: 1054 Unknown column 'observer_assignments.user_id'`.
- **Why it matters**: the admin Users page (`incidents_count`/`assignments_count`
  columns), `AssignmentController`, and anything joining through this relation is
  broken.
- **Fix**: Update the relationship's foreign key argument and every raw reference to
  `observer_assignments.user_id`.

### 1.4 `IncidentMedia` model's fillable doesn't match the rebuilt table

- **What's wrong**: Migration `2026_09_27_010019_create_incident_media_table.php`
  drops and recreates `incident_media` with columns `storage_path`, `mime_type`,
  `size_bytes`, `sha256`. The model `app/Modules/Incidents/Models/IncidentMedia.php`
  still has `$fillable = ['id','incident_id','media_type','file_path','file_hash','metadata']`,
  and `IncidentReportingService::storeMedia()` still writes `file_path`/`media_type`/`file_hash`.
- **Evidence**: `IncidentMedia::create([...'media_type'=>'image'...])` →
  `SQLSTATE[42S22]: Column not found: 1054 Unknown column 'media_type' in 'field list'`.
- **Why it matters**: media upload (`POST /incidents/media`) is dead on arrival.
- **Fix**: Rewrite `IncidentMedia::$fillable` and `IncidentReportingService::storeMedia()`
  to the new column names, and decide whether `sha256` is computed from the uploaded
  file (recommended — the plan intends it as an evidence-integrity check, not just
  `md5_file` on a public-disk path).

### 1.5 Six permission strings checked in controllers no longer exist

- **What's wrong**: `RolesAndPermissionsSeeder` was rewritten for the v3 role/permission
  set. These permission strings are gone, but controllers still call
  `->can('...')` with them:

  | Missing permission | Checked in |
  |---|---|
  | `assignments.create` | `AssignmentController` |
  | `assignments.bulk-create` | `AssignmentController` |
  | `assignments.delete` | `AssignmentController` |
  | `incidents.view-all` | `IncidentController` |
  | `users.assign-role` | `RoleController`, `UserController` |
  | `users.delete` | `UserController` |

- **Evidence**: `array_diff` of permission strings grepped from
  `app/Modules/*/Controllers/*.php` against `Permission::pluck('name')` on the
  freshly-seeded v3 roles — 6 of 14 checked permissions are absent.
- **Why it matters**: every one of these `abort_unless($user->can('x'), 403)` calls
  now denies **everyone**, including the roles that are supposed to be allowed,
  because `can()` returns `false` for a permission that doesn't exist. Assignment
  management, incident escalation views, user deletion and role assignment are all
  locked out for all roles.
- **Fix**: Reconcile permission names between the seeder and every controller. The v3
  seeder introduced `assignments.manage` in place of the four granular
  `assignments.*` permissions — either restore the granular ones (they're more
  useful for the access matrix in §6 of the plan) or update every controller call
  site to `assignments.manage`. Do the same audit for `incidents.view-all` (needed to
  distinguish "own reports" from "all tenant reports" per the access matrix) and
  `users.assign-role`/`users.delete`.

### 1.6 Frontend role slugs are the pre-v3 names

- **What's wrong**: `EIP PWA/src/utils/roles.ts` still lists
  `['ward-supervisor', 'lga-supervisor', 'state-coordinator', 'national-admin', 'super-admin']`.
  None of these match the v3 `role_type` values (`cybernet_superadmin`,
  `national_master_admin`, `state_master_admin`, `state_admin`, `observer`).
- **Evidence**: by reading; confirmed no occurrence of any v3 role slug anywhere
  under `EIP PWA/src`.
- **Why it matters**: `isAdminRole()` returns `false` for every real user, so
  **no one** can reach `/admin/*` after this migration ships — every admin gets
  redirected to the observer dashboard.
- **Fix**: Update `ADMIN_ROLES` and `homeRouteForRole()` in `utils/roles.ts` to the
  v3 role slugs, and decide how `national_master_admin` vs `state_master_admin` vs
  `state_admin` map to different admin-console capabilities (the access matrix in
  §6/§8 of the plans implies different views per role, which the current admin
  console does not yet branch on).

---

## 2. Isolation guarantees the plan promises are not yet in the schema

These were each verified by direct SQL against the migrated schema (see the
transcript in the prior analysis message for the exact statements) and dropped
afterwards — they did not touch the real `eip_db`.

### 2.1 Deleting an organisation cascades through everything it owns

- **What's wrong**: `organisations.id` → `tenants.organisation_id` is
  `cascadeOnDelete()` (`2026_09_27_010002_create_tenants_table.php`), and every
  tenant-owned table cascades from `tenants.id` the same way. A single
  `DELETE FROM organisations WHERE id = ?` removes that org's tenants, users,
  incidents, incident_media, check_ins and observer_assignments in one statement,
  with no soft-delete, no export, and no audit trail.
- **Evidence**: seeded one tenant with one user/incident/media/check-in/assignment;
  `DELETE FROM organisations WHERE id=3` left 0 rows in every one of those tables.
- **Why it matters**: this contradicts the plan's own data lifecycle (§12/§14 —
  read-only → export → confirm → 30-day wait → purge). As built, any accidental or
  malicious delete of an `organisations` or `tenants` row is instant, unrecoverable
  data loss for a political party's entire election-observation record — exactly
  the trust guarantee the platform is being sold on.
- **Fix**: Change `organisations→tenants` and every `tenants→*` foreign key from
  `cascadeOnDelete()` to `restrictOnDelete()`. Deletion should only ever happen
  through the `tenant:purge` command (§12 of the plan), which is the one place that's
  supposed to check `purge_due_at`, write a `purge_records` certificate, and only
  then remove rows — and it should do so table-by-table in an explicit order, not
  rely on cascade.

### 2.2 Deleting an official election schedule deletes incidents that reference it

- **What's wrong**: `incidents.election_schedule_id → election_schedules.id` is
  `cascadeOnDelete()` (`2026_09_27_010018_add_tenant_to_incidents.php`).
- **Evidence**: an incident referencing `election_schedules.id=1` vanished when that
  schedule row was deleted.
- **Why it matters**: `election_schedules` is a shared, platform-owned table that a
  `cybernet_superadmin` can edit (postpone, correct a typo, etc.). Under the plan's
  own amendment model (§5.4 of v3), a schedule is corrected via
  `election_schedule_amendments`, never by deleting the base row — but nothing in
  the schema *prevents* a delete, and if one happens, tenant-owned incident evidence
  is destroyed as a side effect. A tenant's data must never be deletable as a side
  effect of a platform-table operation.
- **Fix**: `restrictOnDelete()` on `incidents.election_schedule_id`,
  `observer_assignments.election_schedule_id`, and
  `tenant_operational_schedules.election_schedule_id`. If a schedule genuinely needs
  removing, that should be blocked while any tenant data references it.

### 2.3 `tenant_id` is nullable on `incidents`, `check_ins`, and `observer_assignments`

- **What's wrong**: Migrations 010018/010020/010016 add `tenant_id` as
  `->nullable()` and never follow up with a `NOT NULL` enforcement step, unlike
  `users` (which does get one, in M13). The plan's own §3/§6 table classification
  says every tenant-owned table carries `tenant_id NOT NULL`.
- **Evidence**: `information_schema.columns` shows `is_nullable = YES` for
  `tenant_id` on all three tables. An incident row was inserted with
  `tenant_id = NULL` and `reporter_id` pointing at a **different tenant's** user —
  accepted. Composite-FK protection only exists when `tenant_id` is actually set;
  with it NULL, `(tenant_id, reporter_id)` becomes `(NULL, 20)`, which MySQL/MariaDB
  does not validate against the composite key the same way.
- **Why it matters**: this is the exact bypass the plan's four-layer isolation model
  (§11 / §7) is designed to make impossible "even if application code is buggy." As
  it stands, a bug that fails to set `tenant_id` before insert doesn't just leave an
  orphan row — it leaves a row that can reference **any other tenant's user**
  without the database objecting.
- **Fix**: Add the missing "enforce" migration for each of these three tables (same
  expand → backfill → enforce pattern already used for `users`): backfill any NULLs,
  then `ALTER TABLE ... MODIFY tenant_id BIGINT UNSIGNED NOT NULL`.

### 2.4 `users` CHECK constraint doesn't actually require `role_type`

- **What's wrong**: `chk_users_superadmin_tenant` (M13) reads:
  ```sql
  CHECK (
    (role_type = 'cybernet_superadmin' AND tenant_id IS NULL AND organisation_id IS NULL)
    OR
    (role_type != 'cybernet_superadmin' AND tenant_id IS NOT NULL AND organisation_id IS NOT NULL)
  )
  ```
  When `role_type IS NULL`, `role_type != 'cybernet_superadmin'` evaluates to
  `NULL` (SQL three-valued logic), and `NULL OR NULL` is `NULL`, which MySQL/MariaDB
  treat as **constraint satisfied** (a CHECK only fails on a definite `FALSE`).
- **Evidence**: `INSERT INTO users (name, email, password, status, created_at,
  updated_at) VALUES (...)` — no `role_type`, no `tenant_id`, no `organisation_id` —
  succeeded.
- **Why it matters**: any code path that creates a user without explicitly setting
  `role_type` (for example, `GoogleAuthController`'s `User::firstOrCreate` — see
  §4) produces a user with **no role and no tenant**, that the CHECK constraint
  waves through.
- **Fix**: Rewrite the CHECK to close the NULL gap explicitly, e.g.:
  ```sql
  CHECK (
    role_type IS NOT NULL
    AND (
      (role_type = 'cybernet_superadmin' AND tenant_id IS NULL AND organisation_id IS NULL)
      OR
      (role_type != 'cybernet_superadmin' AND tenant_id IS NOT NULL AND organisation_id IS NOT NULL)
    )
  )
  ```
  Also make `role_type` `NOT NULL` at the column level once backfilled — there's no
  reason to leave it nullable the way M13 leaves it.

### 2.5 Deleting the assigning admin silently detaches the assignment

- **What's wrong**: `fk_obs_assign_assigned_by` (M16) is `ON DELETE SET NULL`.
- **Evidence**: deleting the `state_master_admin` who created an assignment left the
  assignment row with `tenant_id = NULL, assigned_by = NULL` (the `SET NULL` fires
  on *every* column in the composite key when the referenced row is gone, including
  `tenant_id` — which then re-triggers the problem in §2.3).
- **Why it matters**: this both loses the audit trail of who deployed an observer
  and knocks the row's `tenant_id` to NULL, re-opening the composite-FK bypass.
- **Fix**: `assigned_by` should be `restrictOnDelete()` (an admin who has assigned
  observers shouldn't be hard-deletable at all — see §4.4 on suspension vs. deletion)
  or, if deletion must be allowed, the FK needs to be redesigned so `SET NULL` can't
  also null out `tenant_id`. The cleanest fix is the former: users are suspended,
  never hard-deleted, once they have dependent rows.

### 2.6 `election_schedule_id IS NULL` defeats assignment de-duplication

- **What's wrong**: `UNIQUE (tenant_id, observer_id, polling_unit_id,
  election_schedule_id)` on `observer_assignments` relies on `election_schedule_id`
  being part of the key, but MySQL/MariaDB treat `NULL` as distinct from every other
  `NULL` in a unique index. Since `election_schedule_id` is nullable, two identical
  `(tenant, observer, polling_unit, NULL)` rows are both accepted.
- **Evidence**: inserted the same `(tenant_id=1, observer_id=10, polling_unit_id=1,
  election_schedule_id=NULL)` row twice — both succeeded.
- **Why it matters**: duplicate assignments break any code that assumes at most one
  active assignment per observer/polling-unit/election, and will double-count
  observers in coverage metrics.
- **Fix**: Either make `election_schedule_id` required (an assignment always belongs
  to a specific election cycle — this seems like the intent), or add a generated
  `schedule_key` column (`COALESCE(election_schedule_id, 0)`) the same way M02 and
  M17 already do for their own NULL-in-unique-index problems, and put the unique
  index on that instead.

---

## 3. The tenancy core has gaps that would break the app or the isolation model

`app/Tenancy/TenantContext.php`, `app/Tenancy/BelongsToTenant.php`, and
`app/Http/Middleware/ResolveTenantContext.php` exist but are **not yet registered
or used anywhere** — no model uses the trait, and the middleware isn't in
`bootstrap/app.php`. Before wiring them in, fix these:

### 3.1 The middleware never sets Spatie's team id, so permission checks fail

- **What's wrong**: `config/permission.php` now has `'teams' => true` with
  `'team_foreign_key' => 'tenant_id'` (confirmed by diffing the tracked file). Every
  Spatie permission table (`roles`, `model_has_roles`, `model_has_permissions`) has
  a `tenant_id` column and `can()` checks are scoped by whatever
  `setPermissionsTeamId()` was last called with. `ResolveTenantContext` only calls
  `TenantContext::setTenantId()` — it never calls `setPermissionsTeamId()`.
- **Evidence**: with `TenantContext::setTenantId(1)` but Spatie's team id left at its
  default, `$observer->can('incidents.create')` returned `false` even though the
  observer role has that permission. Once `setPermissionsTeamId(1)` was also called,
  the same check returned `true`. Likewise, `cybernet_superadmin->can('platform.manage_orgs')`
  returned `false` until `setPermissionsTeamId(0)` (the sentinel value the seeder
  uses for platform-level role assignment, since `model_has_roles.tenant_id` is
  `NOT NULL` and can't itself be `NULL` for the superadmin).
- **Why it matters**: as written, wiring this middleware in today would lock **every
  user, including the superadmin**, out of every permission check. This is not a
  future concern — it is the very first thing that would break on deploy.
- **Fix**: `ResolveTenantContext::handle()` must call
  `app(\Spatie\Permission\PermissionRegistrar::class)->setPermissionsTeamId($user->tenant_id ?? 0)`
  in the same place it sets `TenantContext`. Confirm `0` (not `null`) is the
  platform-scope sentinel consistently everywhere — the seeder already relies on
  this convention, so the middleware must match it exactly.

### 3.2 `BelongsToTenant`'s `creating` hook doesn't validate organisation consistency

- **What's wrong**: the plan (§10, "Core Services & Classes") specifies the trait
  should include an "org consistency check." The current `creating` hook only fills
  `tenant_id` when it's missing — it does not reject a create call that explicitly
  passes a `tenant_id` different from the current `TenantContext`.
- **Evidence**: with `TenantContext::setTenantId(1)`, `Probe::create(['tenant_id' =>
  2, ...])` succeeded and stored `tenant_id = 2`.
- **Why it matters**: any controller or job that forgets to strip `tenant_id` from a
  mass-assigned request payload can write directly into another tenant's data,
  bypassing the isolation model entirely — this is a mass-assignment vulnerability
  specifically in the tenancy layer.
- **Fix**: The `creating` hook should overwrite `tenant_id` with the current
  `TenantContext` value whenever the context is set and not bypassed — never trust
  an incoming `tenant_id`, even if one is present on the model.

### 3.3 `runAsPlatform()` doesn't check for a grant or write an audit entry

- **What's wrong**: the plan (§0 principle 5, §7 layer 2, §10) is explicit:
  "Bypassing the scope is only possible through `TenantContext::runAsPlatform()`,
  **which requires an active support-access grant and writes an audit log entry**."
  The current implementation takes any `$userId` (not even validated to exist) and
  bypasses every tenant's scope with no grant lookup and no logging.
- **Evidence**: `TenantContext::runAsPlatform(999, fn () => Probe::count())` — `999`
  is not a real user id — returned every row across all tenants.
- **Why it matters**: this is the platform's core trust commitment to political
  parties ("Cybernet staff cannot read party data by default" — §0 principle 4).
  As implemented, any code path that calls `runAsPlatform()` gets silent,
  unaudited, ungated access to every tenant's data.
- **Fix**: `runAsPlatform()` should take a `SupportAccessGrant` (or grant id), verify
  it belongs to the given user, is not revoked, and `now()` is within
  `[starts_at, expires_at]`, write an `audit_logs` row before running the callback,
  and reject with an exception otherwise. Consider scoping the bypass to the single
  tenant named on the grant, not every tenant — nothing in the current signature
  even takes a tenant argument.

### 3.4 `TenantContext` is a process-lifetime static, not cleared per request

- **What's wrong**: `TenantContext` holds tenant state in static properties.
  `ResolveTenantContext` sets it when `$request->user()` exists but never clears it
  when there is no user (or on `cybernet_superadmin`, it calls `clear()`, which is
  correct — but there's no `clear()` call for the "no authenticated user at all"
  case, and nothing resets it at the *end* of a request).
- **Evidence**: after a request authenticated as a tenant-1 user, a **second**,
  unauthenticated request in the same PHP process still reported
  `TenantContext::getTenantId() === 1`.
- **Why it matters**: this specific scenario doesn't occur inside PHP-FPM (one
  process per request), but it matters enormously for **queue workers** (which stay
  alive across many jobs in one process) and **tests** (which share process state
  between test cases unless reset). A job or test that runs after a tenant-scoped
  one, without explicitly setting its own tenant, silently inherits the previous
  tenant's context — exactly the kind of bug the isolation test suite in §H of the
  plan is meant to catch, except this particular failure mode is invisible in a
  standard PHP-FPM request/response test and needs an explicit queue/console test.
- **Fix**: Add `TenantContext::clear()` as an `after` hook in `ResolveTenantContext`
  (or via `terminating()`), and add explicit `TenantContext::clear()` calls in job
  base classes and the test `TestCase::setUp()`/`tearDown()`.

### 3.5 `$model->tenant` relation references a class that doesn't exist

- **What's wrong**: `BelongsToTenant::tenant()` returns
  `$this->belongsTo(\App\Models\Tenant::class)`. There is no `Tenant` model under
  `app/Models` — only the migration exists.
- **Evidence**: `Probe::first()->tenant` → `Error: Class "App\Models\Tenant" not found`.
- **Why it matters**: this isn't unexpected on its own (models haven't been
  generated yet per §10/§13 of the plans), but it means the trait as committed is
  not actually usable yet — flagging it so it's not missed once models are written.
- **Fix**: Part of Phase C/§13 — create `App\Models\Tenant`,
  `App\Models\Organisation`, and the rest of the platform models before wiring the
  trait into any tenant-owned model.

---

## 4. Authentication doesn't fit the tenancy model yet

### 4.1 Login is email-only; email is now unique per tenant, not globally

- **What's wrong**: `TokenService::validateCredentials(email, password)` does
  `User::where('email', $email)->first()`. With `UNIQUE(tenant_id, email)` (M13),
  the same email can now exist in two different tenants — which is the whole point
  of that constraint (§5.3/§6.1 of the plans: "a registration attempt never reveals
  that a person works for another party").
- **Evidence**: seeded `shared@x.com` in both an APC tenant and a PDP tenant with
  different passwords. Logging in with the PDP user's password against
  `shared@x.com` failed with "provided credentials are incorrect" — `where('email',
  ...)->first()` only ever finds the first matching row (the APC one), so the PDP
  user can never log in with this email, and if the passwords happened to collide,
  the PDP user would be silently authenticated as the APC user.
- **Why it matters**: this is a functional bug today (a second tenant sharing an
  email is simply locked out) and a **cross-tenant impersonation risk** the moment
  two users share both an email and a password (e.g., both created with the same
  temporary default password by their respective master admins before first login).
- **Fix**: implement the plan's own answer to this (§10 API surface, both v2 and
  v3): login by `user_code + password`, or `workspace (tenant slug) + email +
  password`. Plain email-only login is fundamentally incompatible with per-tenant
  email uniqueness and must be replaced, not patched.

### 4.2 Google sign-in self-provisions users outside the tenancy model entirely

- **What's wrong**: `GoogleAuthController::login()` does
  `User::firstOrCreate(['email' => $email], [...])` then `$user->assignRole('observer')`
  for new users, with no `tenant_id`, no `organisation_id`, and no `role_type` set.
  The plan is explicit that only `cybernet_superadmin` creates the first master
  admin of a tenant, and only master admins create state admins/observers (§1 role
  hierarchy, both plans) — there is no "anyone with a Google account becomes an
  observer" path in the design at all.
- **Evidence**: running the exact same DB calls as the controller against the v3
  schema — `assignRole('observer')` throws
  `SQLSTATE[23000]: Column 'tenant_id' cannot be null` (because `model_has_roles.tenant_id`
  is `NOT NULL` per §3.1), **after** the user row has already been created. The
  result is an orphaned `users` row with `role_type = NULL, tenant_id = NULL,
  organisation_id = NULL` — precisely the invalid state §2.4's CHECK constraint gap
  allows.
- **Why it matters**: two problems stack here — it's broken (throws mid-request,
  leaving a bad row behind), and even if it didn't throw, it would be a way to
  self-enrol as an observer for any tenant with no invitation, which contradicts
  the entire "master admin creates observers" model the platform is being sold on.
- **Fix**: Disable `GoogleAuthController`'s self-provisioning path until there is a
  tenant-aware invitation flow (e.g., a master admin pre-creates the user record —
  possibly with the email as the only field — and Google sign-in only *links* an
  existing invited user, never creates one). Wrap the existing find-or-create in a
  DB transaction regardless, so a mid-request failure can't leave a half-created
  user row.

---

## 5. Miscellaneous backend defects found by reading

These weren't independently re-verified by execution in this pass but are direct
reads of the code as it stands:

| # | Issue | Where |
|---|---|---|
| 5.1 | `audit_logs.subject_id` is `BIGINT`, but `incidents.id` is a UUID string. Any audit entry for an incident (`action = 'incident.status_changed'`, etc.) will throw. **Verified**: `INSERT INTO audit_logs (... subject_id) VALUES (..., '<uuid>')` → `SQLSTATE[22007]: Invalid datetime format: 1366 Incorrect integer value`. | `2026_09_27_010023_create_audit_logs_table.php` |
| 5.2 | `states.iso_code` is `NULL` for all 37 seeded states (`SELECT COUNT(*), SUM(iso_code IS NOT NULL) FROM states` → `37, 0`). `UserCodeGenerator` takes a `$stateCode` parameter that's meant to come from here — verified it happily generates `APC-NULL-OB-00001` when given the string `'NULL'`. User codes are supposed to be human-readable and stable; this needs a real two-letter state code seeded before `UserCodeGenerator` is used anywhere. | `ElectoralHierarchySeeder`, `UserCodeGenerator::generate()` |
| 5.3 | Device binding is a substring check: `str_contains($token->name, $deviceId)`. A device id of `"a"` matches a token named `device:abc123`. | `DeviceBindingMiddleware.php:27` |
| 5.4 | Nothing checks `$user->status` per-request after login — a suspended user's existing Sanctum tokens keep working until they expire (30 days). `isSuspended()` is only checked at login/token-creation time. | `TokenService`, `GoogleAuthController` |
| 5.5 | No login rate limiting anywhere in `routes/api.php` or `bootstrap/app.php` — password and Google-credential login are both unthrottled. | `routes/api.php` |
| 5.6 | `IncidentController::show()` and `uploadMedia()` have no ownership/tenant check — any authenticated user can fetch or attach media to any incident by id (once the state-scope global scope on `Incident` is the only isolation, this becomes a real cross-tenant read once `tenant_id` is enforced — see §2.3). | `IncidentController.php` |
| 5.7 | `GISController` and `DashboardController` endpoints have no permission checks at all — any authenticated tenant user (including a plain observer) can call them. | `GISController.php`, `DashboardController.php` |
| 5.8 | Incident media is stored on Laravel's `public` disk, not a private, per-tenant path. The plan (§6.7/§7 layer 3) calls for `tenants/{uuid}/incidents/{uuid}/{file}` served through short-lived signed URLs — evidence photos are currently just publicly reachable by guessing/enumerating the path. | `IncidentReportingService::storeMedia()` |

---

## 6. Migration defects

### 6.1 Three `down()` methods fail

Verified by running `migrate:fresh --seed` then walking `migrate:rollback`
one migration at a time on the scratch database:

| Migration | Failure |
|---|---|
| `2026_09_27_010020_add_tenant_to_check_ins_table` | `Can't DROP COLUMN 'synced_at'; check that it exists` — the column was renamed (`check_in_time` → `captured_at`) in the same `up()`, but `down()` tries to drop a column (`synced_at`) using a name that was never the pre-migration name, and in the wrong order relative to the rename-back. |
| `2026_09_27_010018_add_tenant_to_incidents` | `Cannot drop index 'incidents_election_schedule_id_foreign'; needed in a foreign key constraint` — `down()` tries to drop columns before dropping the FK that depends on them. |
| `2026_09_27_010016_rebuild_observer_assignments_for_tenancy` | Same class of bug — FK drop ordering. |

- **Why it matters**: the plan's own Phase B checklist requires "every migration
  must have a tested `down()`." None of these three had actually been run.
- **Fix**: in each `down()`, drop foreign keys and indexes **before** dropping or
  renaming the columns they reference, and rename columns back to their exact
  original names before attempting to drop anything.

### 6.2 M12 (backfill) makes irreversible, unreviewed decisions about existing data

- **What's wrong**: `2026_09_27_010012_backfill_users_tenancy.php` treats
  whichever user happens to have the lowest `id` as the new
  `cybernet_superadmin`, and silently maps every other existing user to
  `role_type = 'observer'` regardless of their actual prior role (state coordinator,
  LGA supervisor, etc. — all become plain observers). It also creates a "Legacy
  Demo Organisation" / "Legacy Demo Tenant" and sets the tenant `status = 'active'`
  with no licence record, bypassing `TenantLicenceService`'s own rule (§4.4 of both
  plans) that a tenant only becomes active with a paid licence.
- **Why it matters**: on any environment with real (non-seed) users already in the
  table, this migration would demote every admin/coordinator to `observer` with no
  way to tell who should be re-promoted, and would create a tenant that violates the
  platform's own activation invariant.
- **Fix**: Map roles using the existing Spatie role assignments (`model_has_roles`)
  rather than assuming "first user = superadmin, everyone else = observer." If a
  real mapping isn't derivable, this migration should require manual review/an
  explicit mapping table rather than a blanket default, given how consequential
  getting it wrong is.

### 6.3 M19 drops `incident_media` with no data-preservation step, and contains dead/confused code

- **What's wrong**: the migration file itself contains two consecutive
  `Schema::dropIfExists('incident_media'); Schema::create(...)` blocks — the first
  create is immediately dropped and recreated by the second, and the file's own
  comments show the author working out mid-migration whether `incidents.id` is a
  UUID or bigint ("WAIT, looking at 2026_06_14_164254, incidents.id is UUID!").
  There's no migration step to copy any existing `incident_media` rows into the new
  shape first.
- **Why it matters**: on any environment with real incident evidence already
  uploaded, this migration destroys it outright. Even in dev, shipping a migration
  file with visible "wait, let me figure this out" comments and a redundant
  create/drop/create is a sign it needs a clean rewrite, not a merge.
- **Fix**: Rewrite as a single clean `up()`: rename the old table, create the new
  one, migrate rows across with the column mapping made explicit, then drop the
  renamed-aside old table. Remove the dead first `dropIfExists`/`create` pair.

---

## 7. Seeder issues

| # | Issue | Where |
|---|---|---|
| 7.1 | `db:seed` unconditionally runs `DB::table('polling_units')->delete()`, which cascades (per §2.1's cascade problem, transitively) to any incidents/assignments/check-ins already pointing at those polling units. Running the full seeder on an environment with real operational data would destroy it. | `ElectoralHierarchySeeder.php:22` |
| 7.2 | The default `cybernet_superadmin` password (`EIP@Admin2026!`) is a literal string in a committed file, and is also printed to console output on every seed run (`$this->command->info('Default cybernet_superadmin: admin@electwatch.com / EIP@Admin2026!')`). | `RolesAndPermissionsSeeder.php:162` |
| 7.3 | `DemoDataSeeder` is commented out in `DatabaseSeeder` ("TODO: Update for v3 tenancy") — it still creates plain `User` rows with no `tenant_id`/`organisation_id`/`role_type`, which would now fail the CHECK constraint in §2.4's *fixed* form (good — but it needs an actual v3-aware rewrite, not just to stay disabled indefinitely, since it's the fixture the isolation test suite in §8/§H of the plans is meant to run against). | `DatabaseSeeder.php`, `DemoDataSeeder.php` |

**Fix for 7.1**: gate the destructive re-seed behind a flag or only run it on an
empty table; for a real deployment, geography data should be seeded once and never
blanket-deleted.
**Fix for 7.2**: generate a random password at seed time and print it once (or
require it via an environment variable with no default), rather than a fixed,
committed credential.
**Fix for 7.3**: rewrite `DemoDataSeeder` per the plan's own §9/§11 seeding plan
(three tenants — APC/PDP/a neutral org — sharing polling units in one state, plus a
national tenant), and re-enable it for local/staging only, guarded by
`App::environment()`.

---

## 8. Defects in the plan documents themselves

These are corrections to `EIP_Data_Design_Plan.md` and
`EIP_Multi_Tenant_Data_Design_Plan.md`, not to the code.

### 8.1 Document provenance is circular and there are duplicate copies

- v2 (`EIP_Multi_Tenant_Data_Design_Plan.md`) states it **supersedes**
  `EIP_Data_Design_Plan.md`.
- v3 (the current `EIP_Data_Design_Plan.md`) states it **synthesises** v1 *and* v2.
- There are three copies of these files on disk: `EIP Backend/EIP_Data_Design_Plan.md`,
  `EIP PWA/EIP_Data_Design_Plan.md`, and `EIP PWA/EIP_Multi_Tenant_Data_Design_Plan.md`
  (the two `EIP_Data_Design_Plan.md` copies are byte-identical; nothing enforces
  that they stay that way).
- **Fix**: keep exactly one copy of the current plan, at the repository root (not
  inside either app folder), and delete the others. Delete or clearly mark
  `EIP_Multi_Tenant_Data_Design_Plan.md` as historical/superseded so it stops being
  a second source of truth.

### 8.2 v3 undercounts its own migrations and silently drops content from v2

- v3's changelog table (§0) says "24" migrations; the plan's own migration list
  includes `M10b`, making it 25. The code matches 25.
- Content present in v2 but missing from v3, with no explanation: the partisan
  labelling requirement ("Partisan monitoring by {organisation} — not independent
  nonpartisan observation", v2 §7), the instruction to remove
  `observers.track-location` as a default observer permission (v2 §1 role mapping
  table), the Ward Supervisor → `state_admin` mapping note, the full `/api/v1`
  endpoint list (v2 §10), and the access-matrix/load-test items in the verification
  checklist (v2 §15).
- **Fix**: either fold this content back into v3 deliberately, or explicitly mark
  each as "intentionally dropped, because ___" — right now it reads as accidental
  loss during the v1+v2→v3 merge.

### 8.3 Target database engine doesn't match the environment actually being used

- Both plans specify "MySQL 8.0.16+ (CHECK constraints required)." The local server
  is MariaDB 10.4.32. An external commit already changed
  `config/database.php`'s default collation from `utf8mb4_0900_ai_ci` (a MySQL
  8-only collation) to `utf8mb4_unicode_ci` to cope with this, without the plan
  being updated to reflect it.
- MySQL 8 and current MariaDB both support CHECK constraints, so the migrations as
  written did run successfully in this environment — but:
  - `DispatchDueTenantNotifications`' `FOR UPDATE SKIP LOCKED` (§7/§9 of the plans)
    needs MariaDB ≥ 10.6; 10.4 doesn't have it. This wasn't exercised in this pass
    (no such command exists yet) but will fail immediately when built if the target
    stays on 10.4.
  - MySQL 8 has a documented restriction that a CHECK constraint may not reference
    a column that also has a foreign-key `ON DELETE`/`ON UPDATE` action. M02, M10b,
    and M13 all add CHECK constraints on columns with FK actions. This did not
    surface as a failure here because the environment is MariaDB, not MySQL 8 —
    it needs to be tested against an actual MySQL 8 server before that's assumed
    safe, since the plan names MySQL 8 as the target, not MariaDB.
- **Fix**: pick one engine and version, update both the plan documents and
  `docker-compose`/CI config to match it, and test the full migration set against
  that exact version — not whatever happens to be locally installed.

### 8.4 No election-cycle boundary on entitlement

- `tenant_election_types` grants a tenant access to an election *type*
  (`governorship`, `presidential`, etc.) with no expiry or period. A tenant that
  paid for the 2027 cycle keeps receiving `election_scheduled`/countdown
  notifications for every future election of that type forever, including 2031 and
  any by-elections in between, unless someone remembers to revoke the row.
- **Fix**: tie entitlement to `tenant_licences.valid_from`/`valid_to` (which already
  exist), or add an explicit cycle/period reference to
  `tenant_election_types`, and have `ResolveEntitledTenantsJob` check it.

### 8.5 Geography model stops at LGA; several election types need finer granularity

- Senate, House of Representatives, and State Assembly elections are conducted on
  senatorial districts, federal constituencies, and state constituencies
  respectively — none of which exist in the current `states → lgas → wards →
  polling_units` hierarchy. `election_schedule_amendments`' `scope_level` enum
  (`state|lga|ward|polling_unit`) has no way to express "this senatorial district's
  election was postponed."
- **Fix**: this needs a product decision informed by actual INEC constituency data
  — either add a constituency/district layer to the geography tables, or explicitly
  scope v3 to governorship/presidential/LGA-level elections only until that data
  model is designed.

### 8.6 Sub-state notification targeting doesn't match what the flow diagram promises

- `tenant_notifications.recipient_role` is `enum(all, state_admins, observers)`
  with a single optional `state_id` — there's no way to target "only the observers
  assigned to polling units within this specific amended jurisdiction," which is
  exactly what §9 (v2)/§7 (v3)'s flow diagram describes for LGA/ward/polling-unit
  postponements ("Unaffected observers in the same state receive NO change
  notification").
- **Fix**: either add a jurisdiction filter (LGA/ward/polling-unit id) to
  `tenant_notifications`, or make the "targeted" case bypass the
  `tenant_notifications` table entirely and write directly to the affected
  observers' `user_notifications` rows (skipping the broadcast-then-fan-out
  pattern for this one case).

### 8.7 The offline countdown's fallback logic can show the wrong state

- The pseudocode `Effective starts_at = amendment.new_starts_at ?? schedule.starts_at`
  means a `postponement` amendment with `new_starts_at = NULL` (postponed, new date
  not yet known — a case the plan explicitly allows) falls back to displaying the
  **original, no-longer-valid** start time, so the countdown could show "Polls Open"
  for an election that's actually been postponed indefinitely.
- **Fix**: check `amendment.new_status` / `amendment_type` *before* falling back to
  a time comparison — a postponement with no new date should render as "Postponed —
  new date to be announced," full stop, regardless of what the original
  `starts_at` was.

### 8.8 A tenant's own `deploy_at` isn't invalidated when the official date changes

- When `cybernet_superadmin` reschedules an `election_schedules` row, §7/§9's flow
  regenerates `tenant_notifications`, but nothing recomputes each tenant's
  `tenant_operational_schedules.deploy_at` (which was set relative to the *old*
  `starts_at`, e.g. "30 minutes before polls open"). A state master admin's deploy
  time can end up after the new polls-close time, or before the new polls-open by
  an oddly large margin.
- **Fix**: either recompute `deploy_at` proportionally when the base schedule shifts
  (and notify the master admin it changed), or require the master admin to
  re-confirm deploy time whenever the schedule they're pegged to is amended.

### 8.9 Contradictions between the access matrix and the schema

- The access matrix (§6/§8) allows `cybernet_superadmin` to "Request data export …
  on client instruction," but `tenant_data_exports.requested_by` participates in a
  composite FK `(tenant_id, requested_by) → users(tenant_id, id)` — and
  `cybernet_superadmin`'s `tenant_id` is always `NULL` by design (§2.4), so this FK
  can never be satisfied for a superadmin-requested export.
- Append-only audit logging (§6.11 — "the application DB user has no
  UPDATE/DELETE on this table") conflicts with the purge flow (§12/§14), which
  requires deleting every tenant-owned row — `audit_logs.tenant_id` is
  tenant-owned. Either purge must special-case audit logs (e.g., null out
  `tenant_id` and redact personal fields rather than deleting the row, preserving
  the log entry itself), or the append-only guarantee needs an explicit
  purge-time exception documented.
- **Fix**: resolve both explicitly in the plan text — likely: exports "on client
  instruction" are recorded with `requested_by` set to the tenant's own master
  admin (who's actually making the request on the superadmin's behalf), not the
  superadmin's user id; and purge redacts rather than deletes `audit_logs` rows.

### 8.10 `role_type` and Spatie roles are two sources of truth for the same fact

- `users.role_type` (an enum column) and the Spatie `roles`/`model_has_roles`
  tables both encode "what role does this user have," with nothing enforcing they
  agree. `UserCodeGenerator`, `ResolveTenantContext`, and the CHECK constraints all
  read `role_type` directly; permission checks (`->can()`) go through Spatie. A
  user whose `role_type` says `state_admin` but whose Spatie role assignment says
  `observer` (or has none) is a state that's easy to reach via a bug and hard to
  detect.
- **Fix**: pick one source of truth. The cleanest option: drop `role_type` as a
  separate column and derive it everywhere from the Spatie role name (there are
  only 5, so a simple mapping suffices); keep it only if there's a specific reason
  Spatie's own role name isn't sufficient (e.g., extremely hot-path reads where a
  join is too costly — unlikely at this scale).

### 8.11 Gaps not addressed by either plan document

- **Token revocation on suspension/read-only.** Nothing in either plan specifies
  that a user's active Sanctum tokens are revoked when they're suspended, or that a
  tenant's users lose write access the moment the tenant becomes `read_only`. (Also
  see §5.4 above — this is currently unimplemented in code either way.)
- **Polling-unit binding for observers.** Nothing stops an observer from submitting
  an incident report or check-in for a polling unit they are not assigned to.
- **First master-admin password bootstrap.** The plan says
  `cybernet_superadmin` "creates the first master admin of each tenant" but doesn't
  say how that admin receives their initial credential (invite email? temporary
  password shown once? forced reset on first login?).
- **Canonical polling-unit identifiers.** `PollingUnitResource`'s `pu_code` is
  synthesized from insertion order
  (`sprintf("S%02d-L%03d-W%04d-P%03d", $stateId, $lgaId, $wardId, $index+1)`, see
  `ElectoralHierarchySeeder.php:58`) rather than INEC's actual PU codes. This makes
  the code meaningless outside this database and unstable across re-seeds.
- **Fix**: each of these needs an explicit decision recorded in the plan (as D1–D4
  already are) before Phase D/E implementation.

---

## 9. Housekeeping (not a design flaw, but blocks safe committing)

| # | Issue | Detail |
|---|---|---|
| 9.1 | ~30 files uncommitted | All 25 new migrations plus the tenancy core (`app/Tenancy/*`, `app/Http/Middleware/ResolveTenantContext.php`, `app/Services/UserCodeGenerator.php`) are untracked. They are also already applied to the real `eip_db`, so the working tree and the database are ahead of git. |
| 9.2 | `EIP Backend.zip` (152 MB), untracked | Not covered by any `.gitignore` — a broad `git add -A` would commit a 152 MB binary blob to history. |
| 9.3 | Five debug artifacts committed | `EIP Backend/cookies.txt`, `headers.txt`, `login-body.html`, `login-cookies.txt`, `login-headers.txt` — each of the three `*cookies*`/`*headers*` files contains one session/XSRF-token marker. These should never have been committed and should be removed from history (not just deleted going forward, since a session/XSRF token, even if since rotated, shouldn't sit in a public or shared repo's history). |
| 9.4 | `config/cors.php` allows every origin and path | `'paths' => ['*']`, `'allowed_origins' => ['*']` — this was previously scoped to `api/*` + `sanctum/csrf-cookie` and the two known local dev origins. Wildcarding it defeats the purpose of having the config at all and should be reverted to an explicit allow-list (env-driven for prod vs. dev), especially now that the platform's entire value proposition rests on strict data isolation. |
| 9.5 | `EIP PWA/vercel.json` and `EIP Backend/.htaccess` untracked | Both look like real deployment config (SPA rewrite rule; Apache auth-header passthrough + front-controller rewrite) rather than scratch files — worth confirming they're intentional before committing, since they represent real infrastructure decisions (Vercel for the PWA, Apache for the backend) that haven't been discussed. |
| 9.6 | `.env.example` now points at a live-looking hostname | `EIP PWA/.env.example`'s `VITE_API_URL` changed from `http://localhost:8000` to `https://elect-monitor.cybernetsystems.ng`. If that domain is real and not yet secured, shipping it as the *example* default (which people copy verbatim into `.env`) risks pointing local dev traffic at a production-looking host by accident. |

**Fix**: address 9.3 with `git filter-repo` (or equivalent) before this repository
is ever made non-private, not just a follow-up `git rm`. Add `*.zip` to
`.gitignore`. Revert `cors.php` to an explicit allow-list. Confirm 9.5/9.6 are
deliberate before committing them.

---

## 10. Suggested execution order

Each phase assumes the previous one is done and re-tested (`migrate:fresh --seed`
plus the relevant probes from this document) before moving on.

1. **Make the app functional again against the applied schema** — §1.1–§1.6. This
   unblocks basic manual testing of everything else.
2. **Pick and pin the target DB engine/version** — §8.3 — before writing any more
   migrations against assumptions that may not hold.
3. **Fix the migrations** — §6.1 (down() ordering), §6.2 (backfill logic), §6.3
   (incident_media rewrite), §2.3 (tenant_id NOT NULL), §2.1/§2.2 (CASCADE →
   RESTRICT), §2.4 (CHECK constraint), §2.5/§2.6 (assignment integrity), §5.1
   (audit_logs.subject_id), §5.2 (states.iso_code).
4. **Wire the tenancy core correctly** — §3.1 (Spatie team id), §3.2 (creating-hook
   consistency check), §3.3 (runAsPlatform grant + audit), §3.4 (context clearing),
   §3.5 (Tenant model) — then, and only then, add `BelongsToTenant` to the
   tenant-owned models and register `ResolveTenantContext` in `bootstrap/app.php`.
5. **Fix authentication** — §4.1 (user_code/workspace login), §4.2 (disable/redesign
   Google sign-in).
6. **Reconcile permissions end-to-end** — §1.5 and §8.10 — controllers, seeder,
   frontend role slugs (§1.6), and the access matrix in the plan, all agreeing on
   one set of names.
7. **Close the remaining backend gaps** — §5.3–§5.8 (device binding, token
   revocation, throttling, ownership checks, permission checks on GIS/dashboard,
   private media storage).
8. **Rewrite the seeders for v3** — §7.1–§7.3 — including the three-tenants-one-state
   demo fixture the isolation tests need.
9. **Only now write the isolation test suite** (plan §H) — on the pinned production
   engine, not whatever's locally installed — and make sure it includes schema-level
   assertions (nullable `tenant_id`, CHECK-constraint NULL gaps, cascade-vs-restrict
   delete rules), since most of the defects in §2 of this document are exactly the
   kind of thing application-level tests alone would not have caught.
10. **Resolve the plan-document issues** — §8.1/§8.2 (single source of truth,
    restore or explicitly drop v2 content), §8.4–§8.9 (product/design decisions),
    §8.11 (unaddressed gaps) — in parallel with the above, since several of them
    (§8.4 entitlement expiry, §8.9 export/audit contradictions) need to be settled
    before the export/notification code in step 7 is written, not after.
11. **Housekeeping** — §9 — before the next `git add`, especially the debug-file
    history rewrite (9.3) and `.gitignore` fix (9.2), which only get harder the
    longer they're deferred.
