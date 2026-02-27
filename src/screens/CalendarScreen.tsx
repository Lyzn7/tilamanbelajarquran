import React, { useMemo, useState, useEffect } from "react";
import { SafeAreaView, StyleSheet, Text, View, Pressable, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useSettings } from "@/store/SettingsProvider";
import { lightColors, darkColors } from "@/theme";
import { getHijriCalendar } from "@/api/hijri";
import { queryKeys } from "@/api/queryKeys";

const safeDate = (year: number, month: number, day: number) => new Date(Date.UTC(year, month, day, 12, 0, 0));
const daysInMonth = (year: number, month: number) => new Date(Date.UTC(year, month + 1, 0, 12, 0, 0)).getUTCDate();
const startOfMonth = (year: number, month: number) => new Date(Date.UTC(year, month, 1, 12, 0, 0)).getUTCDay(); // 0 Sunday
const iso = (d: Date) => d.toISOString().slice(0, 10);
const parseGregorian = (dateStr: string) => {
  const [dd, mm, yyyy] = dateStr.split("-").map(Number);
  return safeDate(yyyy, mm - 1, dd);
};
const ramadanStartDefault = safeDate(2026, 1, 18); // fallback

const CalendarScreen: React.FC = () => {
  const { isDark, settings } = useSettings();
  const colors = isDark ? darkColors : lightColors;
  const today = useMemo(() => new Date(), []);
  const [current, setCurrent] = useState(() => ({ year: today.getFullYear(), month: today.getMonth() }));
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  useEffect(() => {
    if (settings.startRamadanDate && isNaN(new Date(settings.startRamadanDate).getTime())) {
      setSnackbarMessage("Tanggal Ramadhan tidak valid. Gunakan format YYYY-MM-DD.");
    } else {
      setSnackbarMessage(null);
    }
  }, [settings.startRamadanDate]);

  const { data: hijriCalendar, error: hijriError } = useQuery({
    queryKey: queryKeys.hijriCalendar(year, month + 1),
    queryFn: () => getHijriCalendar(year, month + 1, -1, "Asia/Jakarta"),
    staleTime: 1000 * 60 * 10
  });

  useEffect(() => {
    if (hijriError) {
      setSnackbarMessage("Gagal memuat kalender Hijriah. Pastikan koneksi internet, lalu coba lagi.");
    }
  }, [hijriError]);

  const ramadanStart = useMemo(() => {
    const fromApi = hijriCalendar?.find(
      (day) => Number(day.hijri.month.number) === 9 && Number(day.hijri.day) === 1
    );
    if (fromApi) {
      const g = parseGregorian(fromApi.gregorian.date);
      if (!isNaN(g.getTime())) return g;
    }
    const fallback = settings.startRamadanDate ? new Date(settings.startRamadanDate) : ramadanStartDefault;
    return isNaN(fallback.getTime()) ? ramadanStartDefault : fallback;
  }, [hijriCalendar, settings.startRamadanDate]);

  const daysUntilRamadan = useMemo(() => {
    const diff = Math.ceil((ramadanStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff < 0 ? 0 : diff;
  }, [ramadanStart, today]);

  const year = current.year;
  const month = current.month;
  const totalDays = daysInMonth(year, month);
  const startDay = startOfMonth(year, month); // 0 Sunday

  const grid: Array<{ day: number | null; date: Date | null }> = useMemo(() => {
    const arr: Array<{ day: number | null; date: Date | null }> = [];
    const shiftOffset = startDay === 0 ? 6 : startDay - 1; // Monday-first grid

    for (let i = 0; i < shiftOffset; i++) arr.push({ day: null, date: null });
    for (let i = 1; i <= totalDays; i++) {
      arr.push({ day: i, date: safeDate(year, month, i) });
    }
    while (arr.length % 7 !== 0) arr.push({ day: null, date: null });
    return arr;
  }, [startDay, totalDays, year, month]);

  const isSameDate = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const monthLabel = new Date(year, month, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  const ramadanMap = useMemo(() => {
    const m = new Map<string, number>();
    hijriCalendar?.forEach((day) => {
      if (Number(day.hijri.month.number) === 9) {
        const g = parseGregorian(day.gregorian.date);
        m.set(iso(g), Number(day.hijri.day));
      }
    });
    return m;
  }, [hijriCalendar]);

  const onPrev = () => {
    setCurrent((prev) => {
      const m = prev.month - 1;
      if (m < 0) return { year: prev.year - 1, month: 11 };
      return { year: prev.year, month: m };
    });
  };
  const onNext = () => {
    setCurrent((prev) => {
      const m = prev.month + 1;
      if (m > 11) return { year: prev.year + 1, month: 0 };
      return { year: prev.year, month: m };
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={["#06110d", "#0c1a14"]} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="flame-outline" size={26} color={colors.primary} />
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: "800" }}>Ramadan 1447</Text>
          </View>
          <Pressable
            onPress={() => {
              const t = new Date();
              setCurrent({ year: t.getFullYear(), month: t.getMonth() });
            }}
          >
            <Text style={{ color: colors.primary, fontWeight: "800" }}>Loncat ke Hari Ini</Text>
          </Pressable>
        </View>

        {/* Banner */}
        <LinearGradient
          colors={[colors.primary, "#f5c53d"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          <View style={styles.bannerCopy}>
            <Text style={styles.bannerOverline}>Ramadhan Segera Tiba</Text>
            <Text style={styles.bannerTitle}>Hitung Mundur</Text>
            <Text style={styles.bannerSubtitle}>Hari menuju Ramadhan</Text>
          </View>
          <View style={styles.bannerBadge}>
            <Text style={[styles.badgeLabel, { color: colors.primary }]}>Hari</Text>
            <Text style={styles.badgeValue}>{daysUntilRamadan}</Text>
          </View>
        </LinearGradient>

        {/* Month bar */}
        <View style={styles.monthBar}>
          <Pressable
            onPress={onPrev}
            hitSlop={8}
            style={({ pressed }) => [styles.navButton, { borderColor: colors.border }, pressed && styles.navPressed]}
          >
            <Ionicons name="chevron-back" size={18} color={colors.text} />
          </Pressable>
          <Text style={[styles.monthLabel, { color: colors.text }]}>{monthLabel}</Text>
          <Pressable
            onPress={onNext}
            hitSlop={8}
            style={({ pressed }) => [styles.navButton, { borderColor: colors.border }, pressed && styles.navPressed]}
          >
            <Ionicons name="chevron-forward" size={18} color={colors.text} />
          </Pressable>
        </View>

        {/* Weekdays */}
        <View style={styles.weekRow}>
          {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((d) => (
            <Text key={d} style={[styles.weekLabel, { color: colors.muted }]}>
              {d}
            </Text>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.grid}>
          {grid.map((cell, idx) => {
            const isToday = cell.date ? isSameDate(cell.date, today) : false;
            const ramadanDay = cell.date ? ramadanMap.get(iso(cell.date)) : undefined;
            const isRamadanStart = ramadanDay === 1;
            const isRamadanRange = typeof ramadanDay === "number";
            const isSelected = selectedDate && cell.date ? isSameDate(cell.date, selectedDate) : false;
            return (
              <Pressable
                key={idx}
                disabled={!cell.date}
                onPress={() => (cell.date ? setSelectedDate(cell.date) : null)}
                hitSlop={6}
                style={({ pressed }) => [
                  styles.dayCell,
                  {
                    borderColor: isSelected ? colors.primary : isRamadanStart ? colors.primary : isToday ? colors.border : "transparent",
                    backgroundColor: isSelected
                      ? colors.primary + "26"
                      : isToday
                      ? colors.card
                      : isRamadanRange
                      ? colors.primary + "12"
                      : "transparent",
                    opacity: cell.day ? 1 : 0,
                    zIndex: isSelected ? 2 : 1
                  },
                  pressed && styles.dayCellPressed
                ]}
              >
                <Text style={[styles.dayNumber, { color: colors.text }]}>{cell.day}</Text>
                {isRamadanRange ? (
                  <View style={[styles.ramadanPill, { backgroundColor: colors.primary + "22", borderColor: colors.primary }]}>
                    <Text style={{ color: colors.primary, fontSize: 9, fontWeight: "900" }}>R-{ramadanDay}</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {/* Legend */}
        <View style={[styles.eventCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={styles.legendTitle}>Legenda</Text>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: colors.card, borderColor: colors.primary, borderWidth: 1 }]} />
            <Text style={[styles.legendText, { color: colors.text }]}>Ramadan Day (R-1 s.d R-30)</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary + "22" }]} />
            <Text style={[styles.legendText, { color: colors.text }]}>Tanggal dalam rentang Ramadan</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: colors.card, borderColor: colors.text, borderWidth: 1 }]} />
            <Text style={[styles.legendText, { color: colors.text }]}>Hari ini</Text>
          </View>
        </View>
      </ScrollView>
      {snackbarMessage ? (
        <View style={[styles.snackbar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={{ color: colors.text, fontWeight: "700" }}>{snackbarMessage}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18
  },
  banner: {
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
    minHeight: 132
  },
  bannerCopy: { flex: 1, paddingRight: 18, gap: 6 },
  bannerOverline: { color: "#2d1b00", fontWeight: "800", fontSize: 15, letterSpacing: 0.3, textTransform: "uppercase" },
  bannerTitle: { color: "#2d1b00", fontSize: 20, fontWeight: "900" },
  bannerSubtitle: { color: "#2d1b00", fontSize: 15, opacity: 0.85, fontWeight: "700" },
  bannerBadge: {
    width: 98,
    height: 98,
    borderRadius: 20,
    backgroundColor: "#ffffff22",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ffffff33",
    paddingVertical: 8
  },
  badgeLabel: { fontSize: 13, fontWeight: "800", letterSpacing: 0.2 },
  badgeValue: { color: "#2d1b00", fontSize: 36, fontWeight: "900", marginTop: 4 },
  monthBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
    marginBottom: 14,
    paddingHorizontal: 4
  },
  navButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  navPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  monthLabel: { fontSize: 20, fontWeight: "900", letterSpacing: 0.2 },
  weekRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 6, marginBottom: 4 },
  weekLabel: { flex: 1, textAlign: "center", fontWeight: "800", fontSize: 12, letterSpacing: 0.1 },
  grid: {
    marginTop: 4,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 12,
    borderColor: "#1e2740",
    backgroundColor: "#0c1428",
    flexDirection: "row",
    flexWrap: "wrap"
  },
  dayCell: {
    width: "14.2857%",
    minHeight: 65,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "flex-start",
    marginVertical: 4,
    borderWidth: 1,
    paddingTop: 8,
    paddingBottom: 6,
    paddingHorizontal: 2
  },
  dayCellPressed: { transform: [{ scale: 0.98 }] },
  dayNumber: { fontWeight: "800", fontSize: 15, letterSpacing: 0.1, marginBottom: 4 },
  ramadanPill: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
    alignItems: "center",
    justifyContent: "center"
  },
  eventCard: {
    marginTop: 22,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 7
  },
  legendTitle: { fontSize: 18, fontWeight: "900", marginBottom: 12 },
  legendRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  legendText: { marginLeft: 10, fontWeight: "700" },
  snackbar: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 70,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }
  }
});

export default CalendarScreen;
