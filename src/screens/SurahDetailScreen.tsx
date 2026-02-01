import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ListRenderItemInfo,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Alert,
  PanResponder,
  ScrollView
} from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Audio, AVPlaybackStatusSuccess } from "expo-av";
import { useQuery } from "@tanstack/react-query";
import { getSurahDetail, getTafsir, getSurahList } from "@/api/equran";
import { queryKeys } from "@/api/queryKeys";
import AyahCard from "@/components/AyahCard";
import FontSizeSlider from "@/components/FontSizeSlider";
import ToggleTranslation from "@/components/ToggleTranslation";
import { useSettings } from "@/store/SettingsProvider";
import { useReadingState } from "@/store/ReadingStateProvider";
import { useSurahDownload } from "@/hooks/useSurahDownload";
import { lightColors, darkColors } from "@/theme";
import { Ayah, SurahDetail, TafsirResponse } from "@/types/api";
import { RootStackParamList } from "@/navigation";

type ScreenRoute = RouteProp<RootStackParamList, "SurahDetail">;

const qariOptions: Record<string, string> = {
  "01": "Abdullah Al-Juhany",
  "02": "Abdul-Muhsin Al-Qasim",
  "03": "Abdurrahman as-Sudais",
  "04": "Ibrahim Al-Dossari",
  "05": "Misyari Rasyid Al-Afasi",
  "06": "Yasser Al-Dosari"
};

