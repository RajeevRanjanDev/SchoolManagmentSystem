# SMS Mobile App — Architecture & Class Flow Diagram

## Architecture Pattern: Clean Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
│  Screens (React Native Components) + Navigation              │
│  React Query hooks for server state                          │
│  Redux for client/auth state                                 │
└────────────────────────┬────────────────────────────────────┘
                         │ uses
┌────────────────────────▼────────────────────────────────────┐
│                      DOMAIN LAYER                            │
│  Custom Hooks (useAuth, usePermissions, useAttendance…)      │
│  Business logic, permission checks                           │
└────────────────────────┬────────────────────────────────────┘
                         │ uses
┌────────────────────────▼────────────────────────────────────┐
│                   INFRASTRUCTURE LAYER                       │
│  API Services (Axios client + endpoint functions)            │
│  WebSocket (Socket.IO for bus tracking)                      │
│  SecureStorage (JWT via react-native-keychain)               │
│  Firebase (push notifications)                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Folder Structure

```
SmsApp/
├── App.tsx                          # Root component, providers, QueryClient
├── package.json
├── tsconfig.json
├── .env.example
├── FLOW.md                          # Application flow documentation
├── ARCHITECTURE.md                  # This file
│
└── src/
    ├── types/
    │   ├── index.ts                 # Core domain types (User, Student, etc.)
    │   ├── api.ts                   # API request/response types
    │   └── navigation.ts            # React Navigation param list types
    │
    ├── constants/
    │   ├── index.ts                 # API_BASE_URL, WS_URL, app constants
    │   └── permissions.ts           # Role → feature permission matrix
    │
    ├── theme/
    │   ├── colors.ts                # Brand color palette
    │   ├── typography.ts            # Font sizes, weights, families
    │   ├── spacing.ts               # Padding/margin scale
    │   └── index.ts                 # Exports everything
    │
    ├── api/
    │   ├── client.ts                # Axios instance + interceptors (auth, refresh)
    │   ├── auth.api.ts              # login, refresh, logout, registerDevice
    │   ├── students.api.ts          # CRUD students
    │   ├── users.api.ts             # CRUD users (teachers, parents)
    │   ├── attendance.api.ts        # markAttendance, getSection, getStudent%
    │   ├── homework.api.ts          # assignHomework, getSectionHomework
    │   ├── fees.api.ts              # getStudentFees, recordPayment, getPending
    │   ├── library.api.ts           # books CRUD, issue/return
    │   ├── transport.api.ts         # buses, routes, updateLocation
    │   ├── dashboard.api.ts         # getDashboardStats
    │   ├── notifications.api.ts     # getNotifications, markRead, registerDevice
    │   ├── circulars.api.ts         # getCirculars, createCircular
    │   ├── events.api.ts            # getEvents, createEvent, addPhoto
    │   ├── timetable.api.ts         # getTimetable (section/teacher), createPeriod
    │   ├── exams.api.ts             # scheduleExam, uploadResult, publishResult
    │   └── index.ts                 # Re-exports all API modules
    │
    ├── store/
    │   ├── index.ts                 # Redux store configuration
    │   ├── hooks.ts                 # Typed useAppDispatch, useAppSelector
    │   └── slices/
    │       ├── authSlice.ts         # Auth state (user, tokens, isAuthenticated)
    │       ├── uiSlice.ts           # Global UI state (loading, toasts)
    │       └── notificationSlice.ts # Unread count, notification list
    │
    ├── navigation/
    │   ├── index.tsx                # Root navigator (auth check → role routing)
    │   ├── types.ts                 # NavigationProp & RouteProp types
    │   ├── AuthNavigator.tsx        # Splash → Login stack
    │   ├── AdminNavigator.tsx       # Drawer + bottom tabs for SCHOOL_ADMIN
    │   ├── TeacherNavigator.tsx     # Bottom tabs for TEACHER
    │   ├── AccountantNavigator.tsx  # Bottom tabs for ACCOUNTANT
    │   ├── LibrarianNavigator.tsx   # Bottom tabs for LIBRARIAN
    │   └── TransportNavigator.tsx   # Bottom tabs for TRANSPORT_MANAGER
    │
    ├── screens/
    │   ├── auth/
    │   │   ├── SplashScreen.tsx     # Logo + auto-login check
    │   │   └── LoginScreen.tsx      # Email/password form
    │   │
    │   ├── admin/
    │   │   ├── DashboardScreen.tsx          # Stats cards + quick actions
    │   │   ├── StudentManagementScreen.tsx  # Paginated student list + search
    │   │   ├── StudentDetailScreen.tsx      # Full student profile
    │   │   ├── AddStudentScreen.tsx         # Student registration form
    │   │   ├── TeacherManagementScreen.tsx  # Teacher list + add
    │   │   ├── ParentManagementScreen.tsx   # Parent list + add
    │   │   └── SchoolSetupScreen.tsx        # School profile editor
    │   │
    │   ├── teacher/
    │   │   ├── TeacherDashboardScreen.tsx  # Today's classes + quick actions
    │   │   ├── AttendanceScreen.tsx        # Mark attendance by section+date
    │   │   ├── HomeworkScreen.tsx          # Assign + list homework
    │   │   ├── ClassworkScreen.tsx         # Upload classwork
    │   │   ├── TimetableScreen.tsx         # Weekly timetable grid
    │   │   └── ResultUploadScreen.tsx      # Upload exam marks per student
    │   │
    │   ├── accountant/
    │   │   └── AccountantDashboardScreen.tsx # Fee summary + pending list
    │   │
    │   ├── librarian/
    │   │   └── LibrarianDashboardScreen.tsx  # Books catalog + issue/return
    │   │
    │   ├── transport/
    │   │   └── TransportDashboardScreen.tsx  # Bus list + map tracking
    │   │
    │   └── shared/
    │       ├── ProfileScreen.tsx            # User profile + logout
    │       ├── NotificationsScreen.tsx      # Notification list + mark read
    │       ├── CircularManagementScreen.tsx # Create + list circulars
    │       ├── EventManagementScreen.tsx    # Create events + photo gallery
    │       ├── FeeManagementScreen.tsx      # Fee overview + payment recording
    │       ├── BusTrackingScreen.tsx        # Google Map + real-time bus
    │       ├── RouteManagementScreen.tsx    # Manage bus routes
    │       ├── LibraryManagementScreen.tsx  # Full library CRUD
    │       └── ReportsScreen.tsx           # Charts + analytics
    │
    ├── components/
    │   └── common/
    │       ├── Button.tsx           # Primary/secondary/outline button
    │       ├── Input.tsx            # Labeled text input with validation
    │       ├── Card.tsx             # Elevated card container
    │       ├── Header.tsx           # Screen header with back button
    │       ├── LoadingSpinner.tsx   # Full-screen + inline loaders
    │       ├── ErrorBoundary.tsx    # React error boundary wrapper
    │       ├── Avatar.tsx           # User avatar with initials fallback
    │       ├── Badge.tsx            # Status + count badge
    │       ├── EmptyState.tsx       # Empty list placeholder
    │       ├── StatCard.tsx         # Dashboard statistic card
    │       └── index.ts             # Re-exports all components
    │
    ├── hooks/
    │   ├── useAuth.ts              # Access auth state, login/logout actions
    │   ├── usePermissions.ts       # Check role-based feature access
    │   ├── useNotifications.ts     # FCM setup + notification handling
    │   └── useWebSocket.ts         # WebSocket connection for bus tracking
    │
    └── utils/
        ├── storage.ts              # SecureStorage wrapper (get/set/clear tokens)
        ├── formatters.ts           # Date, currency, percentage formatters
        └── validators.ts           # Email, phone, required field validators
```

