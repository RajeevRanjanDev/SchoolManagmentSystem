# School Management System — Application Flow & Architecture

**Audience:** future Claude / other AI agents (and human devs) who need to understand this
whole application end-to-end and make changes safely.
**Scope:** what the system is, how a request flows, how login & roles work, and
**login-wise (role-wise) functionality** — for every persona, what they can do, the screens,
the APIs, and the business rules behind them.

Companion docs in this repo root:
- [`API-GUIDE.md`](API-GUIDE.md) — mobile/third-party API usage, request/response shapes.
- [`SMS-API.postman_collection.json`](SMS-API.postman_collection.json) — importable, runnable API collection.

> Source of truth is always the code. When this doc and a controller/service disagree, the
> code wins — and please update this doc in the same change.

---

## 1. What the system is

A **multi-tenant SaaS School Management System**. One backend serves many schools (tenants);
a platform **Super Admin** onboards schools and manages subscriptions/billing. Each school
runs its own students, staff, academics, fees, transport, library, and communications.

Two deployable modules:

| Module | Tech | Role |
|---|---|---|
| **SmsCore** | Spring Boot 3.2.5, Java 21, Spring Security 6.2, Hibernate 6, PostgreSQL | REST API + business logic |
| **SmsWeb** | React + TypeScript, Vite, MUI, React Query v5, Redux Toolkit (auth), axios | Web SPA (also serves as the reference client for mobile) |

A native mobile app would consume the same SmsCore API (see `API-GUIDE.md`).

---

## 2. Repository layout

```
SchoolManagmentSystem-main/
├─ SmsCore/                      # Spring Boot backend
│  └─ src/main/
│     ├─ java/com/sms/school/
│     │  ├─ controller/         # REST controllers (37) — thin, delegate to services
│     │  ├─ service/            # service interfaces
│     │  │  ├─ impl/            # service implementations (business logic lives here)
│     │  │  └─ admission/       # admission/student domain services
│     │  ├─ repository/         # Spring Data JPA repositories
│     │  ├─ entity/             # JPA entities (+ entity/enums/)
│     │  ├─ dto/request/        # inbound DTOs
│     │  ├─ dto/response/       # outbound DTOs (incl. ApiResponse wrapper)
│     │  ├─ config/             # SecurityConfig, JpaRepositoriesConfig, WebSocket, Swagger…
│     │  ├─ security/           # JWT filter, UserDetailsServiceImpl, TenantContext
│     │  ├─ exception/          # BusinessException, ResourceNotFound… + GlobalExceptionHandler
│     │  ├─ payment/            # Razorpay + reconciliation (self-contained module)
│     │  └─ ops/                # error-tracking / operations (self-contained module)
│     └─ resources/
│        ├─ application.yml     # base config (profile `pg` default)
│        ├─ application-*.yml   # per-profile DB config
│        └─ ...
└─ SmsWeb/                       # React frontend
   └─ src/
      ├─ api/                   # one *.api.ts per domain; client.ts = axios + token refresh
      ├─ pages/                 # one folder per domain/persona (student/, teacher/, superadmin/…)
      ├─ components/            # shared + per-domain components
      ├─ layouts/               # MainLayout (staff/admin), StudentLayout (mobile-style)
      ├─ routes/                # ProtectedRoute (role gating)
      ├─ store/slices/authSlice.ts  # Redux: current user + tokens
      ├─ hooks/                 # useAuth, useMyClassSections, …
      └─ theme/                 # MUI theme
```

---

## 3. Backend architecture

### 3.1 Request lifecycle (every authenticated call)

