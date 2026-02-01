import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SurahSummary } from "@/types/api";
import { lightColors, darkColors } from "@/theme";
import { useSettings } from "@/store/SettingsProvider";

interface Props {
  item: SurahSummary;
  onPress: () => void;
  lastReadAyah?: number;
}

const SurahCard: React.FC<Props> = ({ item, onPress, lastReadAyah }) => {
  const { isDark } = useSettings();
  const colors = isDark ? darkColors : lightColors;

  return (
    <Pressable style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={onPress}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: colors.badge }]}>
          <Text style={[styles.badgeText, { color: colors.badgeText }]}>{item.nomor}</Text>
        </View>
        <View style={styles.meta}>
          <Text style={[styles.title, { color: colors.text }]}>{item.namaLatin}</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>{item.arti}</Text>
          <Text style={[styles.small, { color: colors.muted }]}>
            {item.jumlahAyat} ayat · {item.tempatTurun}
          </Text>
          {typeof lastReadAyah === "number" && (
            <View style={[styles.progress, { backgroundColor: colors.badge }]}>
              <Ionicons name="bookmark-outline" color={colors.badgeText} size={14} />
              <Text style={[styles.progressText, { color: colors.badgeText }]}>Terakhir di ayat {lastReadAyah}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.arab, { color: colors.text }]}>{item.nama}</Text>
      </View>
      <View style={styles.footer}>
        <Ionicons name="play-circle-outline" color={colors.muted} size={18} />
        <Text style={[styles.small, { color: colors.muted }]}>Audio tersedia</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12
  },
  header: { flexDirection: "row", alignItems: "center" },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, marginRight: 12 },
  badgeText: { fontWeight: "700" },
  meta: { flex: 1, gap: 2 },
  title: { fontSize: 17, fontWeight: "700" },
  subtitle: { fontSize: 14, fontWeight: "500" },
  small: { fontSize: 12 },
  arab: { fontSize: 20, marginLeft: 8, fontWeight: "700" },
  progress: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
    alignSelf: "flex-start"
  },
  progressText: { fontSize: 12, fontWeight: "600" },
  footer: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 }
});

export default SurahCard;
