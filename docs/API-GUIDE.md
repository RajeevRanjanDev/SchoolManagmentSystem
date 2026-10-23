# School Management System — Mobile App API Guide

A complete guide for building a mobile (or any third-party) app on top of the SMS backend.
It walks from **login → authentication → role-based routing → functionality-wise API usage**
(e.g. "teacher marks attendance", "teacher sends a notification", "student pays fees"),
and ends with a full endpoint reference.

> Everything here reflects the real controllers in `SmsCore` — nothing is invented.

---

## 1. Getting started

### 1.1 Base URL

| Environment | Base URL |
|---|---|
| Local (same machine) | `http://localhost:8080` |
| External dev tunnel (stable) | `https://kkhwdk54-8080.inc1.devtunnels.ms` |

All API paths below are **relative to the base URL**, e.g. login is
`POST {BASE_URL}/api/v1/auth/login`.

### 1.2 Required headers

| Header | When | Value |
|---|---|---|
| `Content-Type` | Every request with a JSON body | `application/json` |
| `Authorization` | Every endpoint except the public ones (§2.1) | `Bearer {accessToken}` |
| `X-Tunnel-Skip-AntiPhishing-Page` | **Only** when calling through the `*.devtunnels.ms` URL from a non-browser client (mobile app, Postman) | `true` |

> The dev-tunnel header is essential for native apps: without it the tunnel returns an
> HTML anti-phishing interstitial instead of your JSON. It is harmless on localhost.

### 1.3 Standard response envelope

**Every** endpoint returns this wrapper (two exceptions: attachment download streams raw
bytes, and the Razorpay webhook returns a plain string):

```json
{
  "success": true,
  "message": "OK",
  "data": { },
  "timestamp": "2026-10-21T10:15:30"
}
```

- On success → `success: true`, payload in `data`.
- On error → `success: false`, human message in `message`, `data` usually `null`.
  HTTP status reflects the error (400 validation, 401 unauthenticated, 403 wrong role,
  404 not found, 409 conflict). **Always read `message` to show the user a real error.**

Mobile client rule of thumb: parse the envelope once, then work with `.data`.

---

## 2. Authentication

### 2.1 Public endpoints (no token)

| Purpose | Call |
|---|---|
| Login | `POST /api/v1/auth/login` |
| Refresh access token | `POST /api/v1/auth/refresh` |
| Forgot password (email a temp password) | `POST /api/v1/auth/forgot-password` |
| Login-screen branding by school code | `GET /api/v1/public/school/{code}/branding` |
| Razorpay webhook (server-to-server) | `POST /api/v1/webhooks/razorpay` |

Everything else needs a valid `Bearer` token.

### 2.2 Login

`POST /api/v1/auth/login`

```json
{
  "email": "ABC-2025-0001",
  "password": "secret123"
}
```

> The field is named `email` but accepts **either an email or a login ID** (see §3.1).
> There is no email-format validation on it.

**Response** (`data`):

```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci...",
  "tokenType": "Bearer",
  "userId": 42,
  "schoolId": 7,
  "email": "student@school.com",
  "fullName": "Ramesh Kumar",
  "roles": ["ROLE_STUDENT"]
}
```

- Store `accessToken` and `refreshToken` securely (e.g. encrypted keystore / Keychain).
- Send `Authorization: Bearer {accessToken}` on every authenticated call.
- `roles` drives which app experience to show (see §3). **Note the `ROLE_` prefix.**
- `schoolId` is the tenant; `userId` is the logged-in user. You rarely need to send these —
  the backend derives the tenant/user from the token itself.

### 2.3 Using the token

Add this header to every non-public request:

```
Authorization: Bearer eyJhbGci...
```

A missing/invalid/expired token → **401**. That is your signal to refresh (§2.4).

### 2.4 Refreshing the token

Access tokens are short-lived. When a call returns 401, exchange the refresh token:

`POST /api/v1/auth/refresh`

```json
{ "refreshToken": "eyJhbGci..." }
```

Returns a **new** `AuthResponse` (new access **and** refresh token — refresh tokens are
rotated and single-per-user, so always replace both). Then retry the original request once.

