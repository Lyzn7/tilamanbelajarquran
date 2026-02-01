import React from "react";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import SurahListScreen from "@/screens/SurahListScreen";
import SurahDetailScreen from "@/screens/SurahDetailScreen";
import JuzListScreen from "@/screens/JuzListScreen";
import SearchScreen from "@/screens/SearchScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import PlaceholderScreen from "@/screens/PlaceholderScreen";
import { useSettings } from "@/store/SettingsProvider";
import { lightColors, darkColors } from "@/theme";
import { ColorSchemeName } from "react-native";

export type RootStackParamList = {
  Tabs: undefined;
  SurahDetail: { nomor: number; initialAyah?: number };
  JuzList: undefined;
  Search: undefined;
  Settings: undefined;
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
      tabBarActiveTintColor: "#0ea5e9",
      tabBarStyle: { paddingBottom: 6, paddingTop: 6, height: 60 }
    }}
  >
    <Tab.Screen
      name="Alquran"
      component={SurahListScreen}
      options={{
        tabBarIcon: tabIcon("book-outline")
      }}
    />
    <Tab.Screen
      name="Belajar Baca"
      children={() => <PlaceholderScreen title="Belajar Baca" />}
      options={{
        tabBarIcon: tabIcon("school-outline")
      }}
    />
    <Tab.Screen
      name="Game"
      children={() => <PlaceholderScreen title="Game" />}
      options={{
        tabBarIcon: tabIcon("game-controller-outline")
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

  return (
    <NavigationContainer theme={navTheme(colorScheme)}>
      <Stack.Navigator>
        <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen
          name="SurahDetail"
          component={SurahDetailScreen}
          options={{ title: "Pembaca Mushaf", headerLargeTitle: true }}
        />
        <Stack.Screen name="JuzList" component={JuzListScreen} options={{ title: "Juz" }} />
        <Stack.Screen name="Search" component={SearchScreen} options={{ title: "Pencarian" }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Pengaturan" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