```
HTTP request
  → RequestContextFilter (ops)        # puts requestId/traceId in MDC; echoes X-Request-Id
  → JWT auth filter (security)         # validates Bearer token, builds Authentication
  → TenantContext populated            # schoolId + userId from the token's claims
  → TenantStatusChecker                # blocks suspended/terminated/expired tenants (5-min cache)
  → @PreAuthorize on controller        # role check (Spring method security + role hierarchy)
  → Controller                         # thin: reads TenantContext, calls a service
  → Service(Impl)                      # business logic, transactions
  → Repository                         # JPA
  → ApiResponse<T> wrapper             # uniform envelope back to client
Exceptions anywhere → GlobalExceptionHandler → ApiResponse(success:false) + ops capture
```

### 3.2 Multi-tenancy

- `TenantContext` (ThreadLocal) exposes `getCurrentSchoolId()` and `getCurrentUserId()`,
  populated from JWT claims by the security filter.
- **Services derive `schoolId` from `TenantContext`, never from the request body.** This is
  the core isolation guarantee — a user can only touch their own school's data.
- **Exception:** Super Admin endpoints (`/api/v1/super/*`) are *not* tenant-scoped — Super
  Admin has `schoolId == null` and passes the target `schoolId` as a **path variable**.
- `TenantStatusChecker` runs per request (cached 5 min) and blocks any tenant that is
  `SUSPENDED` / `TERMINATED` or past `subscriptionExpiry`. Super Admin is exempt.

### 3.3 Security

- File: `config/SecurityConfig.java`.
- Stateless JWT. `PUBLIC_URLS` includes `/api/v1/auth/**`, `/api/v1/public/**`,
  `/api/v1/webhooks/**`, swagger. Everything else needs a token.
- **Role hierarchy** (`RoleHierarchy` + custom `MethodSecurityExpressionHandler` beans):
  `ROLE_SUPPORT_STAFF > ROLE_SCHOOL_ADMIN`. So Support Staff inherits admin screens —
  **except** finance/fees, which explicitly deny it via `... and !hasRole('SUPPORT_STAFF')`.
- CORS: `allowedOriginPatterns("*")`, `allowCredentials(true)` (so the dev tunnel + any
  mobile origin work).
- JWT config (`application.yml`): access token **15 min**, refresh token **7 days**,
  `JWT_SECRET` env-overridable.

### 3.4 Uniform response & errors

- `ApiResponse<T>` = `{ success, message, data, timestamp }` — returned by **every**
  endpoint (except attachment download = raw bytes, Razorpay webhook = plain string).
- `exception/GlobalExceptionHandler` maps `BusinessException`, `ResourceNotFoundException`,
  `UnauthorizedException`, validation errors, and a catch-all → appropriate HTTP status +
  `ApiResponse(success:false, message)`. The catch-all also records the failure into the
  **ops** error log (per-school, deduped by fingerprint).

### 3.5 Profiles & config (`application.yml`)

| Profile | DB | Use |
|---|---|---|
| `pg` (**default**) | PostgreSQL, `ddl-auto: update` | normal dev & prod-like |
| `local` / `demo` | H2 in-memory | throwaway |

Other config: Gmail SMTP (`cosmanicmail@gmail.com`; supply `MAIL_PASSWORD` app-password env
var), multipart ≤10MB (attachments), Firebase creds path (push), Swagger at
`/swagger-ui.html` + `/api-docs`.

> **Nested repositories:** `config/JpaRepositoriesConfig.java` sets
> `@EnableJpaRepositories(considerNestedRepositories=true)` so the payment module's nested
> repos are scanned. Keep this when touching payment persistence.

---

## 4. Data model (key entities)

Core identity & tenancy:
- **School** (tenant) — status (`ACTIVE/SUSPENDED/TERMINATED`), subscription plan + expiry,
  branding, legal/config, GSTIN.
- **User** — `username` (login ID), `email`, password hash, roles. Login resolves
  `username` first, then `email`.
- **Role** (`RoleName` enum): `SUPER_ADMIN, SCHOOL_ADMIN, TEACHER, PARENT, ACCOUNTANT,
  LIBRARIAN, TRANSPORT_MANAGER, SUPPORT_STAFF, STUDENT`. (`@PreAuthorize` also references
  `PRINCIPAL, DEAN, ADMISSION_OFFICER, HR_MANAGER` — elevated staff roles seeded separately.)
