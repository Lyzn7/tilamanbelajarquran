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
        <Text style={[styles.title, { color: colors.text }]}>Data Juz belum tersedia</Text>
        <Text style={{ color: colors.muted, marginTop: 6 }}>
          Dokumentasi equran.id API v2 tidak menyediakan endpoint Juz. Halaman ini akan diaktifkan otomatis begitu
          endpoint Juz resmi dirilis.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 16 },
  card: { borderWidth: 1, borderRadius: 12, padding: 16 },
  title: { fontSize: 18, fontWeight: "800" }
});

export default JuzListScreen;
