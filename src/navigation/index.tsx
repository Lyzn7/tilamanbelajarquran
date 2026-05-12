import ChatbotScreen from "@/screens/ChatbotScreen";
import DashboardScreen from "@/screens/DashboardScreen";
import DoaListScreen from "@/screens/DoaListScreen";
import JuzListScreen from "@/screens/JuzListScreen";
import KiblatScreen from "@/screens/KiblatScreen";

import OnboardingScreen from "@/screens/OnboardingScreen";
import PlaceholderScreen from "@/screens/PlaceholderScreen";
import SearchScreen from "@/screens/SearchScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import ShalatScreen from "@/screens/ShalatScreen";
import SurahDetailScreen from "@/screens/SurahDetailScreen";
import SurahListScreen from "@/screens/SurahListScreen";
import TafsirScreen from "@/screens/TafsirScreen";
import TajwidScreen from "@/screens/TajwidScreen";
import { useSettings } from "@/store/SettingsProvider";
import { STORAGE_KEYS } from "@/store/storageKeys";
import { darkColors, lightColors } from "@/theme";
import type { ColorTheme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { DarkTheme, DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { ColorSchemeName } from "react-native";

export type RootStackParamList = {
  Tabs: undefined;
  SurahDetail: { nomor: number; initialAyah?: number; autoPlay?: boolean };
  JuzList: undefined;
  Search: undefined;
  Settings: undefined;
  Onboarding: undefined;
  PrayerSchedule: undefined;
  Features: undefined;
  Tajwid: undefined;
  Kiblat: undefined;

  DoaList: undefined;
  Tafsir: { nomor: number };
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

const tabIcon = (name: keyof typeof Ionicons.glyphMap) => ({
  color,
  size
}: {
  color: string;
  size: number;
}) => <Ionicons name={name} color={color} size={size} />;

const Tabs: React.FC<{ colors: ColorTheme }> = ({ colors }) => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.muted,
      tabBarStyle: {
        paddingBottom: 6,
        paddingTop: 6,
        height: 60,
        backgroundColor: colors.card,
        borderTopColor: colors.border
      },
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: "700"
      },
      tabBarHideOnKeyboard: true
    }}
  >
    <Tab.Screen
      name="Beranda"
      component={DashboardScreen}
      options={{
        tabBarLabel: "Beranda",
        tabBarIcon: tabIcon("home-outline")
      }}
    />
    <Tab.Screen
      name="Alquran"
      component={SurahListScreen}
      options={{
        tabBarLabel: "Al-Quran",
        tabBarIcon: tabIcon("book-outline")
      }}
    />
    <Tab.Screen
      name="UstadzAI"
      component={ChatbotScreen}
      options={{
        tabBarLabel: "Ustadz AI",
        tabBarIcon: tabIcon("chatbubble-ellipses-outline")
      }}
    />
    <Tab.Screen
      name="Pengaturan"
      component={SettingsScreen}
      options={{
        tabBarLabel: "Pengaturan",
        tabBarIcon: tabIcon("settings-outline")
      }}
    />

  </Tab.Navigator>
);

const navTheme = (scheme: NonNullable<ColorSchemeName>, colors: ColorTheme) =>
  scheme === "dark"
    ? {
      ...DarkTheme,
      colors: {
        ...DarkTheme.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.card,
        text: colors.text,
        border: colors.border,
        notification: colors.accent
      }
    }
    : {
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.card,
        text: colors.text,
        border: colors.border,
        notification: colors.accent
      }
    };

const Navigation = () => {
  const { colorScheme, isDark } = useSettings();
  const colors = isDark ? darkColors : lightColors;
  const [ready, setReady] = React.useState(false);
  const [showOnboarding, setShowOnboarding] = React.useState(false);

  React.useEffect(() => {
    const load = async () => {
      try {
        const seen = await AsyncStorage.getItem(STORAGE_KEYS.onboardingSeen);
        setShowOnboarding(!seen);
      } finally {
        setReady(true);
      }
    };
    load();
  }, []);

  if (!ready) return null;

  return (
    <NavigationContainer theme={navTheme(colorScheme, colors)}>
      <Stack.Navigator>
        {showOnboarding ? (
          <Stack.Screen
            name="Onboarding"
            options={{ headerShown: false }}
            children={({ navigation }) => (
              <OnboardingScreen
                onDone={() => {
                  setShowOnboarding(false);
                  navigation.replace("Tabs");
                }}
              />
            )}
          />
        ) : null}
        <Stack.Screen name="Tabs" options={{ headerShown: false }}>
          {() => <Tabs colors={colors} />}
        </Stack.Screen>
        <Stack.Screen
          name="SurahDetail"
          component={SurahDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="JuzList" component={JuzListScreen} options={{ title: "Juz" }} />
        <Stack.Screen name="Search" component={SearchScreen} options={{ title: "Pencarian" }} />
        <Stack.Screen name="PrayerSchedule" component={ShalatScreen} options={{ title: "Jadwal Sholat" }} />
        <Stack.Screen name="Tajwid" component={TajwidScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Kiblat" component={KiblatScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Tafsir" component={TafsirScreen} options={{ headerShown: false }} />
        <Stack.Screen name="DoaList" component={DoaListScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Features" children={() => <PlaceholderScreen title="Fitur" />} options={{ title: "Fitur" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
