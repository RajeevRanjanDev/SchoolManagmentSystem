# SMS Mobile App — Complete Application Flow

## Overview
This document describes the complete user journey and application flow for the School Management System (SMS) Admin + Teacher Mobile App. The app serves five roles: SCHOOL_ADMIN, TEACHER, ACCOUNTANT, LIBRARIAN, and TRANSPORT_MANAGER — all from a single codebase with role-based navigation.

---

## 1. App Startup Flow

```
App Launch
    │
    ▼
SplashScreen (2.5s)
    │
    ├── Check SecureStorage for JWT token
    │       │
    │       ├── Token exists → Validate expiry
    │       │       │
    │       │       ├── Token valid → Fetch user profile → Role-Based Dashboard
    │       │       │
    │       │       └── Token expired → Try refresh token
    │       │               │
    │       │               ├── Refresh success → Update token → Dashboard
    │       │               └── Refresh failed → Clear storage → LoginScreen
    │       │
    │       └── No token → LoginScreen
```

---

## 2. Authentication Flow

```
LoginScreen
    │
    ├── User enters email + password
    ├── Validates inputs (non-empty, valid email format)
    │
    ▼
POST /api/v1/auth/login
    │
    ├── Success Response:
    │   {
    │     accessToken, refreshToken, userId,
    │     schoolId, email, fullName, roles
    │   }
    │   │
    │   ├── Store accessToken in SecureStorage (react-native-keychain)
    │   ├── Store refreshToken in SecureStorage
    │   ├── Dispatch authSlice.setCredentials()
    │   └── Navigate to Role-Based Dashboard
    │
    └── Error Response:
        ├── 401 → "Invalid credentials"
        ├── 403 → "Account inactive"
        └── 500 → "Server error, try again"
```

---

## 3. Role-Based Navigation Flow

```
After successful login → read roles from JWT

roles[0] determines root navigator:

  SCHOOL_ADMIN       → AdminNavigator (Drawer + Bottom Tabs)
  TEACHER            → TeacherNavigator (Bottom Tabs)
  ACCOUNTANT         → AccountantNavigator (Bottom Tabs)
  LIBRARIAN          → LibrarianNavigator (Bottom Tabs)
  TRANSPORT_MANAGER  → TransportNavigator (Bottom Tabs)
```

---

## 4. Token Refresh Flow (Automatic)

```
Every API call via Axios interceptor:
    │
    ├── Attach Authorization: Bearer <accessToken>
    │
    ▼
API Response
    │
    ├── 200 → Return data normally
    │
    └── 401 Unauthorized
            │
            ├── POST /api/v1/auth/refresh { refreshToken }
            │       │
            │       ├── Success → update accessToken → retry original request
            │       └── Failure → dispatch logout → navigate to LoginScreen
```

---

## 5. Admin Flow

```
AdminDashboardScreen
    │
    ├── Stats Cards: Total Students, Teachers, Pending Fees,
    │                Attendance %, Active Buses, Homeworks
    │
    ├── Quick Actions
    │   ├── Add Student → AddStudentScreen
    │   │       └── Form → POST /api/v1/students → Success toast
    │   │
    │   ├── Manage Teachers → TeacherManagementScreen
    │   │       ├── List → GET /api/v1/users?role=TEACHER
    │   │       └── Add Teacher → POST /api/v1/users
    │   │
    │   ├── Fee Collection → FeeManagementScreen
    │   │       ├── List pending → GET /api/v1/fees/pending
    │   │       └── Record payment → POST /api/v1/fees/payment
    │   │
    │   ├── Circulars → CircularManagementScreen
    │   │       ├── List → GET /api/v1/circulars
    │   │       └── Create → POST /api/v1/circulars
    │   │
    │   └── Reports → ReportsScreen
    │           └── GET /api/v1/dashboard
    │
    └── Drawer Menu
        ├── Dashboard
        ├── Student Management
        ├── Teacher Management
        ├── Parent Management
        ├── Fee Management
        ├── Timetable
        ├── Library
        ├── Transport
        ├── Events
        ├── Circulars
        ├── Reports & Analytics
        ├── Notifications
        └── Profile
```

