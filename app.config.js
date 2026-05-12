import "dotenv/config";

const admobAndroidAppId =
  process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID ||
  process.env.EXPO_PUBLIC_ADMOD_ANDROID_APP_ID ||
  "ca-app-pub-3940256099942544~3347511713";
const admobIosAppId =
  process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID ||
  process.env.EXPO_PUBLIC_ADMOD_IOS_APP_ID ||
  "ca-app-pub-3940256099942544~1458002511";
const admobRewardedAdUnitId =
  process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID ||
  process.env.EXPO_PUBLIC_ADMOD_REWARDED_ID ||
  "ca-app-pub-3940256099942544/5224354917";

const config = {
  expo: {
    name: "tilamanbelajarquran",
    slug: "tilamanbelajarquran",
    version: "1.0.2",
    orientation: "portrait",
    icon: "./assets/icon.png",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    updates: {
      fallbackToCacheTimeout: 0,
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.tilamanbelajarquran.app",
      infoPlist: {
        UIBackgroundModes: ["audio"],
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0f172a",
      },
      package: "com.tilamanbelajarquran.app",
      versionCode: 3,
      permissions: [
        "com.google.android.gms.permission.AD_ID",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION",
      ],
      blockedPermissions: [
        "android.permission.ACTIVITY_RECOGNITION",
      ],
      softwareKeyboardLayoutMode: "pan",
      jsEngine: "hermes",
    },
    web: {
      bundler: "metro",
    },
    plugins: [
      [
        "react-native-google-mobile-ads",
        {
          androidAppId: admobAndroidAppId,
          iosAppId: admobIosAppId,
        },
      ],
      [
        "expo-build-properties",
        {
          android: {
            buildFeatures: {
              buildConfig: true,
            },
            enableProguardInReleaseBuilds: true,
            enableShrinkResourcesInReleaseBuilds: true,
            minSdkVersion: 29,
            targetSdkVersion: 35,
            compileSdkVersion: 35,
          },
        },
      ],
      "./plugins/withAdiRegistration.js",
      "./plugins/withSplitApks.js",
    ],
    extra: {
      eas: {
        projectId: "b11e2e69-7db2-4e98-9b5f-b418ee830d0e",
      },
      apiConfig: {
        geminiKey: process.env.EXPO_PUBLIC_GEMINI_KEY,
        geminiModel:
          process.env.EXPO_PUBLIC_GEMINI_MODEL || "gemini-3-flash-preview",
        baseUrl: process.env.EXPO_PUBLIC_BASE_URL || "https://equran.id/api/v2",
        admobRewardedAdUnitId,
      },
    },
  },
};

export default config;
