import { DoaItem, getAllDoa } from "@/api/doa";
import { getImsakiyah, getImsakKabKota, getImsakProvinsi, getShalatSchedule } from "@/api/equran";
import { getHijriDate } from "@/api/hijri";
import { queryKeys } from "@/api/queryKeys";
import { FeatureConfig, getFallbackFeatures, getFeatureConfig } from "@/api/remoteConfig";
import { useScheduleLocation } from "@/hooks/useScheduleLocation";
import { useSettings } from "@/store/SettingsProvider";
import { darkColors, lightColors } from "@/theme";
import { ImsakDay, ShalatDay } from "@/types/api";
import { buildEventsFromImsak, buildEventsFromShalat, formatHMS, nextEvent, normalizePrayerLabel } from "@/utils/schedule";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import Svg, { Circle } from "react-native-svg";

const startRamadan = new Date("2026-02-18T00:00:00");
const dayDiff = (from: Date, to: Date) => Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
const normalizeProvinceName = (name: string) => (name === "DI Yogyakarta" ? "D.I. Yogyakarta" : name);
const normalizeKabName = (name: string) => (name === "Kabupaten Bantul" ? "Kab. Bantul" : name);
const pad = (n: number) => n.toString().padStart(2, "0");
const dayOfYear = (d: Date) => {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
};
const hijriMonthIdToName: Record<number, string> = {
  1: "Muharram",
  2: "Safar",
  3: "Rabi'ul Awwal",
  4: "Rabi'ul Akhir",
  5: "Jumadil Ula",
  6: "Jumadil Akhir",
  7: "Rajab",
  8: "Sya'ban",
  9: "Ramadhan",
  10: "Syawal",
  11: "Dzulkaidah",
  12: "Dzulhijjah"
};