---

## 6. Teacher Flow

```
TeacherDashboardScreen
    │
    ├── Today's Classes (from timetable)
    │   └── GET /api/v1/timetable/teacher/{teacherId}
    │
    ├── Quick Actions
    │   ├── Mark Attendance → AttendanceScreen
    │   │       ├── Select Section → list students
    │   │       ├── Mark each student PRESENT/ABSENT/HALF_DAY
    │   │       └── POST /api/v1/attendance/mark
    │   │
    │   ├── Upload Homework → HomeworkScreen
    │   │       ├── Select Section, Subject
    │   │       ├── Fill title, description, due date
    │   │       └── POST /api/v1/homework
    │   │
    │   ├── Upload Results → ResultUploadScreen
    │   │       ├── Select Exam
    │   │       │   └── GET /api/v1/exams/section/{sectionId}
    │   │       ├── Enter marks for each student
    │   │       └── POST /api/v1/exams/results (per student)
    │   │
    │   └── Publish Circular → CircularManagementScreen
    │           └── POST /api/v1/circulars
    │
    └── Bottom Tabs
        ├── Dashboard
        ├── Attendance
        ├── Homework
        ├── Timetable
        └── Profile
```

---

## 7. Attendance Marking Flow

```
AttendanceScreen
    │
    ├── Select Date (default: today)
    ├── Select Section
    │   └── (loaded from user's assigned sections)
    │
    ▼
GET /api/v1/attendance/section/{sectionId}?date={date}
    │
    ├── Pre-populate existing records (if already marked)
    │
    └── Show student list with toggle buttons
        │
        ├── PRESENT (green)
        ├── ABSENT (red)
        └── HALF_DAY (orange)
        │
        ▼
    Submit button
        │
        └── POST /api/v1/attendance/mark
            {
              sectionId,
              attendanceDate,
              studentAttendanceMap: { studentId: "PRESENT"|"ABSENT"|"HALF_DAY" }
            }
            │
            ├── Success → Toast "Attendance marked" + refresh
            └── Error → Show error message
```

---

## 8. Fee Management Flow

```
FeeManagementScreen
    │
    ├── Tabs: All Fees | Pending | Paid
    │
    ├── GET /api/v1/fees/pending → List pending payments
    │
    └── Select student → FeeDetailView
            │
            ├── GET /api/v1/fees/student/{studentId}
            │
            └── "Record Payment" button
                    │
                    ├── Enter amount, payment method (Cash/UPI/Online/Cheque)
                    ├── Enter transaction ID (optional)
                    │
                    └── POST /api/v1/fees/payment
                        {
                          feeId,
                          amountPaid,
                          paymentMethod,
                          transactionId
                        }
```

---

## 9. Bus Tracking Flow (Real-Time)

```
BusTrackingScreen
    │
    ├── Load all routes and vehicles
    ├── Show Google Map
    │
    ├── REST (initial position):
    │   └── GET /api/v1/bus/live-location/{vehicleId}
    │
    └── WebSocket (live updates):
        ├── Connect to ws://server/ws
        ├── Subscribe to /topic/bus/{vehicleId}
        │
        ├── On message → update marker position on map
        └── Animate bus marker movement
        
Transport Manager:
    └── POST /api/v1/bus/location
        { vehicleId, latitude, longitude, timestamp }
```

---

## 10. Library Flow

