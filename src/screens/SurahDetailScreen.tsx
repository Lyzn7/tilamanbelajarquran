import { getSurahDetail, getSurahList, getTafsir } from "@/api/equran";
import { queryKeys } from "@/api/queryKeys";
import AyahCard from "@/components/AyahCard";
import FontSizeSlider from "@/components/FontSizeSlider";
import ToggleTranslation from "@/components/ToggleTranslation";
import { useSurahDownload } from "@/hooks/useSurahDownload";
import { RootStackParamList } from "@/navigation";
import { useReadingState } from "@/store/ReadingStateProvider";
import { useSettings } from "@/store/SettingsProvider";
import { darkColors, lightColors } from "@/theme";
import { Ayah } from "@/types/api";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Audio, AVPlaybackStatus } from "expo-av";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  ListRenderItemInfo,
  Modal,
  PanResponder,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewToken
} from "react-native";

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
  const navigation = useNavigation<import("@react-navigation/native-stack").NativeStackNavigationProp<RootStackParamList>>();
  const { nomor, initialAyah, autoPlay } = route.params;
  const { settings, setSettings, isDark } = useSettings();
  const { setLastRead, lastRead } = useReadingState();
  const colors = isDark ? darkColors : lightColors;
  const { cacheText } = useSurahDownload(nomor);

  const soundRef = useRef<Audio.Sound | null>(null);
  const playToken = useRef(0);
  const didAutoPlay = useRef(false);
  // Refs to avoid stale closures in audio callbacks
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const [isPaused, setIsPaused] = useState(false);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [playingMode, setPlayingMode] = useState<"ayah" | "full" | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioPosition, setAudioPosition] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [showTafsir, setShowTafsir] = useState(false);
  const [tafsirShowAll, setTafsirShowAll] = useState(false);
  const [qariSheet, setQariSheet] = useState(false);
  // Uncontrolled refs untuk jump-to-ayat — tidak menyebabkan re-render saat mengetik
  const jumpAyatRef = useRef("");
  const jumpInputRef = useRef<TextInput>(null);

  const flatListRef = useRef<FlatList<Ayah>>(null);
  const panResponder = useRef(
    PanResponder.create({
      // Jangan intercept touch saat mulai — hanya intercept saat sudah bergerak horizontal
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 40 && Math.abs(g.dy) < 15,
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderRelease: (_, g) => {
        if (g.dx < -60 && data?.suratSelanjutnya && typeof data.suratSelanjutnya !== "boolean") goToSurah(data.suratSelanjutnya.nomor);
        else if (g.dx > 60 && data?.suratSebelumnya && typeof data.suratSebelumnya !== "boolean")
          goToSurah(data.suratSebelumnya.nomor);
      }
    })
  );

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.surahDetail(nomor),
    queryFn: () => getSurahDetail(nomor),
    staleTime: 1000 * 60 * 30
  });

  const tafsirQuery = useQuery({
    queryKey: queryKeys.tafsir(nomor),
    queryFn: () => getTafsir(nomor),
    enabled: showTafsir
  });

  const surahList = useQuery({
    queryKey: queryKeys.surahList,
    queryFn: getSurahList,
    staleTime: 1000 * 60 * 10
  }).data;

  const ayat = data?.ayat ?? [];

  useEffect(() => {
    return () => {
      unloadSound();
    };
  }, []);

  useEffect(() => {
    if (data && settings.autoDownloadText) cacheText(data);
  }, [data, settings.autoDownloadText, cacheText]);

  // Keep dataRef updated every render (for audio callbacks)
  const dataRef = useRef(data);
  dataRef.current = data;

  // Auto-play when navigated from Auto Next feature
  useEffect(() => {
    if (autoPlay && data && !didAutoPlay.current) {
      didAutoPlay.current = true;
      setTimeout(() => playFullSurah(), 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const unloadSound = async () => {
    try {
      await soundRef.current?.unloadAsync();
    } catch {
      // ignore
    } finally {
      soundRef.current = null;
      setPlayingAyah(null);
      setPlayingMode(null);
      setIsPaused(false);
      setIsAudioLoading(false);
      setAudioPosition(0);
      setAudioDuration(0);
    }
  };

  const stopAudio = async () => {
    playToken.current += 1;
    await unloadSound();
  };

  /**
   * Core audio loader — called by playAyah (manual) and onStatus (auto-advance).
   * ayahNum + mode are passed explicitly to avoid stale-closure issues in callbacks.
   */
  const playAyahCore = async (ayahNum: number, mode: "ayah" | "full") => {
    const currentData = dataRef.current;
    const currentSettings = settingsRef.current;
    if (!currentData) return;
    const target = currentData.ayat.find((a) => a.nomorAyat === ayahNum);
    if (!target) { console.warn(`[Audio] ayah ${ayahNum} not found`); return; }
    const audioUrl = target.audio[currentSettings.qari];
    if (!audioUrl) throw new Error(`URL audio tidak tersedia (qari ${currentSettings.qari}, ayat ${ayahNum})`);

    console.log(`[Audio] loading surah=${nomor} ayah=${ayahNum} mode=${mode} qari=${currentSettings.qari}`);
    await unloadSound();
    const token = ++playToken.current;
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false });
    const snd = new Audio.Sound();
    await snd.loadAsync({ uri: audioUrl });
    // Hanya update posisi 1x per detik — mencegah re-render berlebihan yang membuat button lambat
    await snd.setStatusAsync({ progressUpdateIntervalMillis: 1000 });
    soundRef.current = snd;
    // Pass ayahNum & mode directly so the callback is never stale
    snd.setOnPlaybackStatusUpdate((st) => onAudioStatus(st, token, ayahNum, mode));
    await snd.playAsync();
    setPlayingMode(mode);
    setPlayingAyah(ayahNum);
    setIsPaused(false);
    if (mode === "ayah") setLastRead({ surah: nomor, ayah: ayahNum, surahName: currentData.namaLatin });
    console.log(`[Audio] playing ayah=${ayahNum} mode=${mode}`);
  };

  /**
   * Status callback — receives ayahNum + mode as parameters, NOT from closure.
   * Uses settingsRef/dataRef for latest settings without stale closure.
   */
  const onAudioStatus = async (
    status: AVPlaybackStatus,
    token: number,
    ayahNum: number,
    mode: "ayah" | "full"
  ) => {
    if (token !== playToken.current) return;
    if (!status.isLoaded) return;
    setAudioPosition(status.positionMillis);
    setAudioDuration(status.durationMillis ?? 0);
    if (!status.didJustFinish) return;

    const s = settingsRef.current;
    const d = dataRef.current;

    if (mode === "full") {
      const nextAyah = ayahNum + 1;
      if (d && nextAyah <= d.jumlahAyat) {
        // Advance to next ayah in same surah
        console.log(`[Audio] full: ${ayahNum} → ${nextAyah}/${d.jumlahAyat}`);
        try {
          await playAyahCore(nextAyah, "full");
          scrollToAyah(nextAyah);
          setLastRead({ surah: nomor, ayah: nextAyah, surahName: d.namaLatin });
        } catch (err) {
          console.error("[Audio] auto-advance error:", err);
          await unloadSound();
        }
        return;
      }
      // Last ayah of surah finished
      console.log(`[Audio] full: surah ${nomor} selesai di ayah ${ayahNum}`);
      if (s.autoPlayNext && d?.suratSelanjutnya && typeof d.suratSelanjutnya !== "boolean") {
        console.log(`[Audio] autoNext → surah ${d.suratSelanjutnya.nomor}`);
        navigation.replace("SurahDetail", { nomor: d.suratSelanjutnya.nomor, autoPlay: true });
        return;
      }
      if (s.repeatAyah && d) {
        console.log(`[Audio] repeat surah: restart dari ayah 1`);
        try {
          await playAyahCore(1, "full");
          scrollToAyah(1);
        } catch (err) {
          console.error("[Audio] repeat surah error:", err);
          await unloadSound();
        }
        return;
      }
      await unloadSound();
      return;
    }

    // mode === "ayah" (single manual playback)
    if (s.repeatAyah) {
      await soundRef.current?.replayAsync();
      return;
    }
    await unloadSound();
  };

  /** Manual: play a single ayah (tap play on a card) */
  const playAyah = async (ayahNumber: number) => {
    if (isAudioLoading) return;
    console.log(`[Audio] playAyah (manual): ayah=${ayahNumber}`);
    setIsAudioLoading(true);
    try {
      await playAyahCore(ayahNumber, "ayah");
    } catch (err) {
      Alert.alert("Gagal memutar audio", (err as Error)?.message ?? String(err));
      await unloadSound();
    } finally {
      setIsAudioLoading(false);
    }
  };

  /** Putar penuh = mainkan ayat per ayat dari ayat 1 hingga selesai */
  const playFullSurah = async () => {
    if (isAudioLoading) return;
    const d = dataRef.current;
    console.log(`[Audio] playFullSurah: surah=${nomor} namaLatin=${d?.namaLatin} total=${d?.jumlahAyat} qari=${settingsRef.current.qari} autoNext=${settingsRef.current.autoPlayNext} repeat=${settingsRef.current.repeatAyah}`);
    setIsAudioLoading(true);
    try {
      await playAyahCore(1, "full");
    } catch (err) {
      Alert.alert("Gagal memutar audio", (err as Error)?.message ?? String(err));
      await unloadSound();
    } finally {
      setIsAudioLoading(false);
    }
  };

  const togglePause = async () => {
    const snd = soundRef.current;
    if (!snd) return;
    const st = await snd.getStatusAsync();
    if (!st.isLoaded) return;
    if (st.isPlaying) {
      await snd.pauseAsync();
      setIsPaused(true);
    } else {
      await snd.playAsync();
      setIsPaused(false);
    }
  };



  const scrollToAyah = (ayahNumber: number) => {
    const index = Math.max(ayahNumber - 1, 0);
    flatListRef.current?.scrollToIndex({ index, animated: true });
  };

  useEffect(() => {
    if (initialAyah) scrollToAyah(initialAyah);
  }, [initialAyah]);

  const goToSurah = (num: number) => navigation.replace("SurahDetail", { nomor: num });

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const top = viewableItems[0]?.item as Ayah | undefined;
      if (top) setLastRead({ surah: nomor, ayah: top.nomorAyat, surahName: data?.namaLatin ?? "" });
    },
    [nomor, data?.namaLatin, setLastRead]
  );



  const onScrollToIndexFailed = useCallback((info: { index: number; averageItemLength: number }) => {
    flatListRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: true });
    setTimeout(() => flatListRef.current?.scrollToIndex({ index: info.index, animated: true }), 50);
  }, []);

  const renderHeader = useCallback(() => {
    if (!data) return null;
    return (
      <View style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 56 }]}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.surahTitle, { color: colors.text }]}>{data.namaLatin} · {data.arti}</Text>
            <Text style={{ color: colors.muted, marginTop: 2 }}>
              {data.tempatTurun} · {data.jumlahAyat} ayat
            </Text>
          </View>
          <Text style={[styles.arab, { color: colors.text }]}>{data.nama}</Text>
        </View>

        {lastRead?.surah === nomor && (
          <Pressable style={[styles.cta, { borderColor: colors.border }]} onPress={() => scrollToAyah(lastRead.ayah)}>
            <Ionicons name="arrow-down-circle" size={16} color={colors.primary} />
            <Text style={{ color: colors.primary, fontWeight: "700" }}>Lanjutkan terakhir dibaca (ayat {lastRead.ayah})</Text>
          </Pressable>
        )}

        <View style={styles.quickRow}>
          <Pressable
            style={[styles.chip, { borderColor: colors.border }, settings.autoPlayNext && styles.chipActive]}
            onPress={() => {
              const next = !settings.autoPlayNext;
              setSettings({ autoPlayNext: next, ...(next ? { repeatAyah: false } : {}) });
            }}
          >
            <Text style={[styles.chipText, { color: settings.autoPlayNext ? colors.primary : colors.text }]}>Auto Next</Text>
          </Pressable>
          <Pressable
            style={[styles.chip, { borderColor: colors.border }, settings.repeatAyah && styles.chipActive]}
            onPress={() => {
              const next = !settings.repeatAyah;
              setSettings({ repeatAyah: next, ...(next ? { autoPlayNext: false } : {}) });
            }}
          >
            <Text style={[styles.chipText, { color: settings.repeatAyah ? colors.primary : colors.text }]}>Repeat Surah</Text>
          </Pressable>
          <Pressable style={[styles.chip, { borderColor: colors.border }]} onPress={() => setQariSheet(true)}>
            <Text style={[styles.chipText, { color: colors.text }]}>Qari: {qariOptions[settings.qari]}</Text>
          </Pressable>
        </View>

        <View style={styles.controls}>
          <Pressable
            onPress={playFullSurah}
            disabled={isAudioLoading}
            style={[styles.controlBtn, { borderColor: isAudioLoading ? colors.primary : colors.border, opacity: isAudioLoading ? 0.7 : 1 }]}
          >
            {isAudioLoading && !playingMode ? (
              <ActivityIndicator size={16} color={colors.primary} />
            ) : (
              <Ionicons name="play" color={colors.primary} size={16} />
            )}
            <Text style={{ color: colors.primary, fontWeight: "700" }}>
              {isAudioLoading && !playingMode ? "Memuat audio..." : "Putar penuh"}
            </Text>
          </Pressable>

          {/* Jump-to-Ayat: ganti tombol Awal */}
          <View style={[styles.jumpRow, { borderColor: colors.border, backgroundColor: colors.badge }]}>
            <Ionicons name="search" size={14} color={colors.muted} />
            <TextInput
              ref={jumpInputRef}
              style={[styles.jumpInput, { color: colors.text }]}
              placeholder={`Ayat 1-${data.jumlahAyat}`}
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              returnKeyType="go"
              blurOnSubmit={false}
              onChangeText={(text) => { jumpAyatRef.current = text; }}
              onSubmitEditing={() => {
                const n = parseInt(jumpAyatRef.current, 10);
                if (n >= 1 && n <= data.jumlahAyat) scrollToAyah(n);
              }}
            />
            <Pressable
              onPress={() => {
                const n = parseInt(jumpAyatRef.current, 10);
                if (n >= 1 && n <= data.jumlahAyat) scrollToAyah(n);
                jumpAyatRef.current = "";
                jumpInputRef.current?.clear();
                Keyboard.dismiss();
              }}
              hitSlop={8}
            >
              <Ionicons name="arrow-forward-circle" size={20} color={colors.primary} />
            </Pressable>
          </View>
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    data, colors, nomor, settings.autoPlayNext, settings.repeatAyah, settings.qari,
    lastRead, isAudioLoading, playingMode, showTafsir
  ]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Ayah>) => (
      <AyahCard
        ayah={item}
        surahNumber={nomor}
        surahName={data?.namaLatin ?? ""}
        qari={qariOptions[settings.qari]}
        fontSize={settings.fontSize}
        showTranslation={settings.showTranslation}
        isActive={playingAyah === item.nomorAyat}
        isPlaying={playingAyah === item.nomorAyat && playingMode === "ayah" && !isPaused}
        isLoading={isAudioLoading && playingAyah === item.nomorAyat}
        onPlay={() => playAyah(item.nomorAyat)}
        onStop={stopAudio}
        onScrollTo={() => scrollToAyah(item.nomorAyat)}
      />
    ),
    [nomor, data?.namaLatin, settings.qari, settings.fontSize, settings.showTranslation, playingAyah, playingMode, isPaused, isAudioLoading]
  );

  const prevSurah = data?.suratSebelumnya && typeof data.suratSebelumnya !== "boolean" ? data.suratSebelumnya : null;
  const nextSurah = data?.suratSelanjutnya || null;

  const renderFooter = useCallback(() => (
    <View style={{ paddingHorizontal: 16, paddingBottom: 100 }}>
      <FontSizeSlider />
      <View style={{ height: 12 }} />
      <ToggleTranslation />
      {showTafsir && (
        <View style={[styles.tafsirCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Tafsir Ringkas</Text>
          {tafsirQuery.isLoading && <ActivityIndicator color={colors.primary} />}
          {tafsirQuery.error && <Text style={{ color: colors.muted }}>Gagal memuat tafsir</Text>}
          {tafsirQuery.data && (
            <>
              {(tafsirShowAll ? tafsirQuery.data.tafsir : tafsirQuery.data.tafsir.slice(0, 5)).map((t) => (
                <View key={t.ayat} style={{ marginBottom: 12 }}>
                  <Text style={{ color: colors.primary, fontWeight: "700", marginBottom: 4 }}>Ayat {t.ayat}</Text>
                  <Text style={{ color: colors.muted, fontSize: 14 }}>{t.teks}</Text>
                </View>
              ))}
              {tafsirQuery.data.tafsir.length > 5 && (
                <Pressable
                  onPress={() => setTafsirShowAll(!tafsirShowAll)}
                  style={[styles.showAllBtn, { borderColor: colors.primary }]}
                >
                  <Text style={{ color: colors.primary, fontWeight: "700" }}>
                    {tafsirShowAll ? "Tampilkan lebih sedikit" : `Lihat semua (${tafsirQuery.data.tafsir.length} ayat)`}
                  </Text>
                </Pressable>
              )}
            </>
          )}
        </View>
      )}

      {/* Navigasi Surah */}
      <View style={[styles.surahNav, { borderColor: colors.border }]}>
        {prevSurah ? (
          <Pressable style={[styles.surahNavBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => goToSurah(prevSurah.nomor)}>
            <Ionicons name="chevron-back" size={16} color={colors.primary} />
            <View>
              <Text style={{ color: colors.muted, fontSize: 10 }}>Sebelumnya</Text>
              <Text style={{ color: colors.text, fontWeight: "700" }} numberOfLines={1}>{prevSurah.nomor}. {prevSurah.namaLatin}</Text>
            </View>
          </Pressable>
        ) : <View style={{ flex: 1 }} />}
        {nextSurah ? (
          <Pressable style={[styles.surahNavBtn, styles.surahNavBtnRight, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => goToSurah(nextSurah.nomor)}>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ color: colors.muted, fontSize: 10 }}>Selanjutnya</Text>
              <Text style={{ color: colors.text, fontWeight: "700" }} numberOfLines={1}>{nextSurah.nomor}. {nextSurah.namaLatin}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </Pressable>
        ) : <View style={{ flex: 1 }} />}
      </View>

      <View style={{ height: 32 }} />
    </View>
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [colors, showTafsir, tafsirQuery.data, tafsirQuery.isLoading, tafsirQuery.error, tafsirShowAll, prevSurah, nextSurah]);

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

  const navThree = (() => {
    const prev = data?.suratSebelumnya && typeof data.suratSebelumnya !== "boolean" ? data.suratSebelumnya : null;
    const current = data ? { nomor: nomor, namaLatin: data.namaLatin } : null;
    const next = data?.suratSelanjutnya || null;
    return [prev, current, next].filter(Boolean) as { nomor: number; namaLatin: string }[];
  })();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} {...panResponder.current.panHandlers}>
      <View style={[styles.navOverlay, { backgroundColor: colors.card, borderColor: colors.border }]} pointerEvents="box-none">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
          {navThree.map((s) => {
            const active = s.nomor === nomor;
            return (
              <Pressable
                key={s.nomor}
                onPress={() => goToSurah(s.nomor)}
                style={[
                  styles.navPill,
                  { backgroundColor: active ? colors.primary : colors.badge, borderColor: colors.border }
                ]}
              >
                <Text style={{ color: active ? "#0b1224" : colors.badgeText, fontWeight: "700", fontSize: 12 }}>
                  {s.nomor}. {s.namaLatin}
                </Text>
              </Pressable>
            );
          })}
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
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        onScrollToIndexFailed={onScrollToIndexFailed}
      />

      <Modal visible={qariSheet} animationType="slide" transparent onRequestClose={() => setQariSheet(false)}>
        <View style={styles.sheetBackdrop}>
          <View style={[styles.sheet, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>Pilih Qari</Text>
            {Object.entries(qariOptions).map(([key, label]) => (
              <Pressable
                key={key}
                style={[styles.sheetItem, settings.qari === key && { backgroundColor: colors.badge }]}
                onPress={() => {
                  setSettings({ qari: key });
                  setQariSheet(false);
                }}
              >
                <Text style={{ color: colors.text, fontWeight: "700" }}>{label}</Text>
              </Pressable>
            ))}
            <Pressable style={[styles.sheetItem, { alignItems: "center" }]} onPress={() => setQariSheet(false)}>
              <Text style={{ color: colors.primary, fontWeight: "700" }}>Tutup</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {(playingMode || isAudioLoading) && (
        <View style={[styles.audioFloating, { backgroundColor: colors.card, borderColor: isAudioLoading ? colors.primary : colors.border }]}>
          <Pressable style={[styles.iconBtn, { borderColor: colors.border }]} onPress={togglePause} disabled={isAudioLoading}>
            {isAudioLoading
              ? <ActivityIndicator size={18} color={colors.primary} />
              : <Ionicons name={isPaused ? "play" : "pause"} size={18} color={colors.primary} />}
          </Pressable>
          <View style={styles.audioTextWrap}>
            <Text style={[styles.audioTitle, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
              {isAudioLoading
                ? "Memuat audio..."
                : playingMode === "ayah" && playingAyah
                  ? `Ayat ${playingAyah} · ${qariOptions[settings.qari]}`
                  : `Memutar penuh · ${qariOptions[settings.qari]}`}
            </Text>
            {/* Progress bar */}
            <View style={[styles.audioProgress, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.audioProgressFill,
                  { width: `${audioDuration > 0 ? Math.min((audioPosition / audioDuration) * 100, 100) : 0}%`, backgroundColor: colors.primary }
                ]}
              />
            </View>
            <Text style={[styles.audioSubtitle, { color: colors.muted }]}>
              {isAudioLoading
                ? "Mohon tunggu..."
                : audioDuration > 0
                  ? `${Math.floor(audioPosition / 60000)}:${String(Math.floor((audioPosition % 60000) / 1000)).padStart(2, "0")} / ${Math.floor(audioDuration / 60000)}:${String(Math.floor((audioDuration % 60000) / 1000)).padStart(2, "0")}`
                  : "Memuat..."}
            </Text>
          </View>
          <Pressable style={[styles.iconBtn, { borderColor: colors.border }]} onPress={stopAudio} disabled={isAudioLoading}>
            <Ionicons name="stop" size={18} color={colors.muted} />
          </Pressable>
        </View>
      )}
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
  cta: {
    marginTop: 10,
    padding: 10,
    borderWidth: 1,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  audioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 12
  },
  audioTextWrap: { flex: 1, minWidth: 0 },
  audioTitle: { fontWeight: "700", flexShrink: 1 },
  audioSubtitle: { fontSize: 12, flexShrink: 1 },
  iconBtn: { padding: 8, borderWidth: 1, borderRadius: 8 },
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
  quickRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    flexWrap: "wrap"
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1
  },
  chipActive: {
    backgroundColor: "#E0F4FF",
    borderColor: "#00C8FF"
  },
  chipText: { fontWeight: "700" },
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
  badge: {
    alignSelf: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999
  },
  badgeText: { color: "#0b1224", fontWeight: "700" },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end"
  },
  sheet: {
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16
  },
  sheetItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 8
  },
  audioFloating: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    elevation: 8,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }
  },
  audioProgress: {
    height: 4,
    borderRadius: 4,
    marginTop: 6,
    marginBottom: 2,
    overflow: "hidden"
  },
  audioProgressFill: {
    height: 4,
    borderRadius: 4
  },
  showAllBtn: {
    marginTop: 8,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10
  },
  surahNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1
  },
  surahNavBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12
  },
  surahNavBtnRight: {
    justifyContent: "flex-end"
  },
  jumpRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  jumpInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 2
  }
});

export default SurahDetailScreen;