- **RefreshToken** — single-per-user, rotated on every `/refresh`.

Academics:
- **SchoolClass → Section**, **Subject**, **TeacherAssignment** (teacher ↔ class/section/
  subject, with `isClassTeacher`), **Timetable**.
- **StudentProfile** (admission domain) and legacy **Student** / **StudentClassMapping** /
  **StudentParentMapping** / **Parent**.

Activity:
- **Attendance** (status enum P/A/L/HALF_DAY), **Exam → Result**, **Homework →
  HomeworkSubmission**, **Classwork**, **DailyWork**, **LessonPlan**.

Money:
- **Fee** (+ `FeeStatus`), **FeePayment**, **FeeTemplate**, and the payment module (§7.1).

Comms & ops:
- **Circular**, **Event/EventPhoto**, **Notification**, **Device** (push), **Attachment**
  (bytes stored in DB), **SystemErrorLog** (ops).

`BaseEntity` gives id/audit columns; `AuditConfig` enables JPA auditing.

---

## 5. Login & authentication mechanics

### 5.1 One login endpoint, identifier varies by role

`POST /api/v1/auth/login` with `{ email, password }` — the `email` field accepts **email OR
login ID** (`UserDetailsServiceImpl.loadUserByUsername` = `findByUsername(x).or(findByEmail(x))`).

| Role | Identifier | Format / example |
|---|---|---|
| Super Admin / School Admin | **email** | `admin@school.com` |
| Teacher / employees | **login ID** | `{schoolCode}-{TE\|SS}-{year}-{seq}` → `ABC-TE-2025-001` (`SS`=Support Staff) |
| Student | **admission number** | `{schoolCode}-{year}-{seq}` → `ABC-2025-0001` |
| Parent | email / configured username | — |

### 5.2 Tokens

`AuthResponse` = `accessToken, refreshToken, tokenType("Bearer"), userId, schoolId, email,
fullName, roles(Set<String>)`. Roles come back **`ROLE_`-prefixed** (e.g. `ROLE_TEACHER`).
`GET /api/v1/me/profile` returns the profile + a single **bare** `role` (`TEACHER`) +
branding — handy for the first screen.

Flow: login → store both tokens → send `Authorization: Bearer {access}` → on 401 call
`/auth/refresh` (rotates both tokens) and retry once → `/auth/logout` clears server token.

### 5.3 Login gating

After credentials pass, login is still rejected if the user's school is `SUSPENDED`/
`TERMINATED` or `subscriptionExpiry < today` (Super Admin exempt). `AuthServiceImpl.login`
throws a business error → surface its `message`.

### 5.4 Password reset

`POST /api/v1/auth/forgot-password { identifier }` → emails a temp password, always returns
success (no identifier leakage). Admins can reset student/teacher passwords from their consoles.

---

## 6. Login-wise (role-wise) functionality — the core map

For each persona: where they land, what they can do, and the backing APIs. Full request/
response shapes are in `API-GUIDE.md`.

### 6.1 STUDENT (logs in by admission number)
Lands on a **mobile-style student portal** (`StudentLayout`, routes under `/student`).
Everything resolves the student from the JWT — no IDs in paths.

| Can do | Screen | API |
|---|---|---|
| See home snapshot (attendance %, dues, today) | Dashboard | `GET /student/dashboard` |
| View profile incl. **transport** (route/stop/pickup) | Profile | `GET /student/me` |
| View fees & dues | Fees | `GET /student/fees` |
| View attendance + monthly chart | Attendance | `GET /student/attendance` |
| View homework/classwork | Assignments | `GET /student/assignments` |
| View **published** results | Results | `GET /student/results` |
| Read notices/circulars | Circulars | `GET /student/circulars` |
| Change password | Profile | `POST /student/change-password` |
| **Pay fees online** | Fees → Pay | `POST /student/payments/orders` → Razorpay Checkout → `POST /student/payments/verify` |
| Payment history / receipt | Fees | `GET /student/payments/history`, `/payments/{txnId}/receipt` |

