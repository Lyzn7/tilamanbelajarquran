import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Slider from "@react-native-community/slider";
import { useSettings } from "@/store/SettingsProvider";
import { lightColors, darkColors } from "@/theme";

const FontSizeSlider: React.FC = () => {
  const { settings, setSettings, isDark } = useSettings();
  const colors = isDark ? darkColors : lightColors;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.text }]}>Ukuran Huruf Arab</Text>
      <Text style={[styles.value, { color: colors.muted }]}>{Math.round(settings.fontSize)} pt</Text>
      <Slider
        minimumValue={20}
        maximumValue={48}
        value={settings.fontSize}
        onValueChange={(val) => setSettings({ fontSize: val })}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor={colors.border}
        thumbTintColor={colors.primary}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14
  },
  label: { fontSize: 16, fontWeight: "700" },
  value: { fontSize: 13, marginBottom: 6 }
});

export default FontSizeSlider;
