# Running the App on Android Emulator

## Prerequisites

- Android Studio installed with the **Pixel 9 Pro** AVD created
- Android SDK at `%LOCALAPPDATA%\Android\Sdk`
- The app's native Android build already exists in `android/`

---

## One-time Native Build Fixes (already applied)

The native build required these patches due to NDK 27 + CMake 3.22 C++ STL linking issues.
They are already committed — no action needed unless you run `npx expo prebuild` again.

| File | Fix applied |
|------|-------------|
| `android/gradle.properties` | `reactNativeArchitectures=x86_64` (emulator is x86_64) |
| `android/app/build.gradle` | Added `externalNativeBuild cmake` args for `c++_shared` and `ANDROID_USE_LEGACY_TOOLCHAIN_FILE=OFF` |
| `node_modules/react-native-worklets/android/build.gradle` | Same CMake args |
| `node_modules/react-native-reanimated/android/build.gradle` | Same CMake args |
| `node_modules/expo-modules-core/android/build.gradle` | Same CMake args |
| `node_modules/react-native-screens/android/build.gradle` | Same CMake args |

---

## Step 1 — Start the Emulator

Launch the Pixel 9 Pro AVD from Android Studio, or via command line:

```bash
"$LOCALAPPDATA/Android/Sdk/emulator/emulator.exe" -avd Pixel_9_Pro
```

Wait for it to fully boot to the Android home screen.

---

## Step 2 — Build the APK

In a terminal at the project root:

```bash
cd android
"$LOCALAPPDATA/Android/Sdk/platform-tools/adb.exe" devices   # confirm emulator is listed
./gradlew.bat app:assembleDebug -PreactNativeArchitectures=x86_64 -PreactNativeDevServerPort=8081 --build-cache
```

Build takes ~2–10 minutes on first run, ~30s on subsequent runs (cached).
The APK is output to `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## Step 3 — Install the APK

```bash
"$LOCALAPPDATA/Android/Sdk/platform-tools/adb.exe" -s emulator-5554 install -r \
  android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Step 4 — Start Metro Bundler

In a **new terminal** at the project root:

```bash
npx expo start --port 8081
```

Leave this running. It serves the JavaScript bundle to the app.

---

## Step 5 — Forward the Port & Launch

```bash
# Forward Metro port so the emulator can reach your host machine
"$LOCALAPPDATA/Android/Sdk/platform-tools/adb.exe" -s emulator-5554 reverse tcp:8081 tcp:8081

# Launch the app
"$LOCALAPPDATA/Android/Sdk/platform-tools/adb.exe" -s emulator-5554 shell am start -n "com.yourname.calorierecorder/.MainActivity"
```

Then connect the Expo dev client to Metro using the deep link:

```bash
MSYS_NO_PATHCONV=1 "$LOCALAPPDATA/Android/Sdk/platform-tools/adb.exe" -s emulator-5554 shell \
  am start -a android.intent.action.VIEW \
  -d "exp+calorie-recorder://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081" \
  com.yourname.calorierecorder
```

The app should load within a few seconds and Metro will log `Bundled Xms index.ts (N modules)`.

---

## Pushing Test Images to Emulator

To test the food analysis with a custom photo:

```bash
# Create the Pictures directory (first time only)
MSYS_NO_PATHCONV=1 "$LOCALAPPDATA/Android/Sdk/platform-tools/adb.exe" -s emulator-5554 shell mkdir -p /sdcard/Pictures

# Push your image
"$LOCALAPPDATA/Android/Sdk/platform-tools/adb.exe" -s emulator-5554 push \
  "C:\path\to\your\food.jpg" //sdcard/Pictures/food.jpg

# Trigger media scanner so it appears in the gallery
MSYS_NO_PATHCONV=1 "$LOCALAPPDATA/Android/Sdk/platform-tools/adb.exe" -s emulator-5554 shell \
  am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE \
  -d file:///sdcard/Pictures/food.jpg
```

Then use **"or choose from gallery"** in the app to pick the image.

---

## Reloading After Code Changes

Metro hot-reloads JS changes automatically. For native changes you need a full rebuild (Step 2–3).

To manually reload JS:
- Shake the emulator (Ctrl+M in the emulator window) → **Reload**
- Or press `R` in the Metro terminal

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `adb: error: failed to copy ... No such file or directory` | Run `mkdir -p /sdcard/Pictures` first (with `MSYS_NO_PATHCONV=1`) |
| App shows Expo dev client screen but doesn't load | Run the deep link command in Step 5 |
| Metro not receiving requests | Re-run `adb reverse tcp:8081 tcp:8081` |
| Build fails with `undefined symbol: operator new` | The CMake patches in node_modules may have been reset by `npm install` — reapply them |
| `ClassNotFoundException: SplashScreenManager` | Run `npm install expo-splash-screen` then rebuild |
