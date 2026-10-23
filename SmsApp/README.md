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

> ⚠️ **The native `android/` and `ios/` folders are not committed to this repo.** You must
> generate them once (see [Step 0](#step-0--generate-the-native-projects-one-time)) before the
> app can build on a device/emulator.
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

After [Step 0](#step-0--generate-the-native-projects-one-time) + `.env` are done:

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

## Step 0 — Generate the native projects (one time)

Because `android/` and `ios/` aren't in the repo, create them from a scratch RN project of the
**same name and version**, then copy them in.

```bash
# in a temporary folder OUTSIDE this repo
npx @react-native-community/cli@latest init SMSParentApp --version 0.73.6
```

Then copy the two native folders into this project:

```bash
# from the generated SMSParentApp folder
cp -r SMSParentApp/android  <path>/SchoolManagmentSystem-main/ParentApp/android
cp -r SMSParentApp/ios      <path>/SchoolManagmentSystem-main/ParentApp/ios
```

(On Windows PowerShell use `Copy-Item -Recurse SMSParentApp\android ...\ParentApp\android`.)

After copying, do the one-time native wiring below (these libraries need more than
autolinking):

- **react-native-vector-icons** (app uses MaterialCommunityIcons):
  - Android: add to `android/app/build.gradle`
    `apply from: "../../node_modules/react-native-vector-icons/fonts.gradle"`
  - iOS: add the font files under **UIAppFonts** in `ios/SMSParentApp/Info.plist`
    (see the lib's README).
- **react-native-config** (reads `.env`):
  - Android: in `android/app/build.gradle` add
    `apply from: project(':react-native-config').projectDir.getPath() + "/dotenv.gradle"`
  - iOS: follow the react-native-config iOS setup (add the build phase).
- **@react-native-firebase** (push notifications — optional to run, required for FCM):
  - Android: put `google-services.json` in `android/app/`, apply the
    `com.google.gms.google-services` plugin.
  - iOS: put `GoogleService-Info.plist` in the Xcode project.
- **react-native-maps** (bus tracking):
  - Android: add your Google Maps API key to `android/app/src/main/AndroidManifest.xml`.
  - iOS: configure per react-native-maps docs.
- **react-native-gesture-handler** / **react-native-reanimated**: already imported/configured
  in `index.js` and `babel.config.js` — nothing extra needed after the native folders exist.

> If you'd rather not hand-wire these, the alternative is to scaffold a fresh RN app and move
> `src/`, `App.tsx`, `index.js`, `package.json` deps, `.env`, `babel.config.js`,
> `metro.config.js`, `tsconfig.json` into it.

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
  vector-icons native step in [Step 0](#step-0--generate-the-native-projects-one-time), then
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
└─ (android/, ios/)   # generated in Step 0 — not committed
```

For the full API reference and architecture, see the repo root:
`../API-GUIDE.md`, `../APPLICATION-FLOW.md`, `../SMS-API.postman_collection.json`.
