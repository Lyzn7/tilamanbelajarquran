import React from "react";
import { View, Text, Switch, StyleSheet } from "react-native";
import { useSettings } from "@/store/SettingsProvider";
import { lightColors, darkColors } from "@/theme";

const ToggleTranslation: React.FC = () => {
  const { settings, setSettings, isDark } = useSettings();
  const colors = isDark ? darkColors : lightColors;

  return (
    <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View>
        <Text style={[styles.title, { color: colors.text }]}>Tampilkan terjemahan</Text>
        <Text style={{ color: colors.muted, fontSize: 13 }}>Indonesia (Kemenag)</Text>
      </View>
      <Switch
        value={settings.showTranslation}
        onValueChange={(v) => setSettings({ showTranslation: v })}
        trackColor={{ true: colors.primary, false: colors.border }}
        thumbColor={settings.showTranslation ? "#fff" : "#f8fafc"}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  title: { fontSize: 16, fontWeight: "700" }
});

export default ToggleTranslation;
