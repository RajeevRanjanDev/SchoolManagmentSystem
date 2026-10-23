# School Management System – Backend

> Multi-Tenant SaaS School ERP | Spring Boot 3 · Java 21 · PostgreSQL · Redis · WebSocket · JWT

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                      REST API Layer                          │
│   /api/v1/auth  /students  /fees  /bus  /library  ...        │
├──────────────────────────────────────────────────────────────┤
│                   Service Layer (Business Logic)             │
│   AuthService  StudentService  FeeService  ...               │
├──────────────────────────────────────────────────────────────┤
│                   Repository Layer (Spring Data JPA)         │
│   StudentRepository  FeeRepository  ...                      │
├──────────────────────────────────────────────────────────────┤
│                   PostgreSQL (Flyway migrations)             │
└──────────────────────────────────────────────────────────────┘

Tenant Isolation:  Every table carries school_id.
                   TenantContext.assertSchoolAccess() enforces it at service level.
```

---

## Tech Stack

| Layer               | Technology              |
|---------------------|-------------------------|
| Language            | Java 21                 |
| Framework           | Spring Boot 3.2         |
| Security            | Spring Security + JWT   |
| ORM                 | Spring Data JPA (Hibernate) |
| Database            | PostgreSQL 16           |
| Migrations          | Flyway                  |
| Cache               | Redis 7                 |
| Real-time           | WebSocket / STOMP       |
| Push Notifications  | Firebase Admin SDK      |
| API Docs            | Springdoc OpenAPI 3 / Swagger UI |
| Build Tool          | Maven                   |
| Container           | Docker + Docker Compose |

---

## Quick Start with Docker

```bash
# 1. Clone / copy the project
cd C:\Users\shipra.k.singh\SMS

# 2. Start all services (Postgres + Redis + App)
docker-compose up --build

# 3. Open Swagger UI
http://localhost:8080/swagger-ui.html
```

---

## Quick Start without Docker (local dev)

### Prerequisites
- Java 21
- Maven 3.9+
- PostgreSQL 16 running locally
- Redis 7 running locally

### Steps

```bash
# 1. Create the database
psql -U postgres -c "CREATE DATABASE sms_db;"
psql -U postgres -c "CREATE USER sms_user WITH PASSWORD 'sms_password';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE sms_db TO sms_user;"

# 2. Set environment variables (or edit application.yml)
set DB_HOST=localhost
set DB_USERNAME=sms_user
set DB_PASSWORD=sms_password

# 3. Run the application
mvn spring-boot:run

# 4. Flyway will auto-run V1 and V2 migration scripts on startup
```

---

## Environment Variables

| Variable               | Default             | Description                      |
|------------------------|---------------------|----------------------------------|
| DB_HOST                | localhost           | PostgreSQL host                  |
| DB_PORT                | 5432                | PostgreSQL port                  |
| DB_NAME                | sms_db              | Database name                    |
| DB_USERNAME            | sms_user            | DB user                          |
| DB_PASSWORD            | sms_password        | DB password                      |
| REDIS_HOST             | localhost           | Redis host                       |
| REDIS_PORT             | 6379                | Redis port                       |
| JWT_SECRET             | (see yml)           | **Change this in production!**   |
| JWT_ACCESS_EXPIRY      | 900000              | Access token TTL (ms) = 15 min   |
| JWT_REFRESH_EXPIRY     | 604800000           | Refresh token TTL (ms) = 7 days  |
| SERVER_PORT            | 8080                | HTTP port                        |
| FIREBASE_CREDENTIALS   | classpath:firebase-service-account.json | Firebase credentials path |

---

## Default Credentials (seed data)

| Role        | Email                  | Password    |
|-------------|------------------------|-------------|
| SUPER_ADMIN | superadmin@sms.com     | Admin@1234  |

---

## Modules & API Routes

### Authentication
```
POST /api/v1/auth/login        – Login (returns access + refresh token)
POST /api/v1/auth/refresh      – Exchange refresh token
POST /api/v1/auth/logout       – Invalidate refresh token
```

### Schools  (SUPER_ADMIN only)
```
POST   /api/v1/schools         – Register school
GET    /api/v1/schools         – List all schools
GET    /api/v1/schools/{id}    – Get school by ID
```

### Users & Roles
```
POST   /api/v1/users           – Create user (SCHOOL_ADMIN)
GET    /api/v1/users           – List users
GET    /api/v1/users/{id}      – Get user
```

### Students
```
POST   /api/v1/students        – Add student
GET    /api/v1/students        – List (paginated)
GET    /api/v1/students/{id}   – Get by ID
GET    /api/v1/students/by-parent/{parentId}
PUT    /api/v1/students/{id}   – Update
DELETE /api/v1/students/{id}   – Soft delete
```

### Attendance
```
POST  /api/v1/attendance/mark
GET   /api/v1/attendance/section/{sectionId}?date=YYYY-MM-DD
GET   /api/v1/attendance/student/{id}?from=…&to=…
GET   /api/v1/attendance/student/{id}/percentage?from=…&to=…
```

### Homework
```
POST  /api/v1/homework
GET   /api/v1/homework/section/{sectionId}?from=…&to=…
```

### Circulars
```
POST  /api/v1/circulars
GET   /api/v1/circulars
```

### Events & Gallery
```
POST  /api/v1/events
GET   /api/v1/events
POST  /api/v1/events/{id}/photos
GET   /api/v1/events/{id}/photos
```

### Timetable
```
POST  /api/v1/timetable
GET   /api/v1/timetable/section/{sectionId}?academicYear=…
GET   /api/v1/timetable/teacher/{teacherId}?academicYear=…
```

### Exams & Results
```
POST  /api/v1/exams
GET   /api/v1/exams/section/{sectionId}?academicYear=…
POST  /api/v1/exams/results
GET   /api/v1/exams/results/student/{id}
PATCH /api/v1/exams/results/{id}/publish
```

### Fee Management
```
GET   /api/v1/fees/student/{id}
GET   /api/v1/fees/student/{id}/year/{year}
POST  /api/v1/fees/payment
GET   /api/v1/fees/history/student/{id}
GET   /api/v1/fees/pending
```

### Bus Tracking
```
POST  /api/v1/bus/location          – GPS update (driver app)
GET   /api/v1/bus/live-location/{vehicleId}

