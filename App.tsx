import {
  Scheherazade_400Regular,
  Scheherazade_700Bold,
  useFonts,
} from "@expo-google-fonts/scheherazade";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient, focusManager } from "@tanstack/react-query";
import {
  PersistQueryClientProvider,
  persistQueryClient,
} from "@tanstack/react-query-persist-client";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { AppState, Platform } from "react-native";
import mobileAds from "react-native-google-mobile-ads";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Navigation from "./src/navigation";

import { ReadingStateProvider } from "./src/store/ReadingStateProvider";
import { SettingsProvider, useSettings } from "./src/store/SettingsProvider";
import { darkColors, lightColors } from "./src/theme";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "@tilaman/query-cache",
  throttleTime: 1000,
});

persistQueryClient({
  queryClient,
  persister: asyncStoragePersister,
});

focusManager.setEventListener((handleFocus) => {
  const subscription = AppState.addEventListener("change", (status) => {
    if (Platform.OS !== "web" && status === "active") {
      handleFocus();
    }
  });
  return () => subscription.remove();
});

const AppShell = () => {
  const { isDark } = useSettings();
  const colors = isDark ? darkColors : lightColors;

  return (
    <ReadingStateProvider>
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <Navigation />
        </SafeAreaView>
        <StatusBar style={isDark ? "light" : "dark"} backgroundColor={colors.background} />
      </SafeAreaProvider>
    </ReadingStateProvider>
  );
};

const App = () => {
  const [fontsLoaded] = useFonts({
    Scheherazade_400Regular,
    Scheherazade_700Bold,
  });

  React.useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  React.useEffect(() => {
    if (Platform.OS !== "web") {
      mobileAds().initialize();
    }
  }, []);

  if (!fontsLoaded) return null;

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      <SettingsProvider>
        <AppShell />
      </SettingsProvider>
    </PersistQueryClientProvider>
  );
};

export default App;
