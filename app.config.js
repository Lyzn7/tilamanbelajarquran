import "dotenv/config";

const config = {
  expo: {
    name: "tilamanbelajarquran",
    slug: "tilamanbelajarquran",
    version: "1.0.0",
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
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0f172a",
      },
      package: "com.tilamanbelajarquran.app",
      softwareKeyboardLayoutMode: "pan",
      jsEngine: "hermes",
    },
    web: {
      bundler: "metro",
    },
    plugins: [
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
      "./plugins/withSplitApks.js",
    ],
    extra: {
      eas: {
        projectId: "b11e2e69-7db2-4e98-9b5f-b418ee830d0e",
      },
      apiConfig: {
        geminiKey:
          process.env.EXPO_PUBLIC_GEMINI_KEY ||
          "AIzaSyCAQKeOYUhrX2CGcNzAPyx8sVCiF3j3f_g",
        geminiModel:
          process.env.EXPO_PUBLIC_GEMINI_MODEL || "gemini-3-flash-preview",
        baseUrl: process.env.EXPO_PUBLIC_BASE_URL || "https://equran.id/api/v2",
      },
    },
  },
};

export default config;
