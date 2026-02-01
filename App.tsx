import React from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts, Scheherazade_400Regular, Scheherazade_700Bold } from "@expo-google-fonts/scheherazade";
import { QueryClient, focusManager } from "@tanstack/react-query";
import { PersistQueryClientProvider, persistQueryClient } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, Platform } from "react-native";
import Navigation from "./src/navigation";
import { SettingsProvider } from "./src/store/SettingsProvider";
import { ReadingStateProvider } from "./src/store/ReadingStateProvider";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false
    }
  }
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "@tilaman/query-cache",
  throttleTime: 1000
});

persistQueryClient({
  queryClient,
  persister: asyncStoragePersister
});

focusManager.setEventListener((handleFocus) => {
  const subscription = AppState.addEventListener("change", (status) => {
    if (Platform.OS !== "web" && status === "active") {
      handleFocus();
    }
  });
  return () => subscription.remove();
});

const App = () => {
  const [fontsLoaded] = useFonts({
    Scheherazade_400Regular,
    Scheherazade_700Bold
  });

  React.useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: asyncStoragePersister }}>
      <SettingsProvider>
        <ReadingStateProvider>
          <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1 }}>
              <Navigation />
            </SafeAreaView>
            <StatusBar style="auto" />
          </SafeAreaProvider>
        </ReadingStateProvider>
      </SettingsProvider>
    </PersistQueryClientProvider>
  );
};

export default App;
