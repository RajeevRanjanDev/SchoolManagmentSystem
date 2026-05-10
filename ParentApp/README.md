# SMS Parent App

Production-grade React Native mobile app for parents of students in the School Management System (SMS).

## Features

| Module | Description |
|--------|-------------|
| Login | JWT auth with token refresh and encrypted storage |
| Dashboard | Children switcher, quick-access menu, stats |
| Attendance | Monthly view, summary, percentage bar |
| Homework | Subject-wise list with expand/collapse |
| Classwork | Daily classwork records |
| Timetable | Day-wise schedule with period detail |
| Circulars | School announcements with modal reader |
| Event Gallery | Photo gallery with full-screen viewer |
| Results | Subject-wise marks, grades, progress bar |
| Fee History | Multi-select pending fees |
| Fee Payment | UPI / Card / Net Banking / Cash flow |
| Bus Tracking | Live GPS via WebSocket + route stops |
| Library | Issued books with due-date countdown |
| Notifications | Read/unread with type icons |
| Profile | Children list, settings, sign out |

## Tech Stack

- **React Native 0.73** + **TypeScript**
- **Redux Toolkit** — auth, student, notification slices
- **React Query (TanStack v5)** — server state, caching, refetch
- **Axios** — HTTP client with automatic token refresh interceptor
- **React Navigation v6** — Stack + Bottom Tabs
- **React Native Maps** — bus GPS tracking (Google Maps)
- **Socket.IO Client** — live bus location WebSocket
- **Firebase Messaging** — push notifications (optional)
- **React Native Encrypted Storage** — secure JWT storage

## Project Structure

```
ParentApp/
├── src/
│   ├── api/
│   │   ├── client.ts              # Axios instance with JWT + refresh interceptor
│   │   └── services/              # One file per domain (auth, student, fee, …)
│   ├── components/
│   │   └── common/                # AppButton, AppInput, Card, Header, …
│   ├── constants/
│   │   ├── colors.ts              # Central color palette
│   │   ├── sizes.ts               # Spacing, typography, shadow tokens
│   │   └── api.ts                 # Base URL + all endpoint paths
│   ├── hooks/
│   │   ├── useBusTracking.ts      # WebSocket hook for live GPS
│   │   └── useNotifications.ts    # FCM setup + unread polling
│   ├── navigation/
│   │   ├── AppNavigator.tsx       # Root: Auth guard + session restore
│   │   ├── TabNavigator.tsx       # Bottom tabs with notification badge
│   │   └── types.ts               # All screen param types
│   ├── screens/                   # 16 screens — one folder per screen
│   ├── store/
│   │   ├── index.ts               # Redux store
│   │   ├── hooks.ts               # useAppDispatch / useAppSelector
│   │   └── slices/                # authSlice, studentSlice, notificationSlice
│   ├── types/                     # TypeScript interfaces for every entity
│   └── utils/
│       ├── storage.ts             # Encrypted token storage
│       ├── dateUtils.ts           # Date formatting helpers
│       └── formatters.ts          # Currency, percent, grade colours
├── App.tsx                        # Root — Redux + Query + SafeArea wired up
└── .env                           # API_BASE_URL, WS_URL
```

## Setup

### Prerequisites

- Node.js 18+
- React Native CLI
- Android Studio (for Android) or Xcode (for iOS)
- The SMS backend running (see `../README.md`)

### 1. Install dependencies

```bash
cd ParentApp
npm install
```

### 2. Configure API URL

Edit `.env`:
```
# Android Emulator
API_BASE_URL=http://10.0.2.2:8080

# Physical device (replace with your machine IP)
API_BASE_URL=http://192.168.1.100:8080
```

### 3. iOS only — install pods

```bash
cd ios && pod install && cd ..
```

### 4. Run the app

```bash
# Android
npm run android

# iOS
npm run ios

# Metro bundler (separate terminal)
npm start
```

## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Parent | parent@dpsdemo.edu | Parent@1234 |

## Push Notifications (Optional)

1. Create a Firebase project at https://console.firebase.google.com
2. Add an Android app (package: `com.smsparentapp`) and download `google-services.json` → place in `android/app/`
3. Add an iOS app, download `GoogleService-Info.plist` → place in `ios/SMSParentApp/`
4. Firebase messaging is imported dynamically — the app works without it, FCM just won't be available

## Bus Tracking

The bus tracking screen connects to the backend WebSocket at `WS_URL/api/v1/transport/ws` and subscribes to `/topic/bus/{vehicleId}`. The backend broadcasts `BusLocationResponse` JSON on each GPS update.

## API Integration

All API calls go through `src/api/client.ts`. The Axios interceptor:
1. Attaches `Authorization: Bearer <token>` to every request
2. On 401, silently calls `POST /auth/refresh` with the stored refresh token
3. Retries the failed request with the new token
4. If refresh fails, clears storage and redirects to Login

## Building for Production

```bash
# Android release APK
cd android && ./gradlew assembleRelease

# The APK is at android/app/build/outputs/apk/release/app-release.apk
```
