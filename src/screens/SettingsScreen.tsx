import React from "react";
import { SafeAreaView, StyleSheet, Switch, Text, View, Pressable } from "react-native";
import { useSettings, ThemeMode } from "@/store/SettingsProvider";
import { lightColors, darkColors } from "@/theme";
import FontSizeSlider from "@/components/FontSizeSlider";
import ToggleTranslation from "@/components/ToggleTranslation";

const themeOptions: ThemeMode[] = ["system", "light", "dark"];

const SettingsScreen: React.FC = () => {
  const { settings, setSettings, isDark } = useSettings();
  const colors = isDark ? darkColors : lightColors;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>Tema</Text>
        <View style={styles.row}>
          {themeOptions.map((opt) => (
            <Pressable
              key={opt}
              onPress={() => setSettings({ themeMode: opt })}
              style={[
                styles.pill,
                { backgroundColor: settings.themeMode === opt ? colors.primary : colors.badge }
              ]}
            >
              <Text
                style={{
                  color: settings.themeMode === opt ? "#0b1224" : colors.badgeText,
                  fontWeight: "700"
                }}
              >
                {opt}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, gap: 12 }}>
        <FontSizeSlider />
        <ToggleTranslation />
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <View style={styles.rowBetween}>
            <Text style={[styles.label, { color: colors.text }]}>Putar otomatis ayat berikut</Text>
            <Switch
              value={settings.autoPlayNext}
              onValueChange={(v) => setSettings({ autoPlayNext: v })}
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          </View>
          <View style={[styles.rowBetween, { marginTop: 12 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Ulang ayat</Text>
            <Switch
              value={settings.repeatAyah}
              onValueChange={(v) => setSettings({ repeatAyah: v })}
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          </View>
        </View>
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>Base URL API</Text>
          <Text style={{ color: colors.muted, marginTop: 4 }}>{process.env.EXPO_PUBLIC_BASE_URL}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderWidth: 1,
    borderRadius: 12
  },
  title: { fontSize: 16, fontWeight: "800" },
  row: { flexDirection: "row", gap: 8, marginTop: 10 },
  pill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label: { fontSize: 15 }
});

export default SettingsScreen;