const DashboardScreen: React.FC = () => {
  const { isDark, settings } = useSettings();
  const colors = isDark ? darkColors : lightColors;
  const navigation = useNavigation<any>();
  const today = new Date();
  const [nowTick, setNowTick] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // schedule + location
  const { location, setLocation, hydrated } = useScheduleLocation();
  const { provinsi, kabkota } = location;
  const normalizedProv = normalizeProvinceName(provinsi || "");
  const normalizedKab = normalizeKabName(kabkota || "");

  const parsedStart = settings.startRamadanDate ? new Date(settings.startRamadanDate) : startRamadan;
  const userStart = isNaN(parsedStart.getTime()) ? startRamadan : parsedStart;
  const ramadanDay = useMemo(() => {
    const diff = dayDiff(userStart, today) + 1;
    return diff >= 1 && diff <= 30 ? diff : null;
  }, [today, userStart]);
  const tomorrow = useMemo(() => new Date(today.getTime() + 24 * 3600 * 1000), [today]);
  const todayKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  const provQuery = useQuery({
    queryKey: queryKeys.imsakProvinsi,
    queryFn: getImsakProvinsi,
    staleTime: 1000 * 60 * 60 * 24
  });
  useEffect(() => {
    if (provQuery.data && !provinsi) {
      const fallback = provQuery.data.find((p) => p.includes("Yogyakarta")) || provQuery.data[0];
      if (fallback) setLocation({ provinsi: fallback, kabkota: null });
    }
  }, [provQuery.data, provinsi, setLocation]);

  const kabQuery = useQuery({
    queryKey: provinsi ? queryKeys.imsakKabKota(normalizedProv) : queryKeys.imsakKabKota(""),
    queryFn: () => getImsakKabKota(normalizedProv || ""),
    enabled: Boolean(normalizedProv),
    staleTime: 1000 * 60 * 60 * 12
  });
  useEffect(() => {
    if (kabQuery.data && provinsi && !kabkota) {
      const fallback = kabQuery.data.find((k) => k.includes("Bantul")) || kabQuery.data[0];
      if (fallback) setLocation({ kabkota: fallback });
    }
  }, [kabQuery.data, provinsi, kabkota, setLocation]);

  const imsakQuery = useQuery({
    queryKey: provinsi && kabkota ? queryKeys.imsakiyah(normalizedProv, normalizedKab) : ["imsakiyah", "none"],
    queryFn: () => getImsakiyah(normalizedProv || "", normalizedKab || ""),
    enabled: Boolean(normalizedProv && normalizedKab && hydrated),
    staleTime: 1000 * 60 * 30
  });
  const shalatQuery = useQuery({
    queryKey: provinsi && kabkota
      ? queryKeys.shalatSchedule(normalizedProv, normalizedKab, today.getMonth() + 1, today.getFullYear())
      : ["shalat", "none"],
    queryFn: () => getShalatSchedule(normalizedProv || "", normalizedKab || "", today.getMonth() + 1, today.getFullYear()),
    enabled: Boolean(normalizedProv && normalizedKab && hydrated),
    staleTime: 1000 * 60 * 30
  });
  const tomorrowQuery = useQuery({
    queryKey:
      provinsi && kabkota
        ? queryKeys.shalatSchedule(normalizedProv, normalizedKab, tomorrow.getMonth() + 1, tomorrow.getFullYear())
        : ["shalat", "none", "next"],
    queryFn: () =>
      getShalatSchedule(normalizedProv || "", normalizedKab || "", tomorrow.getMonth() + 1, tomorrow.getFullYear()),
    enabled: Boolean(normalizedProv && normalizedKab && hydrated && tomorrow.getMonth() !== today.getMonth()),
    staleTime: 1000 * 60 * 30
  });

  const hijriQuery = useQuery({
    queryKey: [...queryKeys.hijriToday, todayKey],
    queryFn: () => getHijriDate(today),
    staleTime: 1000 * 60 * 60 * 6
  });

  const doaListQuery = useQuery({
    queryKey: ["doaList"],
    queryFn: getAllDoa,
    staleTime: 1000 * 60 * 60 * 24 // Cache for 24 hours
  });

  const [randomDoaId, setRandomDoaId] = useState<number | null>(null);

  useEffect(() => {
    if (doaListQuery.data && doaListQuery.data.length > 0 && randomDoaId === null) {
      // Pick a random ID only once per dashboard mount when data is available
      const randomItem = doaListQuery.data[Math.floor(Math.random() * doaListQuery.data.length)];
      setRandomDoaId(randomItem.id);
    }
  }, [doaListQuery.data, randomDoaId]);

  const featureConfigQuery = useQuery({
    queryKey: queryKeys.featureConfig,
    queryFn: getFeatureConfig,
    staleTime: 0 // bypass cache temporarily to ensure UI update
  });

  const todayIso = useMemo(() => {
    const m = pad(today.getMonth() + 1);
    const d = pad(today.getDate());
    return `${today.getFullYear()}-${m}-${d}`;
  }, [today]);
  const tomorrowIso = useMemo(() => {
    const m = pad(tomorrow.getMonth() + 1);
    const d = pad(tomorrow.getDate());
    return `${tomorrow.getFullYear()}-${m}-${d}`;
  }, [tomorrow]);

  const findShalatByDate = (iso: string): ShalatDay | undefined => {
    const curr = shalatQuery.data?.jadwal || [];
    const match = curr.find((d) => d.tanggal_lengkap === iso);
    if (match) return match;
    const next = tomorrowQuery.data?.jadwal || [];
    return next.find((d) => d.tanggal_lengkap === iso);
  };

  const activeScheduleToday = useMemo(() => {
    if (ramadanDay && imsakQuery.data?.imsakiyah) {
      return imsakQuery.data.imsakiyah.find((d) => d.tanggal === ramadanDay) || null;
    }
    return findShalatByDate(todayIso) || null;
  }, [ramadanDay, imsakQuery.data, todayIso, shalatQuery.data, tomorrowQuery.data]);

  const activeScheduleTomorrow = useMemo(() => {
    if (ramadanDay && ramadanDay + 1 <= 30 && imsakQuery.data?.imsakiyah) {
      return imsakQuery.data.imsakiyah.find((d) => d.tanggal === ramadanDay + 1) || null;
    }
    return findShalatByDate(tomorrowIso) || null;
  }, [ramadanDay, imsakQuery.data, tomorrowIso, shalatQuery.data, tomorrowQuery.data]);

  const activeEvents = useMemo(() => {
    if (!activeScheduleToday) return [];
    const baseDate = new Date(today); // gunakan tanggal hari ini
    if ("tanggal" in activeScheduleToday) {
      return buildEventsFromImsak(baseDate, activeScheduleToday as ImsakDay);
    }
    return buildEventsFromShalat(activeScheduleToday as ShalatDay);
  }, [activeScheduleToday, today]);

  const tomorrowEvents = useMemo(() => {
    if (!activeScheduleTomorrow) return [];
    const baseDateTomorrow = new Date(tomorrow); // tanggal besok
    if ("tanggal" in activeScheduleTomorrow) {
      return buildEventsFromImsak(baseDateTomorrow, activeScheduleTomorrow as ImsakDay);
    }
    return buildEventsFromShalat(activeScheduleTomorrow as ShalatDay);
  }, [activeScheduleTomorrow, tomorrow]);

  // Jangan geser ke +24 jam; event besok sudah mengandung tanggal besok.
  const mergedEvents = useMemo(() => {
    return [...activeEvents, ...tomorrowEvents].sort((a, b) => a.time.getTime() - b.time.getTime());
  }, [activeEvents, tomorrowEvents]);

  const prayerLabels = ["Subuh", "Dzuhur", "Ashar", "Maghrib", "Isya"];
  const prayerEvents = useMemo(
    () => mergedEvents.map((e) => ({ ...e, label: normalizePrayerLabel(e.label) })).filter((e) => prayerLabels.includes(e.label)),
    [mergedEvents]
  );

  const upcoming = useMemo(
    () => nextEvent(prayerEvents.length ? prayerEvents : mergedEvents, nowTick, prayerLabels),
    [prayerEvents, mergedEvents, nowTick]
  );

  // Debug log (only in dev, throttled per-upcoming change)
  const lastLogKey = useRef<string | null>(null);
  useEffect(() => {
    if (!__DEV__) return;
    const key = `${upcoming?.label}-${upcoming?.time?.getTime()}`;
    if (lastLogKey.current === key) return;
    lastLogKey.current = key;
    console.log("now", new Date(nowTick).toString());
    console.log("prayerEvents", prayerEvents.map((e) => [e.label, e.time.toString()]));
    console.log("mergedEvents", mergedEvents.map((e) => [e.label, e.time.toString()]));
    console.log("upcoming", upcoming?.label, upcoming?.time?.toString());
  }, [nowTick, prayerEvents, mergedEvents, upcoming]);
  const progress = useMemo(() => {
    if (!upcoming) return 0;
    const nextTime = upcoming.time.getTime();
    const prev = [...prayerEvents].reverse().find((e) => e.time.getTime() < nextTime && e.time.getTime() <= nowTick);
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const prevTime = prev?.time.getTime() ?? startOfDay.getTime();
    const total = Math.max(nextTime - prevTime, 1);
    const remaining = Math.max(nextTime - nowTick, 0);
    return 1 - remaining / total;
  }, [prayerEvents, upcoming, nowTick, today]);

  const countdownLabel = upcoming?.label ?? "...";
  const countdownTime = upcoming?.time ? formatHMS(upcoming.time) : "--:--:--";
  const buttonLabel = countdownLabel ? `Waktu ${countdownLabel}` : "Waktu Sholat";

  const formattedDate = useMemo(() => {
    try {
      return today.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric"
      });
    } catch {
      return "Today";
    }
  }, [today]);

  const nextPrayerTime = upcoming?.time?.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) ?? "--:--";

  const hijriText = useMemo(() => {
    const fallbackIntl = () => {
      try {
        const day = new Intl.DateTimeFormat("id-ID-u-ca-islamic", { day: "2-digit" }).format(today);
        const month = new Intl.DateTimeFormat("id-ID-u-ca-islamic", { month: "long" }).format(today);
        const year = new Intl.DateTimeFormat("id-ID-u-ca-islamic", { year: "numeric" }).format(today);
        return `${day} ${month}\n${year} H`;
      } catch {
        return null;
      }
    };
    if (hijriQuery.data) {
      const { day, month, year } = hijriQuery.data;
      const monthName = hijriMonthIdToName[month.number] || month.en;
      return `${pad(day)} ${monthName}\n${year} H`;
    }
    return fallbackIntl() || "--\n---- H";
  }, [hijriQuery.data, today]);

  const doaHarian: DoaItem | null = useMemo(() => {
    if (!doaListQuery.data || randomDoaId === null) return null;
    return doaListQuery.data.find((d) => d.id === randomDoaId) || null;
  }, [doaListQuery.data, randomDoaId]);

  const fallbackDoa: DoaItem = {
    id: 0,
    title: "Doa Sebelum Makan",
    arabic: "اللهم بارك لنا فيما رزقتنا وقنا عذاب النار",
    latin: "Allahumma baarik lana fima razaqtana wa qinaa 'adzaaban-naar",
    translation: "Ya Allah berkahilah rezeki yang Engkau berikan kepada kami dan lindungilah kami dari siksa neraka",
    source: "fallback"
  };

  const activeFeatures: FeatureConfig[] = useMemo(() => {
    const list = featureConfigQuery.data || getFallbackFeatures();
    return list.filter((f) => f.enabled);
  }, [featureConfigQuery.data]);

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={["#E8F4FF", "#F0F7FF"]} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 32 }}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ gap: 6 }}>
            <Text style={{ color: colors.primary, fontSize: 12, letterSpacing: 1.4, fontWeight: "700" }}>
              SELAMAT DATANG KEMBALI
            </Text>
            <Text style={{ color: colors.text, fontSize: 26, fontWeight: "800" }}>Assalamu'alaikum</Text>
          </View>
          <View
            style={[
              styles.hijriChip,
              { borderColor: colors.primary + "40", backgroundColor: colors.card, shadowColor: colors.primary }
            ]}
          >
            <Text style={{ color: colors.primary, fontWeight: "700", textAlign: "center", lineHeight: 18 }}>
              {hijriQuery.isLoading ? "Memuat..." : hijriText}
            </Text>
          </View>
        </View>

        {/* Countdown */}
        <View style={{ alignItems: "center", marginTop: 18 }}>
          <CountdownRing colors={colors} progress={progress} label={countdownLabel} time={countdownTime} buttonLabel={buttonLabel} />
          <Text style={{ color: colors.muted, marginTop: 10 }}>{formattedDate}</Text>
          <Text style={{ color: colors.muted, marginTop: 4 }}>
            {provinsi || "DI Yogyakarta"} • {kabkota || "Kabupaten Bantul"}
          </Text>
        </View>

        {/* Jadwal Sholat */}
        <View style={{ marginTop: 22, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800" }}>Jadwal Sholat</Text>
          <Pressable style={styles.viewAllButton} onPress={() => navigation.navigate("PrayerSchedule")}>
            <Text style={{ color: colors.primary, fontWeight: "700" }}>Lihat Semua Waktu Sholat</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 12 }}>
          {prayerEvents.map((ev, idx) => {
            const selected = ev.label === countdownLabel;
            const timeTxt = ev.time.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
            const key = `${ev.label}-${ev.time.getTime()}-${idx}`;
            return (
              <View
                key={key}
                style={[
                  styles.prayerCard,
                  {
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected ? colors.card : colors.background + "CC",
                    shadowColor: colors.primary,
                    shadowOpacity: selected ? 0.35 : 0.1
                  }
                ]}
              >
                <Ionicons name="time-outline" size={20} color={selected ? colors.primary : colors.muted} style={{ marginBottom: 8 }} />
                <Text style={{ color: colors.text, fontWeight: "700" }}>{ev.label}</Text>
                <Text style={{ color: colors.muted, marginTop: 4 }}>{timeTxt}</Text>
              </View>
            );
          })}
        </ScrollView>



        {/* Fitur Utama */}
        <View style={{ marginTop: 18, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800" }}>Fitur Utama</Text>
          
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 12 }}>
          {activeFeatures.map((item) => (
            <FeatureChip
              key={item.key}
              colors={colors}
              label={item.label}
              icon={item.icon as any}
              onPress={() => {
                if (item.route) {
                  if (item.route === "Imsakiyah" || item.route === "Beranda") {
                    navigation.navigate("Tabs", { screen: item.route });
                  } else {
                    navigation.navigate(item.route);
                  }
                } else {
                  navigation.navigate("Features");
                }
              }}
            />
          ))}
        </ScrollView>

        {/* Doa hari ini */}
        <View style={[styles.doaCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={{ color: colors.primary, fontWeight: "800", marginBottom: 6 }}>DOA HARI INI</Text>
          <Text style={{ color: colors.muted, marginBottom: 10 }}>
            {doaListQuery.isLoading ? "Memuat doa..." : doaHarian?.title || fallbackDoa.title}
          </Text>
          <Text style={{ color: colors.text, fontSize: 18, lineHeight: 28, marginBottom: 14 }}>
            {doaHarian?.arabic || fallbackDoa.arabic}
          </Text>
          {(doaHarian?.translation || fallbackDoa.translation) && (
            <Text style={{ color: colors.muted, marginBottom: 12 }}>
              {doaHarian?.translation || fallbackDoa.translation}
            </Text>
          )}
          <Pressable
            style={[styles.doaButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate("DoaList", { doaId: doaHarian?.id })}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "800" }}>
              Lihat Kumpulan Doa
            </Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const CountdownRing: React.FC<{
  colors: typeof lightColors;
  progress: number;
  label: string;
  time: string;
  buttonLabel: string;
}> = ({ colors, progress, label, time, buttonLabel }) => {
  const size = Math.min(Dimensions.get("window").width - 80, 260);
  const stroke = 16;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(progress, 0), 1);
  const dashOffset = circumference * (1 - clamped);

  return (
    <View style={{ alignItems: "center" }}>
      <View style={{ position: "absolute", top: size / -10 }}>
        <LinearGradient
          colors={[colors.primary + "33", "transparent"]}
          style={{ width: size * 1.5, height: size * 1.5, borderRadius: (size * 1.5) / 2 }}
        />
      </View>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.text + "10"} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.primary + "44"}
          strokeWidth={stroke + 6}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          opacity={0.4}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.primary}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </Svg>
      <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: colors.muted, fontSize: 14, marginBottom: 8 }}>Sholat Berikutnya: {label}</Text>
        <Text style={{ color: colors.text, fontSize: 36, fontWeight: "900", letterSpacing: 1 }}>{time}</Text>
        <Pressable style={[styles.ringButton, { backgroundColor: colors.primary }]}>
          <Text style={{ color: "#FFFFFF", fontWeight: "800" }}>{buttonLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
};

