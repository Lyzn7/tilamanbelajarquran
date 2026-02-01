import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Appearance, ColorSchemeName } from "react-native";
import { STORAGE_KEYS } from "./storageKeys";

export type ThemeMode = "system" | "light" | "dark";

export interface SettingsState {
  fontSize: number;
  showTranslation: boolean;
  themeMode: ThemeMode;
  qari: string;
  autoPlayNext: boolean;
  repeatAyah: boolean;
}

const defaultSettings: SettingsState = {
  fontSize: 28,
  showTranslation: true,
  themeMode: "system",
  qari: "05", // Misyari Rasyid default
  autoPlayNext: false,
  repeatAyah: false
};

interface SettingsContextValue {
  settings: SettingsState;
  setSettings: (value: Partial<SettingsState>) => void;
  colorScheme: NonNullable<ColorSchemeName>;
  isDark: boolean;
  hydrated: boolean;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettingsState] = useState<SettingsState>(defaultSettings);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.settings);
        if (raw) {
          const parsed = JSON.parse(raw) as SettingsState;
          setSettingsState({ ...defaultSettings, ...parsed });
        }
      } catch (err) {
        console.warn("Failed to load settings", err);
      } finally {
        setHydrated(true);
      }
    };
    load();
  }, []);

  const persist = async (value: SettingsState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(value));
    } catch (err) {
      console.warn("Failed to persist settings", err);
    }
  };

  const setSettings = (value: Partial<SettingsState>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...value };
      persist(next);
      return next;
    });
  };

  const systemScheme = Appearance.getColorScheme() || "light";
  const themeChoice = settings.themeMode === "system" ? systemScheme : settings.themeMode;

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      setSettings,
      colorScheme: themeChoice,
      isDark: themeChoice === "dark",
      hydrated
    }),
    [settings, themeChoice, hydrated]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
};