### 6.2 PARENT
Lands on children overview; each child's data via `{studentId}` path.
`GET /parent/children`, then per child: `/attendance?month=`, `/homework`, `/results`,
`/fees`, `/teachers`, `/classwork`, `/announcements`; submit homework via
`POST /parent/children/{studentId}/homework/{homeworkId}/submit`.

### 6.3 TEACHER (logs in by employee ID)
Lands on teacher dashboard; scoped to their assignments and class-teacher sections.

| Can do | API flow |
|---|---|
| Dashboard / my assignments / my class-sections | `GET /teacher/dashboard`, `/my-assignments`, `/my-class-sections` |
| **Mark attendance** | roster `GET /admin/sections/{sectionId}/students` → `POST /teacher/attendance` (`BulkAttendanceRequest`, status P/A/L/HALF_DAY/LEAVE) |
| **Enter exam marks** | pick exam `GET /exams/section/{id}` → `POST /teacher/marks` (`BulkMarksRequest`) |
| **Send notification / announcement** | `POST /teacher/announcements` (whole class / section / one student via `studentId`) |
| Assign homework / classwork | `POST /teacher/homework`, `POST /teacher/classwork` |
| Review submissions | `GET /homework/{id}/submissions`, `PATCH /homework/submissions/{id}/review` |
| Lesson plans | `POST/GET /teacher/lesson-plans`, topic progress `PATCH …/topics/{topicId}/progress` |
| View a student card (read-only) | `GET /teacher/students/{studentId}` |

Class-teacher scoping: a teacher only sees/acts on sections where they are assigned; class
teachers get the extra section-wide actions.

### 6.4 SCHOOL ADMIN (logs in by email)
Full school console (`MainLayout`, routes under `/`).

| Area | APIs |
|---|---|
| Dashboard | `GET /dashboard` |
| Classes & sections | `/admin/classes`, `/admin/classes/{id}/sections`, `/admin/sections/*` |
| Students (admission) | `POST/GET /admission/students`, detail/update, partial updates (`/contact`,`/medical`,`/transport`,`/guardians`), lifecycle (`admit/enroll/promote/transfer/dropout/...`), reset password |
| Teachers & subjects | `/admin/teachers*`, `/admin/subjects*`, assignments, set class teacher |
| Employees (role-scoped staff) | `POST/GET /employees` |
| Communications | broadcast `POST /notifications/broadcast`, sent history, circulars, events, attachments |
| Fees (also Accountant) | see 6.5 |

### 6.5 ACCOUNTANT / FINANCE (logs in by employee ID)
Scoped to money only. Endpoints require
`ACCOUNTANT/SCHOOL_ADMIN/SUPER_ADMIN and !SUPPORT_STAFF`.
- Fees: `/fees`, `/fees/summary`, `/fees/pending`, `/fees/payment`, `/fees/{id}/adjust`,
  `/fees/section/{id}/summary`.
- Templates: `/admin/fee-templates*` (apply to class/section/student).
- Online payments & reconciliation: `/admin/finance/*` (payments, refunds, recon runs &
  exceptions, settlement import, bank CSV import, gateway keys).

### 6.6 TRANSPORT MANAGER (logs in by employee ID)
Scoped to transport only.
- Students + routes: `GET /transport/students?classId=&sectionId=&routeId=&search=`
- Assign/change route: `PUT /transport/students/{profileId}/assign`
- Routes CRUD: `/transport/routes*`; bus live location: `/bus/*`.

### 6.7 SUPPORT STAFF (logs in by employee ID)
Inherits admin screens **except** fees/finance (denied by `!hasRole('SUPPORT_STAFF')`).
Use for front-desk/ops staff who manage students, academics, comms but not money.

