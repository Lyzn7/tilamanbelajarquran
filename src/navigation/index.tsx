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

const Tabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: lightColors.primary,
      tabBarInactiveTintColor: lightColors.muted,
      tabBarStyle: {
        paddingBottom: 6,
        paddingTop: 6,
        height: 40,
        backgroundColor: lightColors.card,
        borderTopColor: lightColors.border
      }
    }}
  >
    <Tab.Screen
      name="Beranda"
      component={DashboardScreen}
      options={{
        tabBarIcon: tabIcon("home-outline")
      }}
    />
    <Tab.Screen
      name="Alquran"
      component={SurahListScreen}
      options={{
        tabBarIcon: tabIcon("book-outline")
      }}
    />
    <Tab.Screen
      name="Kiblat"
      component={KiblatScreen}
      options={{
        tabBarIcon: tabIcon("navigate-outline")
      }}
    />
  </Tab.Navigator>
);

const navTheme = (scheme: NonNullable<ColorSchemeName>) =>
  scheme === "dark"
    ? {
      ...DarkTheme,
      colors: { ...DarkTheme.colors, background: darkColors.background, card: darkColors.card, text: darkColors.text }
    }
    : {
      ...DefaultTheme,
      colors: { ...DefaultTheme.colors, background: lightColors.background, card: lightColors.card, text: lightColors.text }
    };

const Navigation = () => {
  const { colorScheme } = useSettings();
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
    <NavigationContainer theme={navTheme(colorScheme)}>
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
        <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen
          name="SurahDetail"
          component={SurahDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="JuzList" component={JuzListScreen} options={{ title: "Juz" }} />
        <Stack.Screen name="Search" component={SearchScreen} options={{ title: "Pencarian" }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Pengaturan" }} />
        <Stack.Screen name="PrayerSchedule" component={ShalatScreen} options={{ title: "Jadwal Sholat" }} />
        <Stack.Screen name="Tajwid" component={TajwidScreen} options={{ title: "Panduan Tajwid" }} />
        <Stack.Screen name="Tafsir" component={TafsirScreen} options={{ headerShown: false }} />
        <Stack.Screen name="DoaList" component={DoaListScreen} options={{ title: "Kumpulan Doa" }} />
        <Stack.Screen name="Features" children={() => <PlaceholderScreen title="Fitur" />} options={{ title: "Fitur" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
