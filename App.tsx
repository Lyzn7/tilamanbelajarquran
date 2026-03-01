import { Scheherazade_400Regular, Scheherazade_700Bold, useFonts } from "@expo-google-fonts/scheherazade";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient, focusManager } from "@tanstack/react-query";
import { PersistQueryClientProvider, persistQueryClient } from "@tanstack/react-query-persist-client";
import { AVPlaybackStatus, ResizeMode, Video } from "expo-av";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Animated, AppState, Platform, StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Navigation from "./src/navigation";
import { setupNotificationHandler } from "./src/notifications";
import { ReadingStateProvider } from "./src/store/ReadingStateProvider";
import { SettingsProvider } from "./src/store/SettingsProvider";

SplashScreen.preventAutoHideAsync();
setupNotificationHandler();

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

  const [isAppReady, setIsAppReady] = React.useState(false);
  const [isSplashAnimationComplete, setAnimationComplete] = React.useState(false);
  const opacity = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
      // Fallback: If video fails to play or load, hide splash screen after 5 seconds anyway
      const fallback = setTimeout(() => {
        setIsAppReady(true);
      }, 5000);
      return () => clearTimeout(fallback);
    }
  }, [fontsLoaded]);

  const onVideoStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      if (status.didJustFinish) {
        setIsAppReady(true);
      }
    } else if (status.error) {
      setIsAppReady(true);
    }
  };

  React.useEffect(() => {
    if (isAppReady) {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => setAnimationComplete(true));
    }
  }, [isAppReady, opacity]);

  if (!fontsLoaded) return null;

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: asyncStoragePersister }}>
      <SettingsProvider>
        <ReadingStateProvider>
          <SafeAreaProvider>
            <View style={{ flex: 1 }}>
              <SafeAreaView style={{ flex: 1 }}>
                <Navigation />
              </SafeAreaView>

              {!isSplashAnimationComplete && (
                <Animated.View
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      backgroundColor: "#0f172a", // Match your app.json splash background
                      justifyContent: "center",
                      alignItems: "center",
                      opacity: opacity,
                      zIndex: 999, // ensures it covers EVERYTHING
                    }
                  ]}
                  pointerEvents="none" // So touches pass through when it's fading out
                >
                  <Video
                    source={require("./assets/0301.mp4")}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode={ResizeMode.CONTAIN}
                    shouldPlay={fontsLoaded && !isAppReady}
                    isLooping={false}
                    onPlaybackStatusUpdate={onVideoStatusUpdate}
                  />
                </Animated.View>
              )}
            </View>
            <StatusBar style="auto" />
          </SafeAreaProvider>
        </ReadingStateProvider>
      </SettingsProvider>
    </PersistQueryClientProvider>
  );
};

export default App;