> Mobile pattern: a single-flight refresh. If several requests 401 at once, run **one**
> refresh and let the others wait on it, then retry. (The web client does exactly this.)

### 2.5 Logout

`POST /api/v1/auth/logout` (with the current Bearer token, no body) — invalidates the
server-side refresh token. After this, clear both tokens locally.

### 2.6 Forgot password

`POST /api/v1/auth/forgot-password`

```json
{ "identifier": "ABC-2025-0001" }
```

`identifier` = email **or** login ID. The server emails a temporary password to the
on-file email and returns success **even if no account matches** (so it never leaks whether
an identifier exists). Tell the user "if an account exists, a reset email was sent".

### 2.7 Change password (logged in)

Students: `POST /api/v1/student/change-password` with `ChangePasswordRequest`.

---

## 3. Role-based login & routing

### 3.1 What each role logs in with

The login identifier resolves as **username first, email fallback**
(`findByUsername(input).or(findByEmail(input))`). So:

| Role | Logs in with | Format / example |
|---|---|---|
| Super Admin | **Email** | `superadmin@platform.com` |
| School Admin | **Email** | `admin@school.com` |
| Accountant / Transport Mgr / Support Staff / Librarian (employees) | **Employee login ID** | `{schoolCode}-{TE\|SS}-{year}-{seq}` → `ABC-TE-2025-001` (tag `SS` for Support Staff, else `TE`) |
| Teacher | **Employee login ID** | `ABC-TE-2025-001` |
| Student | **Admission number** | `{schoolCode}-{year}-{seq}` → `ABC-2025-0001` |
| Parent | Email / configured username | — |

All of them use the **same** `POST /api/v1/auth/login` — only the identifier differs.

### 3.2 Reading the role in your app

From the login response, `roles` is a set of Spring authorities **with the `ROLE_` prefix**,
e.g. `["ROLE_TEACHER"]`. Strip `ROLE_` for comparison, or match on the full string.

Alternatively, `GET /api/v1/me/profile` returns the user profile **plus** a single bare
`role` (no prefix, e.g. `"TEACHER"`) and the school branding — convenient for the first
screen after login.

### 3.3 Login gating (important for UX)

After the credentials pass, login is still **rejected** when the user's school is
`SUSPENDED` / `TERMINATED` or the subscription has expired (`subscriptionExpiry < today`).
Super Admin (no school) is exempt. Surface the `message` from the 4xx so the user knows it's
a subscription/suspension issue, not a wrong password.

### 3.4 The roles

`SUPER_ADMIN, SCHOOL_ADMIN, TEACHER, PARENT, ACCOUNTANT, LIBRARIAN, TRANSPORT_MANAGER,
SUPPORT_STAFF, STUDENT`. (Authorization checks also mention `PRINCIPAL, DEAN,
ADMISSION_OFFICER, HR_MANAGER` on some admin/HR endpoints — treat these as elevated
staff roles if you seed them.)

### 3.5 Which home screen per role

| Role | Land on | Primary APIs |
|---|---|---|
| STUDENT | Student dashboard | `/api/v1/student/*` |
| PARENT | Children overview | `/api/v1/parent/*` |
| TEACHER | Teacher dashboard | `/api/v1/teacher/*` |
| SCHOOL_ADMIN | Admin dashboard | `/api/v1/dashboard`, `/api/v1/admin/*`, `/api/v1/admission/*` |
| ACCOUNTANT | Fees & reconciliation | `/api/v1/fees/*`, `/api/v1/admin/finance/*` |
| TRANSPORT_MANAGER | Transport | `/api/v1/transport/*`, `/api/v1/bus/*` |
| LIBRARIAN | Library | `/api/v1/library/*` |
| SUPER_ADMIN | Platform console | `/api/v1/super/*` |

---

## 4. Functionality-wise API usage (the core of this guide)

Each flow lists the APIs **in call order**. All require the `Bearer` token.

### 4.1 STUDENT