```
LibraryManagementScreen (LIBRARIAN / ADMIN)
    │
    ├── Tabs: Catalog | Issued | Return
    │
    ├── Catalog Tab
    │   ├── GET /api/v1/library/books (paginated list)
    │   └── "Add Book" → POST /api/v1/library/books
    │           { title, author, isbn, copies }
    │
    ├── Issue Tab
    │   ├── Search student
    │   ├── Search book
    │   ├── Set due date
    │   └── POST /api/v1/library/issue
    │           { bookId, studentId, dueDate }
    │
    └── Return Tab
        ├── GET /api/v1/library/student/{studentId}/issued
        └── PATCH /api/v1/library/return/{issueId}
```

---

## 11. Notifications Flow

```
Push Notification Setup (App startup):
    │
    ├── Request FCM permission
    ├── Get FCM token
    └── POST /api/v1/notifications/device
        { fcmToken, deviceType: "ANDROID"|"IOS", deviceName }

Notification Received:
    │
    ├── App in foreground → Show in-app banner
    │
    └── App in background → System notification
            └── Tap → Open relevant screen

NotificationsScreen:
    ├── GET /api/v1/notifications (paginated)
    ├── GET /api/v1/notifications/unread-count → Badge on tab icon
    └── Tap notification → PATCH /api/v1/notifications/{id}/read
```

---

## 12. Exam & Results Flow

```
ResultUploadScreen (TEACHER):
    │
    ├── Select Section
    ├── GET /api/v1/exams/section/{sectionId}?academicYear=...
    │
    ├── Select Exam
    │
    ├── For each student in section:
    │   ├── Enter marksObtained
    │   └── Enter grade (optional: A+, A, B, C, D, F)
    │
    └── Submit
        └── POST /api/v1/exams/results (one per student)
            { examId, studentId, marksObtained, grade }

Admin can publish results:
    └── PATCH /api/v1/exams/results/{resultId}/publish
```

---

## 13. Timetable Flow

```
TimetableScreen
    │
    ├── ADMIN view:
    │   ├── Select Section
    │   ├── GET /api/v1/timetable/section/{sectionId}
    │   └── "Add Period" → POST /api/v1/timetable
    │           { sectionId, teacherId, subject, dayOfWeek,
    │             periodNumber, startTime, endTime, academicYear }
    │
    └── TEACHER view:
        └── GET /api/v1/timetable/teacher/{teacherId}
            → Show weekly grid (Mon–Sat × periods)
```

---

## 14. Profile & Logout Flow

```
ProfileScreen
    │
    ├── Display: name, email, role, school name
    │
    └── Logout button
            │
            ├── POST /api/v1/auth/logout
            ├── Clear SecureStorage (tokens)
            ├── dispatch(logout())
            └── Navigate to LoginScreen
```

---

## 15. Circular & Event Flow

```
CircularManagementScreen (ADMIN / TEACHER):
    │
    ├── GET /api/v1/circulars → List
    │
    └── Create Circular:
        └── POST /api/v1/circulars
            { title, content, publish: true }

EventManagementScreen (ADMIN):
    │
    ├── GET /api/v1/events → List
    │
    ├── Create Event:
    │   └── POST /api/v1/events
    │       { title, description, eventDate, venue, publish }
    │
    └── Add Photos:
        └── POST /api/v1/events/{eventId}/photos
            { photoUrl, caption }
```

---

## API Base URL Configuration

| Environment | URL                          |
|-------------|------------------------------|
| Android Emulator | http://10.0.2.2:8080/api/v1 |
| iOS Simulator    | http://localhost:8080/api/v1 |
| Physical Device  | http://<your-pc-ip>:8080/api/v1 |
| Production       | https://your-domain.com/api/v1 |

---

## Error Handling Strategy

| HTTP Status | Handling |
|-------------|----------|
| 400 Bad Request | Show field-level validation errors |
| 401 Unauthorized | Auto-refresh token or redirect to login |
| 403 Forbidden | Show "Permission denied" screen |
| 404 Not Found | Show empty state |
| 500 Server Error | Show retry option with error message |
| Network Error | Show offline banner, queue requests |