### 6.8 LIBRARIAN
Library only: `/library/books` (list/add), `/library/issue`, `/library/return/{id}`,
`/library/student/{id}/issued|history`.

### 6.9 SUPER ADMIN (platform, not a tenant)
Platform console (`/admin` in web). Not tenant-scoped — `schoolId` is a path var.
- Schools: create, list, detail, update, config/legal, status (activate/suspend/terminate),
  alerts (`/super/schools/alerts`), export, history.
- Admins per school: create, list, reset password, enable/disable.
- Subscriptions & billing: assign/renew plan, invoices (issue/mark-paid), plans CRUD.
- Platform stats: `/super/stats`.
- **Operations / error tracking**: `/super/operations/{summary,errors,errors/{id},
  errors/{id}/resolve,services}` — per-school failure dashboard.

---

## 7. Cross-cutting features

### 7.1 Online payments & reconciliation (`payment/` package)
Student self-pay via **Razorpay**, integrated by **direct REST + HMAC-SHA256** (no SDK).
Each school stores its own Razorpay keys (AES-GCM encrypted by `CryptoService`).
Flow: create order → Razorpay Checkout → verify signature → allocate to fees.
`RazorpayWebhookController` (`/api/v1/webhooks/razorpay`, public, signature-verified) ingests
events. **3-way reconciliation**: internal payments ↔ gateway settlement ↔ bank statement,
with exceptions workflow and refunds. Admin UI: Finance → Payment Reconciliation.

### 7.2 Notifications, circulars, attachments
- Broadcast with audience targeting (`ALL_SCHOOL/TEACHERS/CLASS/SECTION_STUDENTS/STUDENT/
  FEE_DEFAULTERS/...`) + optional attachment + schedule.
- Notifications inbox: list, unread-count, mark-read, register push device (Firebase).
- **Attachments** stored as bytes in the DB (no disk). Upload `POST /attachments` →
  `{id,url,fileName,...}`; reference `url`/`fileName` on announcements/notifications/circulars;
  download `GET /attachments/{id}` streams raw bytes.
- Email: Gmail SMTP for temp-password emails (needs `MAIL_PASSWORD` app-password).

### 7.3 Subscription enforcement
Expired/suspended tenants are blocked at **login** and per **request** (`TenantStatusChecker`,
5-min cache); Super Admin can auto-suspend. Schools near limits/expiry surface in the
Super Admin **alerts** view.

### 7.4 Operations / error tracking (`ops/` package)
`RequestContextFilter` (bean name `opsRequestIdFilter`, highest precedence) adds
`requestId`/`traceId` to MDC and the `X-Request-Id` response header. `ErrorTrackingService`
(`REQUIRES_NEW`, dedup by fingerprint) persists failures per school into `system_error_logs`;
surfaced via the Super Admin Operations dashboard.

---

## 8. Frontend architecture (SmsWeb)

- **Auth**: `store/slices/authSlice.ts` holds user + tokens; `hooks/useAuth.ts`;
  `pages/auth/LoginPage.tsx`. After login, role decides the landing area.
- **Routing/gating**: `routes/ProtectedRoute.tsx` gates by role; `layouts/MainLayout.tsx`
  (staff/admin shell) vs `layouts/StudentLayout.tsx` (mobile-style student shell).
- **API layer**: `api/client.ts` = axios with relative `BASE_URL` (`VITE_API_BASE_URL`,
  normally empty so calls go through the Vite proxy / same origin) and **single-flight token
  refresh** (shared in-flight promise so concurrent 401s trigger one refresh). One
  `api/*.api.ts` per domain (e.g. `teacher.api.ts`, `payments.api.ts`, `superadmin.api.ts`).
- **Data fetching**: React Query v5 (`useQuery`/`useMutation`) over those api modules.
- **Pages** mirror personas: `pages/student/*`, `pages/teacher/*`, `pages/superadmin/*`,
  `pages/fees/*`, `pages/finance/*`, `pages/transport/*`, `pages/admission/*`, …