WebSocket: ws://host/ws
Subscribe: /topic/bus/{vehicleId}   – live GPS updates
```

### Library
```
GET   /api/v1/library/books
POST  /api/v1/library/books
POST  /api/v1/library/issue?bookId=&studentId=&dueDate=
PATCH /api/v1/library/return/{issueId}
GET   /api/v1/library/student/{id}/issued
GET   /api/v1/library/student/{id}/history
```

### Notifications
```
GET   /api/v1/notifications
GET   /api/v1/notifications/unread-count
PATCH /api/v1/notifications/{id}/read
POST  /api/v1/notifications/device   – Register FCM token
```

### Dashboard
```
GET   /api/v1/dashboard              – Admin overview stats
```

---

## Multi-Tenancy

Every API call after login carries a JWT whose `schoolId` claim identifies the tenant.

`TenantContext.getCurrentSchoolId()` is called in every service method to scope queries.

`TenantContext.assertSchoolAccess(resourceSchoolId)` throws `403 Forbidden` if a user
from school A tries to access data from school B.

SUPER_ADMIN has a null `schoolId` and can access all schools.

---

## WebSocket (Live Bus Tracking)

```javascript
// JavaScript client example
const client = new StompJs.Client({
  brokerURL: 'ws://localhost:8080/ws/websocket'
});

client.onConnect = () => {
  client.subscribe('/topic/bus/1', message => {
    const location = JSON.parse(message.body);
    console.log('Bus at:', location.latitude, location.longitude);
  });
};

client.activate();
```

---

## Postman Collection

Import `postman/SMS_API_Collection.json` into Postman.
The **Login** request auto-saves the `accessToken` variable
so all other requests are pre-authorized.

---

## Project Structure

```
src/main/java/com/sms/school/
├── config/                  Spring config (Security, Swagger, WebSocket, Audit)
├── controller/              REST controllers (one per module)
├── dto/
│   ├── request/             Incoming request DTOs with @Valid annotations
│   └── response/            Outgoing response DTOs
├── entity/                  JPA entities (one per table)
│   └── enums/               Enumerations (RoleName, AttendanceStatus …)
├── exception/               Custom exceptions + GlobalExceptionHandler
├── repository/              Spring Data JPA repositories
├── security/                JWT provider, filter, UserPrincipal, TenantContext
├── service/                 Service interfaces
│   └── impl/                Service implementations
└── SchoolManagementApplication.java

src/main/resources/
├── application.yml          Main configuration
├── application-test.yml     Test profile (H2)
└── db/migration/
    ├── V1__init_schema.sql  Creates all tables
    └── V2__seed_data.sql    Roles, permissions, SUPER_ADMIN, demo school
```

---

## Roles Summary

| Role             | Key Capabilities                                              |
|------------------|---------------------------------------------------------------|
| SUPER_ADMIN      | Manage schools, create school admins                          |
| SCHOOL_ADMIN     | Full access within their school                               |
| TEACHER          | Attendance, homework, classwork, results, timetable           |
| PARENT           | View child's data, pay fees, track bus, view results          |
| ACCOUNTANT       | Fee management and payment recording                          |
| LIBRARIAN        | Book catalog, issue and return books                          |
| TRANSPORT_MANAGER| Routes, vehicles, GPS updates                                 |
