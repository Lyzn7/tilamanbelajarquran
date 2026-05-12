import React from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { useSettings } from "@/store/SettingsProvider";
import { lightColors, darkColors } from "@/theme";

const JuzListScreen: React.FC = () => {
  const { isDark } = useSettings();
  const colors = isDark ? darkColors : lightColors;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Juz</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Coming Soon</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  card: { alignItems: "center", borderWidth: 1, borderRadius: 12, padding: 20, minWidth: 220 },
  title: { fontSize: 20, fontWeight: "800" },
  subtitle: { fontSize: 16, marginTop: 8 }
});

export default JuzListScreen;
