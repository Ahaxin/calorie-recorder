/** @type {import('expo/config').ExpoConfig} */
const config = {
  name: "Calorie Recorder",
  slug: "calorie-recorder",
  version: "1.0.0",
  scheme: "calorie-recorder",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.yourname.calorierecorder",
    googleServicesFile: process.env.GOOGLE_SERVICES_PLIST ?? "./GoogleService-Info.plist",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    package: "com.yourname.calorierecorder",
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    permissions: [
      "android.permission.CAMERA",
      "android.permission.RECORD_AUDIO",
    ],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-camera",
    ["@react-native-firebase/app", {}],
    ["expo-dev-client", { launchMode: "most-recent" }],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: "6a4fad7b-d58c-414d-a360-3ec26b4a9d24",
    },
  },
};

module.exports = config;
