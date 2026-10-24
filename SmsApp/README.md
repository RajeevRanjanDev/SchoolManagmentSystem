# SMS Mobile App (ParentApp)

Role-based React Native app for the School Management System. One app, one login — it
routes each user to their own experience based on the role in their JWT:

| Role | Signs in with |
|---|---|
| Parent | email |
| Student | admission number |
| Teacher | login ID (`ABC-TE-2025-001`) |
| School Admin | email |
| Support Staff / Accountant / Transport Manager | employee login ID |

- **Stack:** React Native **0.73.6** (bare CLI, **not** Expo), React 18.2, TypeScript, Redux
  Toolkit, React Query, React Navigation.
- **Backend:** the SmsCore Spring Boot API (default `http://localhost:8080`).

> ✅ The native **`android/`** and **`ios/`** projects are generated and the native libraries
> are wired. After `npm install` you still need three one-time things before building — fonts,
> and (for real push + maps) your own Firebase/Maps keys. See
> [Step 0 — one-time native setup](#step-0--one-time-native-setup).
>
> ⚠️ **This is a bare React Native app, NOT Expo.** You **cannot** run it with the **Expo Go**
> app + QR code. See [Can I use Expo Go?](#can-i-use-expo-go-scan-a-qr-code).

---

## Can I use Expo Go (scan a QR code)?

**No.** Expo Go only runs **Expo-managed** apps whose libraries ship inside the Expo Go
runtime. This project is a **bare React Native CLI** app that uses native modules Expo Go does
**not** bundle — `@react-native-firebase/*`, `react-native-maps`, `react-native-vector-icons`,
`react-native-config`, `react-native-document-picker`, `react-native-image-picker`,
`@notifee/react-native`, `react-native-pdf`, `react-native-push-notification`. Scanning a QR
with Expo Go would error on these. (If other mobile apps in your workspace *do* work with Expo
Go, those are Expo apps — this one isn't.)

**What to do instead:**

| Device | How to run without a Mac |
|---|---|
| **Android phone** | Build an **APK** on the PC → copy it to the phone → tap to install (closest to "scan & go"). See [Install an APK on an Android phone](#install-an-apk-on-an-android-phone). Or plug the phone in via USB and run `npm run android`. |
| **iPhone** | A bare RN app needs a **Mac + Xcode** to build/sideload; Expo Go can't load it. Without a Mac you can't run it on iPhone. |

> Want a real scan-a-QR dev workflow (like Expo Go) **with** these native modules? That
> requires migrating the app to an **Expo Dev Client** (`expo-dev-client` + `expo prebuild`) and
> building a custom dev client once. It's a larger change — ask and I can set it up.

### Install an APK on an Android phone

After [Step 0](#step-0--one-time-native-setup) + `.env` are done:

```bash
cd android
./gradlew assembleRelease   # or assembleDebug for a quick test build
```

The APK is written to `android/app/build/outputs/apk/release/app-release.apk`
(or `.../debug/app-debug.apk`). Copy that file to the phone (USB, email, Drive, etc.), open it
on the phone, allow "install from unknown sources", and install. For it to reach your backend,
set `API_BASE_URL` in `.env` to your PC's **LAN IP** or the **dev tunnel** (not `localhost` /
`10.0.2.2`) **before** building — see [Step 2](#step-2--configure-the-backend-url-env).

---

## Prerequisites

Install these first. Follow the official guide for your OS:
**https://reactnative.dev/docs/0.73/environment-setup** → choose the **"React Native CLI
Quickstart"** tab (NOT Expo).

| Tool | Version | Notes |
|---|---|---|
| Node.js | 18 LTS or newer | `node -v` |
| JDK | **17** (Temurin/Adoptium) | RN 0.73 needs JDK 17 |
| Android Studio | latest | install **Android SDK Platform 34** + **Build-Tools 34** + an AVD (emulator) |
| Watchman | optional (macOS) | faster file watching |
| Xcode | 15+ (**macOS only**) | for iOS; plus Command Line Tools |
| CocoaPods | latest (**macOS only**) | `sudo gem install cocoapods` |

Set these environment variables (Android):
- `ANDROID_HOME` → your SDK path (e.g. `C:\Users\<you>\AppData\Local\Android\Sdk` on Windows).
- Add `platform-tools` and `emulator` to your `PATH`.

> **iOS can only be built on a Mac.** On Windows/Linux you can run the Android app only.

---

## Step 0 — one-time native setup

The native **`android/`** and **`ios/`** projects (package / bundle id **`com.smsparentapp`**)
are already generated and the native libraries are wired:

- ✅ **react-native-config** — `.env` wired in `android/app/build.gradle` (dotenv.gradle).
- ✅ **@react-native-firebase** — Google-Services Gradle plugin + classpath (Android),
  `[FIRApp configure]` in `AppDelegate.mm` + static-framework Podfile (iOS). **Placeholder**
  `google-services.json` / `GoogleService-Info.plist` are committed so it builds.
- ✅ **react-native-maps** — Android manifest has a Maps API-key **placeholder** + permissions.
- ✅ **react-native-gesture-handler** — imported at the top of `index.js`.
- ✅ **react-native-reanimated** — babel plugin in `babel.config.js`.

You still must do these **once**:

1. **Link the icon fonts** (vector-icons, both platforms) — after `npm install`:
   ```bash
   npx react-native-asset
   ```
   (Run it on the Mac too, so it wires the fonts into the Xcode project for iOS.)

2. **Replace the placeholder keys** with your own (needed only for real push / maps — the app
   builds and runs without them, those features just won't work):
   - `android/app/google-services.json` → your Firebase Android config.
   - `ios/SMSParentApp/GoogleService-Info.plist` → your Firebase iOS config (and add it to the
     Xcode target's *Copy Bundle Resources*).
   - `android/app/src/main/AndroidManifest.xml` → replace `YOUR_GOOGLE_MAPS_API_KEY`.

3. **iOS only (macOS):** install pods —
   ```bash
   cd ios && pod install && cd ..
   ```

> Changing the Android **applicationId** / iOS **bundle id** from `com.smsparentapp` is
> optional; if you do, update it in `android/app/build.gradle`, the Xcode target, and your
> Firebase config files.

---

## Step 1 — Install dependencies

```bash
cd ParentApp
npm install
```

`.npmrc` already sets `legacy-peer-deps=true` (RN 0.73 + React 18 needs it), so no flag is
required.

---

## Step 2 — Configure the backend URL (`.env`)

```bash
cp .env.example .env   # Windows: copy .env.example .env
```

Edit `.env` and set `API_BASE_URL` / `WS_URL` to reach your running backend:

| Target | `API_BASE_URL` |
|---|---|
| **Android emulator** | `http://10.0.2.2:8080` (emulator alias for your PC's localhost) |
| **iOS simulator** | `http://localhost:8080` |
| **Physical phone (same Wi‑Fi)** | `http://<your-computer-LAN-ip>:8080` (e.g. `http://192.168.1.5:8080`) |
| **Anywhere (dev tunnel)** | `https://kkhwdk54-8080.inc1.devtunnels.ms` |

Changing `.env` requires a **rebuild** (not just a Metro reload), because `react-native-config`
bakes values in at build time.

> Make sure the **backend is running on :8080** before launching the app.

---

## Step 3 — Run on Android

1. Start an emulator (Android Studio → Device Manager → ▶) **or** plug in a device with USB
   debugging enabled.
2. Start the Metro bundler:
   ```bash
   npm start
   ```
3. In a second terminal, build & install the app:
   ```bash
   npm run android
   ```

**Physical Android device talking to a PC backend:** forward the port so `localhost` works:
```bash
adb reverse tcp:8080 tcp:8080
```
(then `API_BASE_URL=http://localhost:8080` works on the device too).

---

## Step 4 — Run on iOS (macOS only)

1. Install pods (first time and after adding native deps):
   ```bash
   cd ios
   pod install
   cd ..
   ```
2. Start Metro and launch:
   ```bash
   npm start          # terminal 1
   npm run ios        # terminal 2  (default simulator)
   ```
   Pick a specific simulator: `npm run ios -- --simulator="iPhone 15"`.
   For a physical iPhone, open `ios/SMSParentApp.xcworkspace` in Xcode, set your signing team,
   and Run.

---

## Release builds

**Android APK/AAB:**
```bash
cd android
./gradlew assembleRelease      # APK  → android/app/build/outputs/apk/release/
./gradlew bundleRelease        # AAB (Play Store)
```
(requires a signing keystore configured in `android/app/build.gradle` — see the RN
["Publishing to Google Play"](https://reactnative.dev/docs/0.73/signed-apk-android) guide).
There's also a shortcut: `npm run build:android`.

**iOS:** open the `.xcworkspace` in Xcode → Product → Archive → distribute.

---

## Handy scripts (`package.json`)

| Command | What it does |
|---|---|
| `npm start` | Start the Metro bundler |
| `npm run start:clear` | Start Metro with a reset cache (fixes stale-bundle issues) |
| `npm run android` | Build + install + launch on Android |
| `npm run ios` | Build + install + launch on iOS |
| `npm run type-check` | TypeScript check (no emit) |
| `npm run lint` | ESLint over `src/` |
| `npm test` | Jest tests |

---

## Troubleshooting

- **`npm install` fails with `ERESOLVE`** → make sure `.npmrc` (with `legacy-peer-deps=true`)
  exists in `ParentApp/`; it's committed. Re-run `npm install`.
- **`SDK location not found` / Android build fails** → set `ANDROID_HOME` and create
  `android/local.properties` with `sdk.dir=<your Android SDK path>`.
- **App opens but every request fails / "Network Error"** → the backend isn't reachable.
  Check: backend running on :8080, correct `API_BASE_URL` for your target (table above),
  `adb reverse` for a physical Android device, and that you **rebuilt** after editing `.env`.
- **Red screen / stale JS after pulling changes** → `npm run start:clear`, then reload the app
  (press `r` in the Metro terminal, or shake the device → Reload).
- **Icons show as boxes/blank** → `react-native-vector-icons` fonts weren't linked; redo the
  vector-icons step in [Step 0](#step-0--one-time-native-setup) (`npx react-native-asset`), then
  rebuild.
- **iOS: `pod install` errors** → `cd ios && pod repo update && pod install`; ensure CocoaPods
  and Xcode Command Line Tools are installed.
- **Port 8081 already in use** → kill the other Metro, or run `npm start -- --port 8088` and
  rebuild.

---

## Project layout

```
ParentApp/
├─ src/
│  ├─ api/            # axios client + per-domain services (auth, admin, teacher, student…)
│  ├─ navigation/     # AppNavigator routes by role → Admin/Teacher/Student/… navigators
│  ├─ screens/        # one folder per role/domain
│  ├─ components/     # shared UI
│  ├─ constants/      # api.ts (endpoints, base URL), colors, sizes
│  ├─ store/          # Redux (auth) + React Query usage
│  └─ utils/          # roles, formatters, dates
├─ App.tsx, index.js
├─ .env / .env.example
├─ android/           # native Android project (generated, wired)
├─ ios/               # native iOS project (generated, wired)
└─ react-native.config.js  # font asset linking for `npx react-native-asset`
```

For the full API reference and architecture, see the repo root:
`../API-GUIDE.md`, `../APPLICATION-FLOW.md`, `../SMS-API.postman_collection.json`.