const StatCard: React.FC<{
  colors: typeof lightColors;
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  progress?: number;
  caption?: string;
  wide?: boolean;
}> = ({ colors, title, value, icon, progress, caption, wide }) => (
  <View
    style={[
      styles.statCard,
      {
        flex: wide ? 1 : 1,
        backgroundColor: colors.card,
        borderColor: colors.border,
        shadowColor: colors.primary
      }
    ]}
  >
    <View style={styles.statIcon}>
      <Ionicons name={icon} size={20} color={colors.primary} />
    </View>
    <Text style={{ color: colors.muted, fontWeight: "700" }}>{title}</Text>
    {caption ? <Text style={{ color: colors.primary, fontSize: 12 }}>{caption}</Text> : null}
    <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800", marginTop: 6 }}>{value}</Text>
    {typeof progress === "number" && (
      <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
        <View style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: colors.accent }]} />
      </View>
    )}
  </View>
);

const FeatureChip: React.FC<{
  colors: typeof lightColors;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
}> = ({ colors, label, icon, onPress }) => (
  <Pressable
    onPress={onPress}
    style={[styles.featureChip, { backgroundColor: colors.card, borderColor: colors.border }]}
  >
    <Ionicons name={icon} size={20} color={colors.primary} />
    <Text style={{ color: colors.text, fontWeight: "700", marginTop: 6 }}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  hijriChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 6,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }
  },
  ringButton: {
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    elevation: 6,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  prayerCard: {
    width: 120,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 6,
    elevation: 4,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff0d"
  },
  progressBar: {
    height: 6,
    borderRadius: 6,
    marginTop: 8
  },
  progressFill: {
    height: 6,
    borderRadius: 6
  },
  featureChip: {
    width: 90,
    height: 90,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  doaCard: {
    marginTop: 8,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    elevation: 4,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }
  },
  doaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12
  }
});

export default DashboardScreen;
