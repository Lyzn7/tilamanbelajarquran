import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Dimensions
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { getImsakKabKota, getImsakProvinsi, getImsakiyah, getShalatSchedule } from "@/api/equran";
import { queryKeys } from "@/api/queryKeys";
import SelectField from "@/components/SelectField";
import { useSettings } from "@/store/SettingsProvider";
import { useScheduleLocation } from "@/hooks/useScheduleLocation";
import { lightColors, darkColors } from "@/theme";
import { ImsakDay, ShalatDay } from "@/types/api";
import { buildEventsFromImsak, buildEventsFromShalat, formatHMS, nextEvent } from "@/utils/schedule";
import { scheduleAlarmNotifications } from "@/notifications";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";

const startRamadan = new Date("2026-02-18T00:00:00");
const dayDiff = (from: Date, to: Date) => Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));

const normalizeProvinceName = (name: string) =>
  name === "DI Yogyakarta" ? "D.I. Yogyakarta" : name;

const normalizeKabName = (name: string) =>
  name === "Kabupaten Bantul" ? "Kab. Bantul" : name;

const ImsakiyahScreen: React.FC = () => {
  const { isDark, settings } = useSettings();
  const colors = isDark ? darkColors : lightColors;
  const today = new Date();
  const [nowTick, setNowTick] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const parsedStart = settings.startRamadanDate ? new Date(settings.startRamadanDate) : startRamadan;
  const userStart = isNaN(parsedStart.getTime()) ? startRamadan : parsedStart;
  const ramadanDay = useMemo(() => {
    const diff = dayDiff(userStart, today) + 1;
    return diff >= 1 && diff <= 30 ? diff : null;
  }, [today, userStart]);
  const tomorrow = useMemo(() => new Date(today.getTime() + 24 * 3600 * 1000), [today]);

  const { location, setLocation, hydrated } = useScheduleLocation();
  const { provinsi, kabkota } = location;
  const normalizedProv = normalizeProvinceName(provinsi || "");
  const normalizedKab = normalizeKabName(kabkota || "");
  const [countdownLabel, setCountdownLabel] = useState<string | null>(null);
  const [countdownTarget, setCountdownTarget] = useState<Date | null>(null);

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
    queryKey: provinsi && kabkota ? queryKeys.shalatSchedule(normalizedProv, normalizedKab, today.getMonth() + 1, today.getFullYear()) : ["shalat", "none"],
    queryFn: () => getShalatSchedule(normalizedProv || "", normalizedKab || "", today.getMonth() + 1, today.getFullYear()),
    enabled: Boolean(normalizedProv && normalizedKab && hydrated),
    staleTime: 1000 * 60 * 30
  });

  const shalatNextMonthQuery = useQuery({
    queryKey: provinsi && kabkota
      ? queryKeys.shalatSchedule(
          normalizedProv,
          normalizedKab,
          tomorrow.getMonth() + 1,
          tomorrow.getFullYear()
        )
      : ["shalat", "none", "next"],
    queryFn: () =>
      getShalatSchedule(normalizedProv || "", normalizedKab || "", tomorrow.getMonth() + 1, tomorrow.getFullYear()),
    enabled: Boolean(normalizedProv && normalizedKab && hydrated && (tomorrow.getMonth() !== today.getMonth())),
    staleTime: 1000 * 60 * 30
  });

  const findShalatByDate = (iso: string): ShalatDay | undefined => {
    const all = shalatQuery.data?.jadwal || [];
    const match = all.find((d) => d.tanggal_lengkap === iso);
    if (match) return match;
    const next = shalatNextMonthQuery.data?.jadwal || [];
    return next.find((d) => d.tanggal_lengkap === iso);
  };

  const todayIso = useMemo(() => {
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${today.getFullYear()}-${m}-${d}`;
  }, [today]);

  const tomorrowIso = useMemo(() => {
    const m = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const d = String(tomorrow.getDate()).padStart(2, "0");
    return `${tomorrow.getFullYear()}-${m}-${d}`;
  }, [tomorrow]);

  const activeScheduleToday = useMemo(() => {
    if (ramadanDay && imsakQuery.data?.imsakiyah) {
      return imsakQuery.data.imsakiyah.find((d) => d.tanggal === ramadanDay) || null;
    }
    return findShalatByDate(todayIso) || null;
  }, [ramadanDay, imsakQuery.data, todayIso, shalatQuery.data, shalatNextMonthQuery.data]);

  const activeScheduleTomorrow = useMemo(() => {
    if (ramadanDay && ramadanDay + 1 <= 30 && imsakQuery.data?.imsakiyah) {
      return imsakQuery.data.imsakiyah.find((d) => d.tanggal === ramadanDay + 1) || null;
    }
    return findShalatByDate(tomorrowIso) || null;
  }, [ramadanDay, imsakQuery.data, tomorrowIso, shalatQuery.data, shalatNextMonthQuery.data]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    const computeCountdown = () => {
      if (!activeScheduleToday && !activeScheduleTomorrow) {
        setCountdownLabel(null);
        setCountdownTarget(null);
        return;
      }
      const eventsToday =
        activeScheduleToday && "tanggal" in activeScheduleToday
          ? buildEventsFromImsak(new Date(userStart.getTime() + ((activeScheduleToday as ImsakDay).tanggal - 1) * 24 * 3600 * 1000), activeScheduleToday as ImsakDay)
          : activeScheduleToday
            ? buildEventsFromShalat(activeScheduleToday as ShalatDay)
            : [];
      const nextToday = nextEvent(eventsToday);
      if (nextToday) {
        setCountdownLabel(nextToday.label);
        setCountdownTarget(nextToday.time);
        return;
      }

      const eventsTomorrow =
        activeScheduleTomorrow && "tanggal" in activeScheduleTomorrow
          ? buildEventsFromImsak(new Date(userStart.getTime() + ((activeScheduleTomorrow as ImsakDay).tanggal - 1) * 24 * 3600 * 1000), activeScheduleTomorrow as ImsakDay)
          : activeScheduleTomorrow
            ? buildEventsFromShalat(activeScheduleTomorrow as ShalatDay)
            : [];
      const nextTomorrow = nextEvent(eventsTomorrow);
      if (nextTomorrow) {
        setCountdownLabel(nextTomorrow.label);
        setCountdownTarget(nextTomorrow.time);
        return;
      }
      setCountdownLabel(null);
      setCountdownTarget(null);
    };

    computeCountdown();
    timer = setInterval(computeCountdown, 1000);
    return () => clearInterval(timer);
  }, [activeScheduleToday, activeScheduleTomorrow, userStart]);

  useEffect(() => {
    const buildEvents = (sch: ImsakDay | ShalatDay | null) => {
      if (!sch) return [];
      if ("tanggal" in sch) {
        const date = new Date(userStart.getTime() + (sch.tanggal - 1) * 24 * 3600 * 1000);
        return buildEventsFromImsak(date, sch as ImsakDay);
      }
      return buildEventsFromShalat(sch as ShalatDay);
    };

    const todayEvents = buildEvents(activeScheduleToday);
    const tomorrowEvents = buildEvents(activeScheduleTomorrow);

    const imsakToday = todayEvents.find((e) => e.label === "Imsak");
    const maghribToday = todayEvents.find((e) => e.label === "Maghrib");
    const imsakNext = tomorrowEvents.find((e) => e.label === "Imsak");

    const pickImsak =
      imsakToday && imsakToday.time.getTime() > Date.now()
        ? imsakToday.time
        : imsakNext && imsakNext.time.getTime() > Date.now()
          ? imsakNext.time
          : null;

    const pickMaghrib =
      maghribToday && maghribToday.time.getTime() > Date.now()
        ? maghribToday.time
        : null;

    const wantsAlarm = settings.imsakAlarmEnabled || settings.maghribAlarmEnabled;
    if (!wantsAlarm) return;

    scheduleAlarmNotifications({
      imsakDate: pickImsak || undefined,
      maghribDate: pickMaghrib || undefined,
      imsakEnabled: settings.imsakAlarmEnabled,
      maghribEnabled: settings.maghribAlarmEnabled,
      imsakOffsetMinutes: settings.imsakOffsetMinutes,
      maghribOffsetMinutes: settings.maghribOffsetMinutes
    });
  }, [
    activeScheduleToday,
    activeScheduleTomorrow,
    settings.imsakAlarmEnabled,
    settings.maghribAlarmEnabled,
    settings.imsakOffsetMinutes,
    settings.maghribOffsetMinutes,
    userStart
  ]);

  const eventsToday = useMemo(() => {
    if (!activeScheduleToday) return [];
    if ("tanggal" in activeScheduleToday) {
      const date = new Date(userStart.getTime() + (activeScheduleToday.tanggal - 1) * 24 * 3600 * 1000);
      return buildEventsFromImsak(date, activeScheduleToday as ImsakDay);
    }
    return buildEventsFromShalat(activeScheduleToday as ShalatDay);
  }, [activeScheduleToday, userStart]);

  const upcoming = useMemo(() => nextEvent(eventsToday), [eventsToday, nowTick]);

  const progress = useMemo(() => {
    if (!upcoming) return 0;
    const nextTime = upcoming.time.getTime();
    const prev = [...eventsToday].reverse().find((e) => e.time.getTime() < nextTime && e.time.getTime() <= nowTick);
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const prevTime = prev?.time.getTime() ?? startOfDay.getTime();
    const total = Math.max(nextTime - prevTime, 1);
    const remaining = Math.max(nextTime - nowTick, 0);
    return 1 - remaining / total;
  }, [eventsToday, upcoming, nowTick, today]);

  const buttonLabel = countdownLabel ? `Time to ${countdownLabel}` : "Time to Iftar";

  const formattedDate = useMemo(() => {
    try {
      return today.toLocaleDateString("en-US", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric"
      });
    } catch {
      return "Today";
    }
  }, [today]);

  const [locationOpen, setLocationOpen] = useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={["#06110d", "#0c1a14"]} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
        <Header colors={colors} />

        <LocationPickerCollapsed
          colors={colors}
          provinsi={provinsi || "DI Yogyakarta"}
          kabkota={kabkota || "Kabupaten Bantul"}
          open={locationOpen}
          onToggle={() => setLocationOpen((p) => !p)}
        >
          <View style={{ gap: 10 }}>
            <SelectField
              label="Provinsi"
              value={provinsi}
              options={provQuery.data || []}
              onSelect={(val) => setLocation({ provinsi: val, kabkota: null })}
              colors={colors}
              loading={provQuery.isLoading}
            />
            <SelectField
              label="Kabupaten/Kota"
              value={kabkota}
              options={kabQuery.data || []}
              onSelect={(val) => setLocation({ kabkota: val })}
              colors={colors}
              disabled={!provinsi}
              loading={kabQuery.isLoading}
              placeholder={provinsi ? "Pilih kab/kota" : "Pilih provinsi dahulu"}
            />
          </View>
        </LocationPickerCollapsed>

        <View style={{ marginTop: 16, alignItems: "center" }}>
          <CountdownRing
            colors={colors}
            label={countdownLabel || "..."}
            time={countdownTarget ? formatHMS(countdownTarget) : "--:--:--"}
            buttonLabel={buttonLabel}
            progress={progress}
          />
          <Text style={[styles.dateText, { color: colors.muted, marginTop: 12 }]}>{formattedDate}</Text>
        </View>

        <View style={{ marginTop: 28, gap: 12 }}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Prayer Timeline</Text>
            <Text style={{ color: colors.primary, fontWeight: "700" }}>View Calendar</Text>
          </View>
          <PrayerTimeline
            colors={colors}
            events={eventsToday}
            highlightLabel={countdownLabel}
          />
        </View>

        {(imsakQuery.isLoading || shalatQuery.isLoading) && (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />
        )}
        {(imsakQuery.error || shalatQuery.error) && (
          <Text style={{ color: "red", marginTop: 12 }}>
            Gagal memuat: {(imsakQuery.error as Error)?.message || (shalatQuery.error as Error)?.message}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 18, fontWeight: "800" },
  dateText: { fontSize: 14 },
  headerChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1
  },
  collapsedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1
  },
  timelineCard: {
    width: 130,
    borderRadius: 20,
    padding: 16,
    gap: 10
  }
});

const Header: React.FC<{ colors: typeof lightColors }> = ({ colors }) => (
  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
    <View style={{ gap: 6 }}>
      <Text style={{ color: colors.primary, fontSize: 12, letterSpacing: 1.2, fontWeight: "700" }}>
        WELCOME BACK
      </Text>
      <Text style={{ color: colors.text, fontSize: 26, fontWeight: "800" }}>Assalamu'alaikum</Text>
    </View>
    <View
      style={[
        styles.headerChip,
        { borderColor: colors.primary + "40", backgroundColor: colors.card, opacity: 0.96 }
      ]}
    >
      <Text style={{ color: colors.primary, fontSize: 12, textAlign: "center", lineHeight: 16 }}>
        6 SHA'BAN{"\n"}1447 H
      </Text>
    </View>
  </View>
);

const LocationPickerCollapsed: React.FC<{
  colors: typeof lightColors;
  provinsi: string;
  kabkota: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ colors, provinsi, kabkota, open, onToggle, children }) => (
  <View style={{ marginTop: 16 }}>
    <Pressable
      onPress={onToggle}
      style={[
        styles.collapsedRow,
        { borderColor: colors.border, backgroundColor: colors.card }
      ]}
    >
      <View>
        <Text style={{ color: colors.muted, fontSize: 12 }}>Lokasi</Text>
        <Text style={{ color: colors.text, fontWeight: "700" }}>
          {provinsi} • {kabkota}
        </Text>
      </View>
      <Ionicons
        name={open ? "chevron-up" : "chevron-down"}
        size={18}
        color={colors.primary}
      />
    </Pressable>
    {open && <View style={{ marginTop: 12, gap: 10 }}>{children}</View>}
  </View>
);

const CountdownRing: React.FC<{
  colors: typeof lightColors;
  label: string;
  time: string;
  buttonLabel: string;
  progress: number;
}> = ({ colors, label, time, buttonLabel, progress }) => {
  const size = Math.min(Dimensions.get("window").width - 80, 240);
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(progress, 0), 1);
  const dashOffset = circumference * (1 - clamped);

  return (
    <View style={{ alignItems: "center" }}>
      <View style={{ position: "absolute", top: size / -12 }}>
        <LinearGradient
          colors={[colors.primary + "33", "transparent"]}
          style={{ width: size * 1.4, height: size * 1.4, borderRadius: (size * 1.4) / 2 }}
        />
      </View>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.text + "10"}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.primary + "55"}
          strokeWidth={stroke + 6}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          opacity={0.35}
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
      <View
        style={{
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <Text style={{ color: colors.muted, fontSize: 14, marginBottom: 6 }}>Next Prayer: {label}</Text>
        <Text style={{ color: colors.text, fontSize: 36, fontWeight: "900", letterSpacing: 1 }}>{time}</Text>
        <Pressable
          style={{
            marginTop: 12,
            backgroundColor: colors.primary,
            paddingHorizontal: 18,
            paddingVertical: 10,
            borderRadius: 999,
            elevation: 6,
            shadowColor: colors.primary,
            shadowOpacity: 0.4,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 }
          }}
        >
          <Text style={{ color: "#0B0F1E", fontWeight: "800" }}>{buttonLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
};

const PrayerTimeline: React.FC<{
  colors: typeof lightColors;
  events: { label: string; time: Date }[];
  highlightLabel: string | null;
}> = ({ colors, events, highlightLabel }) => {
  const cards = events.map((e) => ({
    ...e,
    timeText: e.time.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
  }));

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
      {cards.map((card) => {
        const selected = card.label === highlightLabel;
        return (
          <View
            key={card.label}
            style={[
              styles.timelineCard,
              {
                backgroundColor: selected ? colors.card : colors.background + "AA",
                borderWidth: 1,
                borderColor: selected ? colors.primary : colors.border,
                shadowColor: colors.primary,
                shadowOpacity: selected ? 0.35 : 0.15,
                shadowRadius: selected ? 10 : 6,
                shadowOffset: { width: 0, height: 4 },
                elevation: selected ? 8 : 2
              }
            ]}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.badge,
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Ionicons
                name="time-outline"
                size={18}
                color={selected ? colors.primary : colors.muted}
              />
            </View>
            <Text style={{ color: colors.text, fontWeight: "700", fontSize: 15 }}>{card.label}</Text>
            <Text style={{ color: colors.muted, fontWeight: "600", fontSize: 14 }}>{card.timeText}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
};

export default ImsakiyahScreen;