---

## Class Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         App.tsx                                   │
│  Wraps: Redux Provider → QueryClientProvider → NavigationContainer│
│         → PaperProvider → SafeAreaProvider                        │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                     ┌─────────▼──────────┐
                     │  RootNavigator     │
                     │  (navigation/)     │
                     │                   │
                     │  reads: authSlice  │
                     └─────────┬─────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
    ┌─────────▼───┐   ┌────────▼────────┐  ┌───▼──────────┐
    │AuthNavigator│   │  AdminNavigator  │  │TeacherNavigator│
    │             │   │  (Drawer+Tabs)   │  │  (BottomTabs)  │
    │  Splash     │   │                 │  │               │
    │  Login      │   │  Dashboard      │  │  Dashboard    │
    └─────────────┘   │  Students       │  │  Attendance   │
                      │  Teachers       │  │  Homework     │
                      │  Parents        │  │  Timetable    │
                      │  Fees           │  │  Results      │
                      │  Library        │  │  Profile      │
                      │  Transport      │  └───────────────┘
                      │  Events         │
                      │  Circulars      │
                      │  Reports        │
                      │  Notifications  │
                      │  Profile        │
                      └────────────────┘

Each Screen follows this internal pattern:
┌────────────────────────────────────────────────────────────────┐
│  Screen Component                                               │
│                                                                │
│  ├── usePermissions() → guard access by role                   │
│  ├── useAuth() → get current user context                      │
│  │                                                             │
│  ├── useQuery(key, apiFn) → fetch + cache via React Query       │
│  │       └── shows LoadingSpinner while loading                │
│  │       └── shows ErrorState on error                         │
│  │       └── renders data when success                         │
│  │                                                             │
│  └── useMutation(apiFn) → write operations                     │
│          └── optimistic updates                                │
│          └── toast on success/error                            │
└────────────────────────────────────────────────────────────────┘
```

---

## State Management Strategy

| State Category | Solution | Why |
|---------------|----------|-----|
| Auth (user, token) | Redux Toolkit (authSlice) | Needs global access, persisted across navigations |
| Server data | React Query | Automatic caching, background refresh, loading states |
| UI state | Redux (uiSlice) | Global modals, toasts, loading overlays |
| Notifications | Redux (notificationSlice) | Badge count needs global reactivity |
| Form state | Local useState | Scoped to single screen |

---

## Security Architecture

```
Login → JWT stored in SecureStorage (react-native-keychain, AES encrypted)
     → Access token: 15 min TTL
     → Refresh token: 7 day TTL

Every API Request:
  Axios interceptor → reads accessToken from SecureStorage
                   → adds Authorization: Bearer header
                   → on 401 → refresh → retry
                   → on refresh failure → logout + redirect

Multi-tenancy:
  JWT payload contains schoolId
  Server validates all queries within the school tenant
  No cross-school data leakage possible from mobile side
```

---

## WebSocket Architecture (Bus Tracking)

```
useWebSocket hook
    │
    ├── On mount: socket = io(WS_BASE_URL)
    ├── Subscribe: socket.on('bus:location:{vehicleId}', callback)
    ├── Callback: update local state → re-render MapMarker
    └── On unmount: socket.disconnect()
```

---

## Push Notification Architecture

```
App startup:
    1. firebase.messaging().requestPermission()
    2. token = firebase.messaging().getToken()
    3. POST /api/v1/notifications/device { fcmToken, deviceType, deviceName }

Incoming notification (foreground):
    → setBackgroundMessageHandler → dispatch to notificationSlice

Incoming notification (background/quit):
    → System tray → user taps → getInitialNotification() → deep link
```
