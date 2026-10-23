# CLAUDE.md — School Management System

Guidance for any AI agent (or dev) working in this repo. **Read the reference docs below
before making changes** — they describe the whole app and its conventions.

## Start here (reference docs, repo root)
- **[APPLICATION-FLOW.md](APPLICATION-FLOW.md)** — architecture + login-wise (role-wise)
  functionality. Request lifecycle, multi-tenancy, security/role hierarchy, data model,
  per-persona flows, change recipes, migration gotchas. **The map for understanding/changing
  the app.**
- **[API-GUIDE.md](API-GUIDE.md)** — mobile/third-party API usage: login → auth →
  role-based → functionality-wise, request/response shapes, full endpoint reference.
- **[SMS-API.postman_collection.json](SMS-API.postman_collection.json)** — importable,
  runnable API collection (Login auto-saves tokens).

> **Code is the source of truth.** When a doc and the code disagree, the code wins — and
> update the doc in the same change so the next agent inherits an accurate map.

## Modules
- **SmsCore/** — Spring Boot 3.2.5, Java 21, Spring Security 6.2, Hibernate 6, PostgreSQL.
  REST API + business logic.
- **SmsWeb/** — React + TS, Vite, MUI, React Query v5, Redux Toolkit (auth), axios.

## Build / validate
- Backend compile check (validation only — **the user restarts the backend themselves**):
  ```bash
  cd SmsCore && mvn -q -o compile
  ```
- Frontend type check:
  ```bash
  cd SmsWeb && npx tsc --noEmit
  ```
Both should exit 0. Default Spring profile is `pg` (PostgreSQL). Frontend dev server runs on
`:3000` and proxies `/api` + `/ws` to `:8080`.

## Conventions (do not break)
- Every endpoint returns the `ApiResponse<T>` envelope `{success, message, data, timestamp}`.
  Don't leak JPA entities where a response DTO exists.
- Controllers are **thin**; business logic lives in `service/impl/*ServiceImpl`.
- **Multi-tenancy:** services read `schoolId`/`userId` from `TenantContext` (JWT), never from
  the request body. Exception: Super Admin (`/api/v1/super/*`) is not tenant-scoped and takes
  `schoolId` as a path variable.
- **Authorization:** gate with `@PreAuthorize`. Role hierarchy grants `SUPPORT_STAFF` the
  admin screens — exclude it from money features with `... and !hasRole('SUPPORT_STAFF')`.
- Frontend: one `api/*.api.ts` per domain, one `pages/<domain>` folder per persona; fetch via
  React Query; gate routes with `routes/ProtectedRoute`.
- Match the style of the surrounding code.

## Gotchas (learned the hard way — see APPLICATION-FLOW.md §10)
- `ddl-auto: update` won't backfill a new **non-null** column on a populated table — add a
  `columnDefinition` default.
- Pass the correct Java type to repository queries (e.g. `RoleName`, not `String`).
- Some JSONB columns are stored as `text` + explicit `ALTER` in `DataInitializer`.
- Give custom filters unique `@Component("name")` to avoid Spring bean-name collisions.
- Attendance UI uses **P / A / L** (L = Leave); never default everyone to Present.
- Results are visible to students/parents only **after publish**.

## External access (dev tunnels)
Stable named tunnels (do not recreate with random URLs):
```bash
devtunnel host sms-api    # :8080 → https://kkhwdk54-8080.inc1.devtunnels.ms
devtunnel host sms-app    # :3000 (web app)
```
Non-browser clients must send header `X-Tunnel-Skip-AntiPhishing-Page: true`.
