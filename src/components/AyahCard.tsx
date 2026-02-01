import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Ayah } from "@/types/api";
import { useSettings } from "@/store/SettingsProvider";
import { useReadingState } from "@/store/ReadingStateProvider";
import { lightColors, darkColors } from "@/theme";
import * as Clipboard from "expo-clipboard";
import { Share } from "react-native";

interface Props {
  ayah: Ayah;
  surahNumber: number;
  surahName: string;
  qari: string;
  fontSize: number;
  showTranslation: boolean;
  isActive: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
  onScrollTo?: () => void;
}

const AyahCard: React.FC<Props> = ({
  ayah,
  surahNumber,
  surahName,
  qari,
  fontSize,
  showTranslation,
  isActive,
  isPlaying,
  onPlay,
  onStop,
  onScrollTo
}) => {
  const { isDark } = useSettings();
  const colors = isDark ? darkColors : lightColors;
  const { isBookmarked, toggleBookmark } = useReadingState();

  const bookmark = () =>
    toggleBookmark({
      surah: surahNumber,
      ayah: ayah.nomorAyat,
      surahName,
      arabic: ayah.teksArab,
      translation: ayah.teksIndonesia
    });

  const copyText = async () => {
    await Clipboard.setStringAsync(`${ayah.teksArab}\n${ayah.teksIndonesia}`);
  };

  const shareAyah = () =>
    Share.share({
      message: `${surahName}:${ayah.nomorAyat}\n${ayah.teksArab}\n${ayah.teksIndonesia}`
    });

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: isActive ? colors.primary : colors.border
        }
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.number, { backgroundColor: colors.badge }]}>
          <Text style={[styles.numberText, { color: colors.badgeText }]}>{ayah.nomorAyat}</Text>
        </View>
        <View style={styles.actions}>
          <Pressable onPress={bookmark} hitSlop={12}>
            <Ionicons
              name={isBookmarked(surahNumber, ayah.nomorAyat) ? "bookmark" : "bookmark-outline"}
              color={colors.text}
              size={18}
            />
          </Pressable>
          <Pressable onPress={copyText} hitSlop={12} style={{ marginLeft: 12 }}>
            <Ionicons name="copy-outline" size={18} color={colors.text} />
          </Pressable>
          <Pressable onPress={shareAyah} hitSlop={12} style={{ marginLeft: 12 }}>
            <Ionicons name="share-social-outline" size={18} color={colors.text} />
          </Pressable>
          {onScrollTo && (
            <Pressable onPress={onScrollTo} hitSlop={12} style={{ marginLeft: 12 }}>
              <Ionicons name="locate-outline" size={18} color={colors.text} />
            </Pressable>
          )}
        </View>
      </View>
      <Text
        style={[
          styles.arab,
          { color: colors.text, fontSize, lineHeight: fontSize + 12, fontFamily: "Scheherazade_700Bold", textAlign: "right" }
        ]}
      >
        {ayah.teksArab}
      </Text>
      <Text style={[styles.latin, { color: colors.muted }]}>{ayah.teksLatin}</Text>
      {showTranslation && <Text style={[styles.translation, { color: colors.muted }]}>{ayah.teksIndonesia}</Text>}
      <View style={styles.footer}>
        <Pressable onPress={isPlaying ? onStop : onPlay} style={styles.audioButton}>
          <Ionicons name={isPlaying ? "pause" : "play"} size={18} color={colors.text} />
          <Text style={[styles.audioText, { color: colors.text }]}>Audio {qari}</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  number: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  numberText: { fontWeight: "700" },
  actions: { flexDirection: "row", alignItems: "center" },
  arab: { fontWeight: "700" },
  latin: { fontSize: 14, marginTop: 6 },
  translation: { fontSize: 14, marginTop: 8 },
  footer: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  audioButton: { flexDirection: "row", alignItems: "center", gap: 8 },
  audioText: { fontSize: 13, fontWeight: "600" }
});

export default AyahCard;
