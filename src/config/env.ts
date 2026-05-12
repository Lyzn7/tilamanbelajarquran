import Constants from "expo-constants";

/**
 * Mendapatkan konfigurasi API dari extra di app.config.js
 * Ini memastikan variabel environment tersimpan di APK dan dapat diakses di runtime
 */

export const getApiConfig = () => {
  const extra = Constants.expoConfig?.extra?.apiConfig;

  return {
    geminiKey: extra?.geminiKey || process.env.EXPO_PUBLIC_GEMINI_KEY,
    geminiModel:
      extra?.geminiModel ||
      process.env.EXPO_PUBLIC_GEMINI_MODEL ||
      "gemini-3-flash-preview",
    baseUrl:
      extra?.baseUrl ||
      process.env.EXPO_PUBLIC_BASE_URL ||
      "https://equran.id/api/v2",
    admobRewardedAdUnitId:
      extra?.admobRewardedAdUnitId ||
      process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID ||
      process.env.EXPO_PUBLIC_ADMOD_REWARDED_ID ||
      "ca-app-pub-3940256099942544/5224354917",
  };
};

export const apiConfig = getApiConfig();
