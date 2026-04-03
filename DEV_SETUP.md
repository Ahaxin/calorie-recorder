# Dev Setup & Debugging Guide

## Prerequisites

- Node.js 18+
- EAS CLI: `npm install -g eas-cli`
- Expo CLI: included via `npx expo`
- Android Studio (for emulator) or a physical Android device

> For the full Android emulator setup guide, see **[EMULATOR.md](./EMULATOR.md)**.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in all values:

```
EXPO_PUBLIC_GEMINI_API_KEY=
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
```

---

## Starting the Dev Server

```bash
# Normal start
npx expo start --port 8081

# Start with cleared Metro cache (use when you see stale code)
npx expo start --port 8081 --clear

# If port is already in use
npx kill-port 8081
npx expo start --port 8081
```

---

## Connecting a Physical Device

1. Make sure your phone and computer are on the **same WiFi network**
2. Find your computer's local IP:
   ```bash
   ipconfig
   ```
   Look for **IPv4 Address** under the WiFi adapter — e.g. `192.168.129.12`

3. Open the Expo dev client app on your phone and enter:
   ```
   exp://192.168.129.12:8081
   ```

4. If connection fails after 10000ms — Windows Firewall is blocking port 8081.
   Run this in an **admin terminal** once:
   ```bash
   netsh advfirewall firewall add rule name="Expo Dev Server" dir=in action=allow protocol=TCP localport=8081
   ```

---

## Building with EAS

```bash
# Development build (APK with dev client)
eas build --platform android --profile development

# Preview build
eas build --platform android --profile preview

# Production build
eas build --platform android --profile production
```

### EAS Secrets (one-time setup)

`google-services.json` is gitignored. Upload it to EAS once:

```bash
eas env:create --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --environment development
eas env:create --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --environment preview
eas env:create --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --environment production
```

---

## Installing a Dev Build on Device

After EAS build completes, download the `.apk` and either:

- Drag it onto a running emulator, or
- Run via ADB:
  ```bash
  adb install path/to/your-app.apk
  ```

Enable **Install unknown apps** on your device if prompted.

---

## Debugging

### View logs
Logs stream to the terminal running `npx expo start`. The dev client also has a built-in log viewer.

### Reload app
Shake the device → **Reload**

### Common errors and fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `failed to connect after 10000ms` | Firewall blocking port | Open port 8081 in Windows Firewall (see above) |
| `black/white screen` | Stale Metro cache | Restart with `--clear` flag, close and reopen app |
| `Cannot read property 'Base64' of undefined` | Old `expo-file-system` API | Import from `expo-file-system/legacy` |
| `Attempted to navigate before mounting Root Layout` | `router.replace()` called in root layout `useEffect` | Use `<Redirect>` in `app/index.tsx` instead |
| `Incompatible React versions` | Wrong React version for Expo SDK | Run `npx expo install --fix` |
| `model not found / 404` | Wrong Gemini model name | Check available models via API, update `GEMINI_MODEL` in `lib/constants.ts` |
| Port already in use | Previous server still running | Run `npx kill-port 8081` |
| `undefined symbol: operator new` (NDK build) | NDK 27 + CMake 3.22 C++ STL issue | See EMULATOR.md — CMake patches already applied to node_modules |
| `ClassNotFoundException: SplashScreenManager` | Missing expo-splash-screen | Run `npm install expo-splash-screen` then rebuild |
| `firestore/permission-denied` on rewards/meals | Firestore rules too narrow | Use `match /users/{userId}/{document=**}` wildcard rule in Firebase Console |

### Check available Gemini models

```bash
node -e "
const https = require('https');
require('dotenv').config();
const key = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
https.get('https://generativelanguage.googleapis.com/v1beta/models?key=' + key, (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    const models = JSON.parse(data).models?.map(m => m.name) || [];
    console.log(models);
  });
});
"
```

---

## Current Model

`gemini-2.5-flash` — set in `lib/constants.ts` as `GEMINI_MODEL`.
