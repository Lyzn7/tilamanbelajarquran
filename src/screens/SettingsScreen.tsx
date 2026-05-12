import FontSizeSlider from "@/components/FontSizeSlider";
import ToggleTranslation from "@/components/ToggleTranslation";
import { ThemeMode, useSettings } from "@/store/SettingsProvider";
import { darkColors, lightColors } from "@/theme";
import React from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

const themeOptions: ThemeMode[] = ["system", "light", "dark"];

const SettingsScreen: React.FC = () => {
  const { settings, setSettings, isDark } = useSettings();
  const colors = isDark ? darkColors : lightColors;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <Text style={[styles.screenTitle, { color: colors.text }]}>Pengaturan</Text>

          <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={[styles.title, { color: colors.text }]}>Tema</Text>
            <View style={styles.row}>
              {themeOptions.map((opt) => (
                <Pressable
                  key={opt}
                  onPress={() => setSettings({ themeMode: opt })}
                  style={[
                    styles.pill,
                    { backgroundColor: settings.themeMode === opt ? colors.primary : colors.badge },
                  ]}
                >
                  <Text
                    style={{
                      color: settings.themeMode === opt ? "#0b1224" : colors.badgeText,
                      fontWeight: "700",
                    }}
                  >
                    {opt}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

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
            <Text style={[styles.title, { color: colors.text }]}>Unduhan Otomatis</Text>
            <View style={[styles.rowBetween, { marginTop: 10 }]}>
              <Text style={[styles.label, { color: colors.text }]}>Auto unduh teks saat buka</Text>
              <Switch
                value={settings.autoDownloadText}
                onValueChange={(v) => setSettings({ autoDownloadText: v })}
                trackColor={{ true: colors.primary, false: colors.border }}
              />
            </View>
            <View style={[styles.rowBetween, { marginTop: 10 }]}>
              <Text style={[styles.label, { color: colors.text }]}>Auto unduh audio saat buka</Text>
              <Switch
                value={settings.autoDownloadAudio}
                onValueChange={(v) => setSettings({ autoDownloadAudio: v })}
                trackColor={{ true: colors.primary, false: colors.border }}
              />
            </View>
            <View style={[styles.rowBetween, { marginTop: 10 }]}>
              <Text style={[styles.label, { color: colors.text }]}>Unduh hanya via Wi-Fi</Text>
              <Switch
                value={settings.wifiOnlyDownload}
                onValueChange={(v) => setSettings({ wifiOnlyDownload: v })}
                trackColor={{ true: colors.primary, false: colors.border }}
              />
            </View>
            <View style={styles.row}>
              {["full", "ayat"].map((mode) => (
                <Pressable
                  key={mode}
                  onPress={() => setSettings({ audioDownloadMode: mode as "full" | "ayat" })}
                  style={[
                    styles.pill,
                    {
                      backgroundColor:
                        settings.audioDownloadMode === mode ? colors.primary : colors.badge,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: settings.audioDownloadMode === mode ? "#0b1224" : colors.badgeText,
                      fontWeight: "700",
                    }}
                  >
                    {mode === "full" ? "Audio full" : "Audio ayat"}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingTop: 12, paddingBottom: 32 },
  content: { paddingHorizontal: 16, gap: 12 },
  screenTitle: {
    marginBottom: 12,
    fontSize: 24,
    fontWeight: "900",
  },
  card: {
    marginBottom: 12,
    padding: 14,
    borderWidth: 1,
    borderRadius: 12,
  },
  title: { fontSize: 16, fontWeight: "800" },
  row: { flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  pill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  label: { fontSize: 15, flexShrink: 1 },
  fieldGroup: { marginTop: 10, gap: 10 },
  helpText: { fontSize: 12, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 6,
  },
  numberInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 70,
    textAlign: "right",
  },
});

export default SettingsScreen;