**See my dashboard / home**
→ `GET /api/v1/student/dashboard` (attendance %, outstanding fee, today's items).

**My profile (incl. transport details)**
→ `GET /api/v1/student/me` (includes `routeName`, `stopName`, `pickupPoint`, `transportType`).

**View my fees**
→ `GET /api/v1/student/fees` → list of `FeeResponse` (amount, paid, balance, status).

**View my attendance (with chart data)**
→ `GET /api/v1/student/attendance` (summary %, monthly buckets, recent days).

**View homework / classwork**
→ `GET /api/v1/student/assignments`.

**View my results / report card**
→ `GET /api/v1/student/results` (only published results appear).

**View notices / circulars**
→ `GET /api/v1/student/circulars` (categorised: circular, fee reminder, exam, etc.).

**Change my password**
→ `POST /api/v1/student/change-password`.

**Pay fees online (Razorpay)** — 3 steps:
1. `POST /api/v1/student/payments/orders` with `{ "feeIds": [101, 102] }`
   → returns `razorpayOrderId`, `amount` (paise), `razorpayKeyId`, prefill fields.
2. Open Razorpay Checkout in the app (SDK/WebView) using those values. The user pays.
3. `POST /api/v1/student/payments/verify` with
   `{ paymentAttemptId, razorpayOrderId, razorpayPaymentId, razorpaySignature }`
   → verifies the signature and allocates the payment to the fees.

**Payment history / receipt**
→ `GET /api/v1/student/payments/history`;
→ `GET /api/v1/student/payments/{txnId}/receipt`.

### 4.2 PARENT

**My children** → `GET /api/v1/parent/children`.
Then per child (`{studentId}`):
- Attendance → `GET /api/v1/parent/children/{studentId}/attendance?month=yyyy-MM`
- Homework → `GET /api/v1/parent/children/{studentId}/homework?academicYear=...`
- Submit homework → `POST /api/v1/parent/children/{studentId}/homework/{homeworkId}/submit`
- Results → `GET /api/v1/parent/children/{studentId}/results`
- Fees → `GET /api/v1/parent/children/{studentId}/fees?academicYear=...`
- Teachers → `GET /api/v1/parent/children/{studentId}/teachers`
- Classwork → `GET /api/v1/parent/children/{studentId}/classwork`
- Announcements → `GET /api/v1/parent/children/{studentId}/announcements`

### 4.3 TEACHER

**Open my dashboard** → `GET /api/v1/teacher/dashboard?academicYear=...`.

**My class/subject assignments** → `GET /api/v1/teacher/my-assignments`.
**Sections where I'm class teacher** → `GET /api/v1/teacher/my-class-sections`.

**Teacher marks attendance** — 2 steps:
1. Get the roster: `GET /api/v1/admin/sections/{sectionId}/students`
   (or use the section list from `my-class-sections`).
2. Submit: `POST /api/v1/teacher/attendance` with `BulkAttendanceRequest`:
```json
{
  "sectionId": 12,
  "attendanceDate": "2026-10-21",
  "entries": [
    { "studentId": 101, "status": "PRESENT", "remarks": "" },
    { "studentId": 102, "status": "ABSENT",  "remarks": "sick" },
    { "studentId": 103, "status": "LEAVE",   "remarks": "approved" }
  ]
}
```
`status` ∈ `PRESENT | ABSENT | LATE | HALF_DAY | LEAVE`.
(UI convention in this app: offer **P / A / L** where L = Leave. Don't default everyone to present.)

**Teacher enters exam marks** — 2 steps:
1. Pick the exam for the section: `GET /api/v1/exams/section/{sectionId}?academicYear=...`.
2. `POST /api/v1/teacher/marks` with `BulkMarksRequest`:
```json
{
  "examId": 55,
  "entries": [
    { "studentId": 101, "marksObtained": 87.5, "grade": "A", "remarks": "" }
  ]
}
```
To publish results so students/parents can see them: `PATCH /api/v1/exams/results/{resultId}/publish` (admin).

**Teacher sends a notification / class announcement**
→ `POST /api/v1/teacher/announcements` with `CreateClassAnnouncementRequest`:
```json
{
  "classId": 3,
  "sectionId": 12,      // null = whole class
  "studentId": null,    // set to target ONE student
  "title": "Bring sports kit",
  "content": "PT tomorrow at 9am",
  "attachmentUrl": null,
  "attachmentName": null,
  "published": true
}
```
To attach a PDF/image first upload it (§4.8), then pass the returned `url`/`fileName` as
`attachmentUrl`/`attachmentName`.

**Teacher assigns homework / classwork**
→ `POST /api/v1/teacher/homework` (`CreateHomeworkRequest`);
→ `POST /api/v1/teacher/classwork` (`CreateClassworkRequest`).
List back: `GET /api/v1/teacher/homework?sectionId=...`, `GET /api/v1/teacher/classwork?sectionId=...`.

**Teacher reviews homework submissions**
→ `GET /api/v1/homework/{homeworkId}/submissions`;
→ `PATCH /api/v1/homework/submissions/{submissionId}/review`.

**Lesson plans**
→ `POST /api/v1/teacher/lesson-plans`; list `GET /api/v1/teacher/lesson-plans`;
update topic progress `PATCH /api/v1/teacher/lesson-plans/{planId}/topics/{topicId}/progress`.

**View a student card (read-only)**
→ `GET /api/v1/teacher/students/{studentId}`.

### 4.4 SCHOOL ADMIN

**Dashboard** → `GET /api/v1/dashboard`.

**Classes & sections**
- List classes → `GET /api/v1/admin/classes`
- Create class → `POST /api/v1/admin/classes`
- Sections of a class → `GET /api/v1/admin/classes/{classId}/sections`
- Create section → `POST /api/v1/admin/classes/{classId}/sections`
- Section roster → `GET /api/v1/admin/sections/{sectionId}/students`

**Admit / manage students**
- Register → `POST /api/v1/admission/students` (`RegisterStudentRequest`)
- List / search → `GET /api/v1/admission/students?search=&classId=&sectionId=&status=`
- Full profile → `GET /api/v1/admission/students/{id}`
- Update profile → `PUT /api/v1/admission/students/{id}`
- Update just contact (mobile/email) → `PUT /api/v1/admission/students/{id}/contact`
- Update medical → `PUT /api/v1/admission/students/{id}/medical`
- Update transport → `PUT /api/v1/admission/students/{id}/transport`
- Reset student password (emails temp) → `POST /api/v1/admission/students/{id}/reset-password`
- Lifecycle: `admit`, `enroll`, `assign-class`, `promote`, `transfer`, `dropout`, etc.
  (see §5.8).

**Teachers & subjects**
- Create teacher → `POST /api/v1/admin/teachers`
- List teachers → `GET /api/v1/admin/teachers`
- Reset teacher password → `POST /api/v1/admin/teachers/{teacherId}/reset-password`
- Subjects → `POST/GET /api/v1/admin/subjects`
- Assign teacher to class/section/subject → `POST /api/v1/admin/teachers/{teacherId}/assignments`
- Set class teacher → `PATCH /api/v1/admin/assignments/{assignmentId}/class-teacher`

**Employees (role-scoped staff)**
- Register → `POST /api/v1/employees`; list → `GET /api/v1/employees`.

**Admin sends a school-wide notification (broadcast)**
→ `POST /api/v1/notifications/broadcast` with `BroadcastNotificationRequest`:
```json
{
  "title": "Holiday notice",
  "body": "School closed Friday",
  "type": "GENERAL",
  "audience": "ALL_SCHOOL",
  "classId": null, "sectionId": null, "studentId": null,
  "feeType": null, "scheduledAt": null,
  "attachmentUrl": null, "attachmentName": null
}
```
`audience` ∈ `ALL_SCHOOL | TEACHERS | CLASS_TEACHERS | CLASS | CLASS_STUDENTS |
SECTION_STUDENTS | STUDENT | FEE_DEFAULTERS` (set the matching id field for targeted ones;
`FEE_DEFAULTERS` can use `feeType` = `TUITION | TRANSPORT | ANY`).
Sent history → `GET /api/v1/notifications/sent`.

**Admin publishes a circular** → `POST /api/v1/circulars?title=&content=&publish=true`.

### 4.5 ACCOUNTANT / FINANCE

(Finance endpoints require `ACCOUNTANT`/`SCHOOL_ADMIN`/`SUPER_ADMIN` **and not** `SUPPORT_STAFF`.)

**Fee management**
- All fees → `GET /api/v1/fees?status=&academicYear=`
- Summary → `GET /api/v1/fees/summary?academicYear=`
- Create fee → `POST /api/v1/fees`
- Record a payment → `POST /api/v1/fees/payment`
- Pending fees → `GET /api/v1/fees/pending`
- Per-student fees → `GET /api/v1/fees/student/{studentId}`
- Per-section per-student totals → `GET /api/v1/fees/section/{sectionId}/summary`
- Discount / waive → `POST /api/v1/fees/{feeId}/adjust?discount=&waiveRemaining=&remarks=`

**Fee templates**
- List/create → `GET/POST /api/v1/admin/fee-templates`
- Apply to class/section/student → `POST /api/v1/admin/fee-templates/{id}/apply` (`ApplyFeeTemplateRequest`)
- Generate for a class → `POST /api/v1/admin/fee-templates/{id}/assign/class/{classId}`

**Online payments & reconciliation**
- Set Razorpay keys for the school → `POST /api/v1/admin/finance/gateway-accounts`
- Search online payments → `GET /api/v1/admin/finance/payments?page=&size=`
- Refund → `POST /api/v1/admin/finance/payments/{id}/refunds`
- Recon summary → `GET /api/v1/admin/finance/reconciliation`
- Start a recon run → `POST /api/v1/admin/finance/reconciliation/runs?from=&to=`
- Exceptions → `GET /api/v1/admin/finance/reconciliation/exceptions?status=`;
  resolve → `POST /api/v1/admin/finance/reconciliation/exceptions/{id}/resolve`
- Import settlements → `POST /api/v1/admin/finance/settlements/import?from=&to=`
- Import bank CSV (multipart) → `POST /api/v1/admin/finance/bank-statement/import` (field `file`)

### 4.6 TRANSPORT MANAGER

- Students + their route/pickup → `GET /api/v1/transport/students?classId=&sectionId=&routeId=&search=`
- Assign / change a student's route → `PUT /api/v1/transport/students/{profileId}/assign` (`TransportInfoRequest`)
- Routes → `GET/POST /api/v1/transport/routes`, `PUT/DELETE /api/v1/transport/routes/{id}`
- Live bus location → `POST /api/v1/bus/location`; `GET /api/v1/bus/live-location/{vehicleId}`

### 4.7 SUPER ADMIN (platform)

- Create school/tenant → `POST /api/v1/super/schools`
- List schools → `GET /api/v1/super/schools?status=&search=&page=&size=`
- Schools in alert state → `GET /api/v1/super/schools/alerts`
- Change status (activate/suspend/terminate) → `PATCH /api/v1/super/schools/{schoolId}/status`
- Create school admin → `POST /api/v1/super/schools/{schoolId}/admin`
- Subscription assign/renew → `POST /api/v1/super/schools/{schoolId}/subscription[/renew]`
- Invoices → `GET/POST /api/v1/super/schools/{schoolId}/invoices`; mark paid → `.../invoices/{invoiceId}/paid`
- Plans → `GET /api/v1/super/all-plans`, `POST /api/v1/super/plans`
- Platform stats → `GET /api/v1/super/stats`
- Operations / error tracking → `GET /api/v1/super/operations/summary`,
  `/errors`, `/errors/{id}`, `POST /errors/{id}/resolve`, `/services`

### 4.8 Attachments (shared — teacher & admin)

Used to attach PDFs/images to announcements, notifications, circulars.

1. Upload (multipart, field `file`, ≤10MB, roles SCHOOL_ADMIN/SUPER_ADMIN/TEACHER/ADMISSION_OFFICER):
   `POST /api/v1/attachments` → returns `{ id, url, fileName, contentType, sizeBytes }`.
2. Use the returned `url` + `fileName` as `attachmentUrl` / `attachmentName` on the
   announcement/notification/circular.
3. Download (any authenticated user): `GET /api/v1/attachments/{id}` — streams raw bytes
   (not wrapped in `ApiResponse`).

### 4.9 Notifications inbox (all roles)

- My notifications (paged) → `GET /api/v1/notifications`
- Unread count → `GET /api/v1/notifications/unread-count`
- Mark read → `PATCH /api/v1/notifications/{id}/read`
- Register a push device token → `POST /api/v1/notifications/device` (`RegisterDeviceRequest`)

---

## 5. Endpoint reference (grouped)

Legend: **auth** = any valid token; roles shown otherwise. All paths are under `{BASE_URL}`.
All return `ApiResponse<…>` unless noted.

### 5.1 Auth & profile
| Method | Path | Roles | Purpose |
|---|---|---|---|
| POST | `/api/v1/auth/login` | public | Login |
| POST | `/api/v1/auth/refresh` | public | Refresh token |
| POST | `/api/v1/auth/forgot-password` | public | Email temp password |
| POST | `/api/v1/auth/logout` | auth | Invalidate refresh token |
| GET | `/api/v1/public/school/{code}/branding` | public | Login branding |
| GET | `/api/v1/me/profile` | auth | Profile + branding (bare `role`) |

### 5.2 Student portal
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/student/me` | Profile (incl. transport) |
| GET | `/api/v1/student/dashboard` | Home snapshot |
| GET | `/api/v1/student/fees` | Fees |
| GET | `/api/v1/student/attendance` | Attendance + chart data |
| GET | `/api/v1/student/assignments` | Homework/classwork |
| GET | `/api/v1/student/results` | Results |
| GET | `/api/v1/student/circulars` | Notices |
| POST | `/api/v1/student/change-password` | Change password |
| POST | `/api/v1/student/payments/orders` | Create Razorpay order |
| POST | `/api/v1/student/payments/verify` | Verify payment |
| GET | `/api/v1/student/payments/history` | Payment history |
| GET | `/api/v1/student/payments/{txnId}/receipt` | Receipt |

### 5.3 Parent
| Method | Path |
|---|---|
| GET | `/api/v1/parent/children` |
| GET | `/api/v1/parent/children/{studentId}/attendance?month=yyyy-MM` |
| GET | `/api/v1/parent/children/{studentId}/homework?academicYear=` |
| POST | `/api/v1/parent/children/{studentId}/homework/{homeworkId}/submit` |
| GET | `/api/v1/parent/children/{studentId}/results` |
| GET | `/api/v1/parent/children/{studentId}/fees?academicYear=` |
| GET | `/api/v1/parent/children/{studentId}/teachers` |
| GET | `/api/v1/parent/children/{studentId}/classwork` |
| GET | `/api/v1/parent/children/{studentId}/announcements` |

### 5.4 Teacher
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/teacher/dashboard` | Dashboard |
| GET | `/api/v1/teacher/my-assignments` | Assignments |
| GET | `/api/v1/teacher/my-class-sections` | Class-teacher sections |
| GET | `/api/v1/teacher/students/{studentId}` | Student card |
| POST/GET | `/api/v1/teacher/homework` | Create/list homework |
| POST/GET | `/api/v1/teacher/classwork` | Create/list classwork |
| POST | `/api/v1/teacher/attendance` | Bulk attendance |
| POST | `/api/v1/teacher/marks` | Bulk marks |
| POST/GET | `/api/v1/teacher/announcements` | Post/list announcements |
| * | `/api/v1/teacher/lesson-plans[...]` | Lesson plans |

### 5.5 Attendance / Exams / Homework
| Method | Path | Roles | Purpose |
|---|---|---|---|
| POST | `/api/v1/attendance/mark` | TEACHER/ADMIN | Mark attendance (alt DTO) |
| GET | `/api/v1/attendance/section/{sectionId}?date=` | auth | Section attendance |
| GET | `/api/v1/attendance/student/{studentId}?from=&to=` | auth | Student attendance |
| GET | `/api/v1/attendance/student/{studentId}/percentage?from=&to=` | auth | % |
| POST | `/api/v1/exams` | TEACHER/ADMIN | Schedule exam |
| GET | `/api/v1/exams/section/{sectionId}?academicYear=` | auth | Exams |
| POST | `/api/v1/exams/{examId}/results/bulk` | TEACHER/ADMIN | Bulk results |
| PATCH | `/api/v1/exams/results/{resultId}/publish` | TEACHER/ADMIN | Publish one result |
| PATCH | `/api/v1/exams/{examId}/results/publish-all` | TEACHER/ADMIN | Publish all results of an exam (one tap) |
| GET | `/api/v1/exams/results/student/{studentId}` | auth | Student results |
| POST/GET | `/api/v1/homework` | TEACHER/ADMIN | Homework |
| GET | `/api/v1/homework/{homeworkId}/submissions` | TEACHER/ADMIN | Submissions |
| PATCH | `/api/v1/homework/submissions/{submissionId}/review` | TEACHER/ADMIN | Review |

### 5.6 Fees & finance
| Method | Path | Purpose |
|---|---|---|
| POST/GET | `/api/v1/fees` | Create/list fees |
| GET | `/api/v1/fees/summary` | Summary |
| POST | `/api/v1/fees/payment` | Record payment |
| GET | `/api/v1/fees/pending` | Pending |
| GET | `/api/v1/fees/student/{studentId}` | Student fees |
| GET | `/api/v1/fees/section/{sectionId}/summary` | Section totals |
| POST | `/api/v1/fees/{feeId}/adjust` | Discount/waive |
| * | `/api/v1/admin/fee-templates[...]` | Templates |
| * | `/api/v1/admin/finance/[...]` | Online payments, reconciliation, gateway keys |

### 5.7 Notifications / circulars / events / attachments
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/notifications` | Inbox |
| GET | `/api/v1/notifications/unread-count` | Unread count |
| PATCH | `/api/v1/notifications/{id}/read` | Mark read |
| POST | `/api/v1/notifications/device` | Register push device |
| POST | `/api/v1/notifications/broadcast` | Broadcast (ADMIN) |
| GET | `/api/v1/notifications/sent` | Sent history (ADMIN) |
| POST/GET | `/api/v1/circulars` | Circulars |
| POST/GET | `/api/v1/events` + `/{eventId}/photos` | Events |
| POST | `/api/v1/attachments` | Upload file |
| GET | `/api/v1/attachments/{id}` | Download (raw bytes) |

### 5.8 Admission / students lifecycle
Base `/api/v1/admission/students`. Create `POST`; list `GET ?search=&classId=&sectionId=&status=`;
detail `GET /{id}`; update `PUT /{id}`; partial updates `/{id}/contact|medical|transport|guardians`;
`POST /{id}/reset-password`; lifecycle `POST /{id}/{admit|enroll|assign-class|promote|transfer|
dropout|passout|alumni|deactivate}`; roll number `PATCH /{id}/roll-number?rollNumber=`;
history `GET /{id}/history`; documents `POST /{id}/documents`, verify `PATCH /{id}/documents/{documentId}/verify`.

### 5.9 Academic admin
Base `/api/v1/admin` (SCHOOL_ADMIN/SUPER_ADMIN): classes, sections, subjects, teachers,
assignments (see §4.4 / §4.3). Timetable under `/api/v1/timetable`.

### 5.10 Transport / library
Transport `/api/v1/transport/*`, bus `/api/v1/bus/*`; library `/api/v1/library/*`.

### 5.11 Super admin
Base `/api/v1/super/*` (schools, admins, subscriptions, invoices, plans, stats, alerts) and
`/api/v1/super/operations/*` (error tracking). See §4.7.

---

## 6. Mobile integration checklist

1. **Base URL + dev-tunnel header** configured (§1.1–1.2).
2. **Login** → store both tokens securely.
3. **Attach `Authorization: Bearer`** on every call.
4. **401 → refresh once → retry**; refresh fails → send user back to login (§2.4).
5. **Route by `roles`** from the login response (strip `ROLE_`), or by `GET /me/profile` (§3).
6. **Handle gating**: show the server `message` on suspension/expiry login rejections (§3.3).
7. **Parse the envelope**: read `success`/`message`/`data` everywhere (§1.3).
8. **Payments**: order → Checkout → verify (§4.1).
9. **Attachments**: upload first, then reference the returned `url`/`fileName` (§4.8).
10. **Push**: register the device token via `/api/v1/notifications/device`.

---

*Generated from the live `SmsCore` controllers. If an endpoint's behaviour differs from this
doc, the controller is the source of truth.*