const SurahDetailScreen: React.FC = () => {
  const route = useRoute<ScreenRoute>();
  const navigation = useNavigation();
  const { nomor, initialAyah } = route.params;
  const { settings, setSettings, isDark } = useSettings();
  const { setLastRead } = useReadingState();
  const colors = isDark ? darkColors : lightColors;
  const {
    entry: downloadEntry,
    cacheText,
    downloadAudio,
    downloading,
    progress
  } = useSurahDownload(nomor);

  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [playingMode, setPlayingMode] = useState<"ayah" | "full" | null>(null);
  const [showTafsir, setShowTafsir] = useState(false);
  const panResponder = useRef(PanResponder.create({ onMoveShouldSetPanResponder: () => false }));

  const flatListRef = useRef<FlatList<Ayah>>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.surahDetail(nomor),
    queryFn: () => getSurahDetail(nomor),
    staleTime: 1000 * 60 * 30
  });

  const { data: tafsirData } = useQuery({
    queryKey: queryKeys.tafsir(nomor),
    queryFn: () => getTafsir(nomor),
    enabled: showTafsir
  });

  const { data: surahList } = useQuery({
    queryKey: queryKeys.surahList,
    queryFn: getSurahList,
    staleTime: 1000 * 60 * 10
  });

  const ayat = data?.ayat ?? [];

  const cleanupAudio = async () => {
    try {
      await sound?.unloadAsync();
    } catch (err) {
      // noop
    } finally {
      setPlayingAyah(null);
      setPlayingMode(null);
    }
  };

  useEffect(() => {
    return () => {
      cleanupAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (data && settings.autoDownloadText && !downloadEntry?.textCached) {
      cacheText(data);
    }
  }, [data, settings.autoDownloadText, downloadEntry?.textCached, cacheText]);

  useEffect(() => {
    const auto = async () => {
      if (!data) return;
      if (settings.autoDownloadAudio && downloadEntry?.audio?.[settings.qari]?.[settings.audioDownloadMode] == null) {
        await downloadAudio(settings.audioDownloadMode, settings.qari, data);
      }
    };
    auto();
  }, [data, settings.autoDownloadAudio, settings.audioDownloadMode, settings.qari, downloadEntry, downloadAudio]);

  const goToSurah = (num: number) => {
    navigation.replace("SurahDetail" as never, { nomor: num } as never);
  };

  useEffect(() => {
    panResponder.current = PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 25 && Math.abs(gesture.dy) < 20,
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx < -40 && data?.suratSelanjutnya) {
          goToSurah(data.suratSelanjutnya.nomor);
        } else if (gesture.dx > 40 && data?.suratSebelumnya && typeof data.suratSebelumnya !== "boolean") {
          goToSurah(data.suratSebelumnya.nomor);
        }
      }
    });
  }, [data]);

  const onPlaybackStatusUpdate = (status: AVPlaybackStatusSuccess) => {
    if (!status.isLoaded) return;
    if (status.didJustFinish) {
      if (playingMode === "ayah" && settings.repeatAyah) {
        sound?.replayAsync();
        return;
      }
      if (playingMode === "ayah" && settings.autoPlayNext && data) {
        const nextAyah = (playingAyah || 0) + 1;
        if (nextAyah <= data.jumlahAyat) {
          playAyah(nextAyah);
          scrollToAyah(nextAyah);
          return;
        }
      }
      cleanupAudio();
    }
  };

  const playAyah = async (ayahNumber: number) => {
    if (!data) return;
    const target = data.ayat.find((a) => a.nomorAyat === ayahNumber);
    if (!target) return;
    const audioUrl = target.audio[settings.qari];
    if (!audioUrl) {
      Alert.alert("Audio tidak tersedia untuk qari ini");
      return;
    }
    await cleanupAudio();
    const snd = new Audio.Sound();
    await snd.loadAsync({ uri: audioUrl }, { shouldPlay: true });
    snd.setOnPlaybackStatusUpdate((st) => {
      if (!st.isLoaded) return;
      onPlaybackStatusUpdate(st as AVPlaybackStatusSuccess);
    });
    setSound(snd);
    setPlayingAyah(ayahNumber);
    setPlayingMode("ayah");
    setLastRead({ surah: nomor, ayah: ayahNumber, surahName: data.namaLatin });
  };

  const playFullSurah = async () => {
    if (!data) return;
    const audioUrl = data.audioFull[settings.qari];
    if (!audioUrl) {
      Alert.alert("Audio penuh tidak tersedia untuk qari ini");
      return;
    }
    await cleanupAudio();
    const snd = new Audio.Sound();
    await snd.loadAsync({ uri: audioUrl }, { shouldPlay: true });
    snd.setOnPlaybackStatusUpdate((st) => {
      if (!st.isLoaded) return;
      if ((st as AVPlaybackStatusSuccess).didJustFinish) cleanupAudio();
    });
    setSound(snd);
    setPlayingAyah(null);
    setPlayingMode("full");
  };

  const scrollToAyah = (ayahNumber: number) => {
    const index = Math.max(ayahNumber - 1, 0);
    flatListRef.current?.scrollToIndex({ index, animated: true });
  };

  useEffect(() => {
    if (initialAyah) scrollToAyah(initialAyah);
  }, [initialAyah]);

  const renderHeader = () => {
    if (!data) return null;

    return (
      <View style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 56 }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.surahTitle, { color: colors.text }]}>
            {data.namaLatin} · {data.arti}
          </Text>
          <Text style={[styles.arab, { color: colors.text }]}>{data.nama}</Text>
        </View>
        <Text style={{ color: colors.muted, marginTop: 4 }}>
          {data.jumlahAyat} ayat · {data.tempatTurun}
        </Text>
        <Text style={[styles.desc, { color: colors.muted }]} numberOfLines={3}>
          {stripHtml(data.deskripsi)}
        </Text>
        <View style={[styles.downloadRow, { borderColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontWeight: "700" }}>
              {downloadEntry?.textCached ? "Teks tersimpan" : "Teks belum tersimpan"}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>
              Audio {downloadEntry?.audio?.[settings.qari]?.full || downloadEntry?.audio?.[settings.qari]?.ayat ? "tersimpan" : "belum tersimpan"}
            </Text>
            {progress && <Text style={{ color: colors.primary, fontSize: 12 }}>Mengunduh: {progress}</Text>}
          </View>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Pressable
              style={[styles.controlBtn, { borderColor: colors.border }]}
              onPress={() => downloadAudio("full", settings.qari, data)}
              disabled={downloading}
            >
              <Ionicons name="download-outline" size={16} color={colors.text} />
              <Text style={{ color: colors.text, fontWeight: "700" }}>Audio penuh</Text>
            </Pressable>
            <Pressable
              style={[styles.controlBtn, { borderColor: colors.border }]}
              onPress={() => downloadAudio("ayat", settings.qari, data)}
              disabled={downloading}
            >
              <Ionicons name="download-outline" size={16} color={colors.text} />
              <Text style={{ color: colors.text, fontWeight: "700" }}>Audio ayat</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.qariRow}>
          <Text style={[styles.qariLabel, { color: colors.text }]}>Qari</Text>
          <View style={styles.qariPills}>
            {Object.entries(qariOptions).map(([key, label]) => (
              <Pressable
                key={key}
                onPress={() => setSettings({ qari: key })}
                style={[
                  styles.pill,
                  {
                    backgroundColor: settings.qari === key ? colors.primary : colors.badge
                  }
                ]}
              >
                <Text
                  style={{
                    color: settings.qari === key ? "#0b1224" : colors.badgeText,
                    fontSize: 12,
                    fontWeight: "700"
                  }}
                >
                  {label.split(" ")[0]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={styles.controls}>
          <Pressable onPress={playFullSurah} style={[styles.controlBtn, { borderColor: colors.border }]}>
            <Ionicons name="play" color={colors.text} size={16} />
            <Text style={{ color: colors.text, fontWeight: "700" }}>Putar penuh</Text>
          </Pressable>
          <Pressable
            onPress={() => setSettings({ autoPlayNext: !settings.autoPlayNext })}
            style={[styles.controlBtn, { borderColor: colors.border }]}
          >
            <Ionicons
              name={settings.autoPlayNext ? "play-forward" : "play-forward-outline"}
              color={colors.text}
              size={16}
            />
            <Text style={{ color: colors.text, fontWeight: "700" }}>Auto next</Text>
          </Pressable>
          <Pressable
            onPress={() => setSettings({ repeatAyah: !settings.repeatAyah })}
            style={[styles.controlBtn, { borderColor: colors.border }]}
          >
            <Ionicons name={settings.repeatAyah ? "repeat" : "repeat-outline"} color={colors.text} size={16} />
            <Text style={{ color: colors.text, fontWeight: "700" }}>Ulang ayat</Text>
          </Pressable>
          <Pressable onPress={() => scrollToAyah(1)} style={[styles.controlBtn, { borderColor: colors.border }]}>
            <Ionicons name="arrow-down-circle-outline" color={colors.text} size={16} />
            <Text style={{ color: colors.text, fontWeight: "700" }}>Awal</Text>
          </Pressable>
        </View>
        <View style={[styles.toggleRow, { borderColor: colors.border }]}>
          <Pressable style={styles.toggleLeft} onPress={() => setShowTafsir(!showTafsir)}>
            <Ionicons name="book-outline" size={16} color={colors.text} />
            <Text style={{ color: colors.text, fontWeight: "600" }}>Tafsir</Text>
          </Pressable>
          <Pressable style={styles.toggleRight} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={16} color={colors.text} />
            <Text style={{ color: colors.text, fontWeight: "600" }}>Kembali</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderItem = ({ item }: ListRenderItemInfo<Ayah>) => (
    <AyahCard
      ayah={item}
      surahNumber={nomor}
      surahName={data?.namaLatin ?? ""}
      qari={qariOptions[settings.qari]}
      fontSize={settings.fontSize}
      showTranslation={settings.showTranslation}
      isActive={playingAyah === item.nomorAyat}
      isPlaying={playingAyah === item.nomorAyat && playingMode === "ayah"}
      onPlay={() => playAyah(item.nomorAyat)}
      onStop={() => cleanupAudio()}
      onScrollTo={() => scrollToAyah(item.nomorAyat)}
    />
  );

  const renderFooter = () => (
    <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
      <FontSizeSlider />
      <View style={{ height: 12 }} />
      <ToggleTranslation />
      {showTafsir && tafsirData && (
        <View style={[styles.tafsirCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Tafsir Ringkas</Text>
          {tafsirData.tafsir.slice(0, 5).map((t) => (
            <View key={t.ayat} style={{ marginBottom: 12 }}>
              <Text style={{ color: colors.primary, fontWeight: "700", marginBottom: 4 }}>Ayat {t.ayat}</Text>
              <Text style={{ color: colors.muted, fontSize: 14 }}>{t.teks}</Text>
            </View>
          ))}
        </View>
      )}
      <View style={{ height: 32 }} />
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background, justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background, padding: 16 }]}>
        <Text style={{ color: colors.text, marginBottom: 12 }}>Gagal memuat: {(error as Error)?.message}</Text>
        <Pressable onPress={() => refetch()}>
          <Text style={{ color: colors.primary }}>Coba lagi</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      {...(panResponder.current ? panResponder.current.panHandlers : {})}
    >
      <View style={[styles.navOverlay, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
          {(() => {
            const prev = data?.suratSebelumnya && typeof data.suratSebelumnya !== "boolean" ? data.suratSebelumnya : null;
            const current = data
              ? { nomor: nomor, namaLatin: data.namaLatin }
              : null;
            const next = data?.suratSelanjutnya || null;
            const list = [prev, current, next].filter(Boolean) as { nomor: number; namaLatin: string }[];
            return list.map((s) => {
              const active = s.nomor === nomor;
              return (
                <Pressable
                  key={s.nomor}
                  onPress={() => goToSurah(s.nomor)}
                  style={[
                    styles.navPill,
                    {
                      backgroundColor: active ? colors.primary : colors.badge,
                      borderColor: colors.border
                    }
                  ]}
                >
                  <Text style={{ color: active ? "#0b1224" : colors.badgeText, fontWeight: "700", fontSize: 12 }}>
                    {s.nomor}. {s.namaLatin}
                  </Text>
                </Pressable>
              );
            });
          })()}
        </ScrollView>
      </View>
      <FlatList
        ref={flatListRef}
        data={ayat}
        keyExtractor={(item) => item.nomorAyat.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 48, paddingTop: 80 }}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        onScrollBeginDrag={() => {
          // mark first visible as last read
          if (ayat.length > 0) {
            setLastRead({ surah: nomor, ayah: ayat[0].nomorAyat, surahName: data.namaLatin });
          }
        }}
      />
    </SafeAreaView>
  );
};

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "");

const styles = StyleSheet.create({
  screen: { flex: 1 },
  headerCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  surahTitle: { fontSize: 20, fontWeight: "800" },
  arab: { fontSize: 22, fontWeight: "800" },
  desc: { fontSize: 13, marginTop: 8 },
  qariRow: { marginTop: 12 },
  qariLabel: { fontWeight: "700", marginBottom: 6 },
  qariPills: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  controls: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  controlBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 10
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    borderTopWidth: 1,
    paddingTop: 12
  },
  toggleLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  toggleRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  tafsirCard: { borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 16 },
  sectionTitle: { fontSize: 17, fontWeight: "800", marginBottom: 8 },
  navPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  navOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 8,
    borderBottomWidth: 1,
    zIndex: 10
  },
  downloadRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    borderTopWidth: 1,
    marginTop: 10
  }
});

export default SurahDetailScreen;