- **Env** (`SmsWeb/.env`): keep `VITE_API_BASE_URL` **empty** for same-origin/proxy;
  `VITE_PROXY_TARGET` → backend; `VITE_TUNNEL_HOST` only when serving the web app through a
  tunnel (HMR over wss). `vite.config.ts` has `host:true`, `allowedHosts:true`, proxy
  `/api`+`/ws` → backend.

---

## 9. Running the app

**Backend** (defaults to `pg` profile → PostgreSQL):
```bash
cd SmsCore
mvn spring-boot:run
```
Validation-only compile (user runs the real restart themselves):
```bash
mvn -q -o compile
```

**Frontend**:
```bash
cd SmsWeb
npm run dev      # Vite on :3000, proxies /api + /ws to :8080
```
Type-check:
```bash
npx tsc --noEmit
```

**External access (dev tunnels)** — stable named tunnels:
```bash
devtunnel host sms-api    # API on :8080 → https://kkhwdk54-8080.inc1.devtunnels.ms
devtunnel host sms-app    # web app on :3000
```
Non-browser clients must send `X-Tunnel-Skip-AntiPhishing-Page: true`.

---

## 10. How to make changes (recipes for AI edits)

**Add a new endpoint**
1. DTOs in `dto/request` / `dto/response`.
2. Business logic in a `service/impl/*ServiceImpl` (read `schoolId` from `TenantContext`).
3. Controller method: thin, `@PreAuthorize(...)`, return `ApiResponse.success(data)`.
4. Match an existing controller's conventions (base path, roles, `@Operation`).
5. Validate: `mvn -q -o compile`.

**Add a role-scoped feature**
- Gate with `@PreAuthorize("hasAnyRole(...)")`; to *exclude* Support Staff from money
  features, append `and !hasRole('SUPPORT_STAFF')` (role hierarchy otherwise grants it).
- Remember Super Admin is **not** tenant-scoped (path-var `schoolId`); all others derive it
  from `TenantContext`.

**Wire it into the frontend**
1. Add a function to the matching `api/*.api.ts`.
2. Use it via React Query in a page under the right persona folder.
3. Add the route + guard in `routes`/nav for the allowed roles.
4. Type-check: `npx tsc --noEmit`.

**DB / migration gotchas (seen before)**
- `ddl-auto: update` won't backfill a new **non-null** column on a populated table — give a
  `columnDefinition` default (e.g. `boolean not null default false`).
- Enum-vs-string in repository query params: match the Java type (pass `RoleName`, not a
  `String`).
- JSONB columns: this codebase stores some as `text` + explicit `ALTER` in `DataInitializer`
  to avoid `jsonb vs varchar` mismatches.
- Postgres `lower(bytea)` error on search: coalesce null search terms to `""`.
- Bean-name collisions with Spring built-ins: give filters an explicit unique
  `@Component("name")` (e.g. `opsRequestIdFilter`).

**Conventions**
- Every endpoint returns `ApiResponse<T>`. Don't leak entities where a response DTO exists.
- Keep controllers thin; logic in services; one api module + page folder per domain on the
  web side. Match the surrounding code's style.

---

## 11. Known behaviors worth remembering

- Attendance UI offers **P / A / L** (L = Leave); do **not** default everyone to Present.
- Results are only visible to students/parents **after publish**
  (`PATCH /exams/results/{id}/publish`).
- Fee "Total Outstanding" per student is shown as the **same accumulated total on every row**
  of that student (a deliberate UI decision).
- Access tokens expire in 15 min — clients must implement refresh-and-retry.
- The web app uses a single-flight refresh; a mobile client should too.

---

*Keep this document current. When you change a flow, role rule, or endpoint, update the
relevant section here and in `API-GUIDE.md` in the same change so the next agent inherits an
accurate map.*
