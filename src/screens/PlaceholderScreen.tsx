import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSettings } from "@/store/SettingsProvider";
import { lightColors, darkColors } from "@/theme";

const PlaceholderScreen: React.FC<{ title: string }> = ({ title }) => {
  const { isDark } = useSettings();
  const colors = isDark ? darkColors : lightColors;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>Coming Soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  subtitle: { fontSize: 16 }
});

export default PlaceholderScreen;
