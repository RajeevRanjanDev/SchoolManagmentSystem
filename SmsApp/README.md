# SMS Mobile App — Setup & Run Guide

## Overview

Production-grade React Native app for the School Management System (SMS). Supports five roles:
- **SCHOOL_ADMIN** — Full management dashboard
- **TEACHER** — Attendance, homework, results, timetable
- **ACCOUNTANT** — Fee management & reports
- **LIBRARIAN** — Book catalog, issue & return
- **TRANSPORT_MANAGER** — Bus tracking & routes

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| React Native CLI | Latest |
| Java JDK | 17 (Android) |
| Android Studio | Latest (Flamingo+) |
| Xcode | 15+ (iOS, Mac only) |

---

## 1. Initial Setup

```bash
# Navigate to project
cd C:\Users\shipra.k.singh\SMS\SmsApp

# Install all dependencies (including babel-plugin-module-resolver)
npm install

# Install pods (iOS only, Mac)
cd ios && pod install && cd ..
```

---

## 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env`:

```
# For Android emulator (reaches host machine localhost)
API_BASE_URL=http://10.0.2.2:8080/api/v1
WS_BASE_URL=ws://10.0.2.2:8080/ws

# For physical device, use your computer's IP:
# API_BASE_URL=http://192.168.1.100:8080/api/v1

GOOGLE_MAPS_API_KEY=your_google_maps_key
```

---

## 3. Start the SMS Spring Boot Backend

Make sure the Spring Boot server is running at port 8080 before launching the app.

```bash
cd C:\Users\shipra.k.singh\SMS\SmsCore
mvn spring-boot:run
```

---

## 4. Run the App

### Android
```bash
# Start Metro bundler
npm start

# In a new terminal
npm run android
```

### iOS (Mac only)
```bash
npm run ios
```

---

## 5. Firebase Setup (Push Notifications)

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Add Android app: package name = `com.smsapp`
3. Download `google-services.json` → place in `android/app/`
4. For iOS: download `GoogleService-Info.plist` → place in `ios/SmsApp/`

---

## 6. Google Maps Setup

1. Get an API key from [Google Cloud Console](https://console.cloud.google.com)
2. Enable **Maps SDK for Android** and **Maps SDK for iOS**
3. Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<meta-data
  android:name="com.google.android.geo.API_KEY"
  android:value="YOUR_API_KEY_HERE"/>
```

---

## 7. Test Accounts

Create test users in the Spring Boot backend (via Swagger at `http://localhost:8080/swagger-ui.html`) or via the API:

| Role | Example Email |
|------|--------------|
| SCHOOL_ADMIN | admin@school.com |
| TEACHER | teacher@school.com |
| ACCOUNTANT | accountant@school.com |
| LIBRARIAN | librarian@school.com |
| TRANSPORT_MANAGER | transport@school.com |

---

## 8. Project Structure

```
SmsApp/
├── App.tsx              # Root with Redux + QueryClient + Navigation
├── src/
│   ├── api/            # All Spring Boot API calls
│   ├── store/          # Redux Toolkit state
│   ├── navigation/     # Role-based navigation
│   ├── screens/        # All app screens
│   │   ├── auth/       # Splash + Login
│   │   ├── admin/      # Admin-only screens
│   │   ├── teacher/    # Teacher-only screens
│   │   ├── accountant/ # Accountant screens
│   │   ├── librarian/  # Librarian screens
│   │   ├── transport/  # Transport screens
│   │   └── shared/     # Common screens (fees, events, etc.)
│   ├── components/     # Reusable UI components
│   ├── hooks/          # Custom hooks
│   ├── utils/          # Helpers & formatters
│   ├── types/          # TypeScript definitions
│   ├── theme/          # Colors, typography, spacing
│   └── constants/      # API keys, query keys, permissions
├── FLOW.md             # Complete application flow documentation
├── ARCHITECTURE.md     # Class diagram & architecture
└── README.md           # This file
```

---

## 9. Key Features

| Feature | Implementation |
|---------|---------------|
| JWT Auth | react-native-keychain (AES encrypted) |
| Auto token refresh | Axios interceptor |
| Server state | React Query (cache + background refresh) |
| Redux state | Auth, UI toasts, notification count |
| Push notifications | Firebase Messaging |
| Maps | react-native-maps + Google Maps |
| Real-time bus | Socket.IO WebSocket |
| Role-based nav | Per-role Navigator components |
| Permissions | PERMISSIONS matrix in constants/ |

---

## 10. Troubleshooting

**Metro bundler issues:**
```bash
npm start -- --reset-cache
```

**Android build fails:**
```bash
cd android && ./gradlew clean && cd ..
npm run android
```

**iOS pod issues:**
```bash
cd ios && pod deintegrate && pod install && cd ..
```

**Can't reach backend from Android emulator:**
- Make sure to use `10.0.2.2` not `localhost` for the Android emulator
- Check Spring Boot is running: `http://localhost:8080/actuator/health`

---

## API Documentation

Once Spring Boot is running, Swagger UI is available at:
```
http://localhost:8080/swagger-ui.html
```
