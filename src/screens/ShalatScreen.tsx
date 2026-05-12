import { getShalatKabKota, getShalatProvinsi, getShalatSchedule } from "@/api/equran";
import { queryKeys } from "@/api/queryKeys";
import SelectField from "@/components/SelectField";
import { useScheduleLocation } from "@/hooks/useScheduleLocation";
import { useSettings } from "@/store/SettingsProvider";
import { darkColors, lightColors } from "@/theme";
import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const todayLocalISO = () => {
  const now = new Date();
  return toLocalISO(now.getFullYear(), now.getMonth() + 1, now.getDate());
};

const toLocalISO = (year: number, month: number, day: number) =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const daysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();

const firstDayOffset = (year: number, month: number) => {
  const day = new Date(year, month - 1, 1).getDay();
  return day === 0 ? 6 : day - 1;
};

const normalizeProvinceName = (name: string) =>
  name === "DI Yogyakarta" ? "D.I. Yogyakarta" : name;

const normalizeKabName = (name: string) =>
  name === "Kabupaten Bantul" ? "Kab. Bantul" : name;

const ShalatScreen: React.FC = () => {
  const { isDark } = useSettings();
  const colors = isDark ? darkColors : lightColors;
  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());
  const [selectedDate, setSelectedDate] = useState(todayLocalISO());

  const { location, setLocation, hydrated } = useScheduleLocation();
  const { provinsi, kabkota } = location;
  const [draftProvinsi, setDraftProvinsi] = useState<string | null>(provinsi);
  const [draftKabkota, setDraftKabkota] = useState<string | null>(kabkota);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const normalizedProv = normalizeProvinceName(draftProvinsi || "");
  const normalizedKab = normalizeKabName(draftKabkota || "");
  const todayIso = todayLocalISO();

  useEffect(() => {
    if (!hydrated) return;
    setDraftProvinsi(provinsi);
    setDraftKabkota(kabkota);
  }, [hydrated, provinsi, kabkota]);

  const adjustMonth = (delta: number) => {
    setBulan((prev) => {
      let nextMonth = prev + delta;
      let nextYear = tahun;
      if (nextMonth === 0) {
        nextMonth = 12;
        nextYear -= 1;
      } else if (nextMonth === 13) {
        nextMonth = 1;
        nextYear += 1;
      }
      setTahun(nextYear);
      return nextMonth;
    });
  };

  const hasUnsavedLocation = draftProvinsi !== provinsi || draftKabkota !== kabkota;

  const saveDraftLocation = () => {
    if (!draftProvinsi || !draftKabkota) {
      setLocationStatus("Pilih provinsi dan kabupaten/kota terlebih dahulu.");
      return;
    }
    setLocation({ provinsi: draftProvinsi, kabkota: draftKabkota });
    setLocationStatus("Lokasi jadwal disimpan dan dipakai di Beranda.");
  };

  const provQuery = useQuery({
    queryKey: queryKeys.shalatProvinsi,
    queryFn: getShalatProvinsi,
    staleTime: 1000 * 60 * 60 * 24,
  });

  useEffect(() => {
    if (provQuery.data && !draftProvinsi) {
      const fallback = provQuery.data.find((p) => p.includes("Yogyakarta")) || provQuery.data[0];
      if (fallback) setDraftProvinsi(fallback);
    }
  }, [provQuery.data, draftProvinsi]);

  const kabQuery = useQuery({
    queryKey: draftProvinsi ? queryKeys.shalatKabKota(normalizedProv) : queryKeys.shalatKabKota(""),
    queryFn: () => getShalatKabKota(normalizedProv || ""),
    enabled: Boolean(normalizedProv),
    staleTime: 1000 * 60 * 60 * 12,
  });

  useEffect(() => {
    if (kabQuery.data && draftProvinsi && !draftKabkota) {
      const fallback = kabQuery.data.find((k) => k.includes("Bantul")) || kabQuery.data[0];
      if (fallback) setDraftKabkota(fallback);
    }
  }, [kabQuery.data, draftProvinsi, draftKabkota]);

  const shalatQuery = useQuery({
    queryKey:
      draftProvinsi && draftKabkota
        ? queryKeys.shalatSchedule(normalizedProv, normalizedKab, bulan, tahun)
        : ["shalat", "none"],
    queryFn: () => getShalatSchedule(normalizedProv || "", normalizedKab || "", bulan, tahun),
    enabled: Boolean(normalizedProv && normalizedKab && hydrated),
    staleTime: 1000 * 60 * 15,
  });

  useEffect(() => {
    const today = new Date();
    const isCurrentMonth = bulan === today.getMonth() + 1 && tahun === today.getFullYear();
    setSelectedDate(isCurrentMonth ? todayIso : toLocalISO(tahun, bulan, 1));
  }, [bulan, tahun, todayIso]);

  const calendarCells = useMemo(() => {
    const blanks = Array.from({ length: firstDayOffset(tahun, bulan) }, () => null);
    const days = Array.from({ length: daysInMonth(tahun, bulan) }, (_, idx) => idx + 1);
    return [...blanks, ...days];
  }, [bulan, tahun]);

  const selectedSchedule = useMemo(
    () => shalatQuery.data?.jadwal.find((item) => item.tanggal_lengkap === selectedDate) || null,
    [selectedDate, shalatQuery.data],
  );

  const prayerRows = selectedSchedule
    ? [
        ["Subuh", selectedSchedule.subuh],
        ["Dzuhur", selectedSchedule.dzuhur],
        ["Ashar", selectedSchedule.ashar],
        ["Maghrib", selectedSchedule.maghrib],
        ["Isya", selectedSchedule.isya],
      ]
    : [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={shalatQuery.isRefetching}
            onRefresh={() => shalatQuery.refetch()}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={[styles.title, { color: colors.text }]}>Jadwal Shalat Bulanan</Text>
        <Text style={{ color: colors.muted }}>
          Pilih lokasi, bulan, lalu tap tanggal di kalender untuk melihat jadwal 5 waktu.
        </Text>

        <View style={styles.selectorGroup}>
          <SelectField
            label="Provinsi"
            value={draftProvinsi}
            options={provQuery.data || []}
            onSelect={(val) => {
              setDraftProvinsi(val);
              setDraftKabkota(null);
              setLocationStatus(null);
            }}
            colors={colors}
            loading={provQuery.isLoading}
          />
          <SelectField
            label="Kabupaten/Kota"
            value={draftKabkota}
            options={kabQuery.data || []}
            onSelect={(val) => {
              setDraftKabkota(val);
              setLocationStatus(null);
            }}
            colors={colors}
            disabled={!draftProvinsi}
            loading={kabQuery.isLoading}
            placeholder={draftProvinsi ? "Pilih kab/kota" : "Pilih provinsi dahulu"}
          />
          <Pressable
            style={[
              styles.actionBtn,
              {
                borderColor: colors.primary,
                backgroundColor: draftProvinsi && draftKabkota ? colors.primary : colors.badge,
              },
            ]}
            onPress={saveDraftLocation}
          >
            <Text
              style={{
                color: draftProvinsi && draftKabkota ? "#0b1224" : colors.muted,
                fontWeight: "800",
              }}
            >
              Simpan lokasi
            </Text>
          </Pressable>
          {hasUnsavedLocation ? (
            <Text style={{ color: colors.muted, fontSize: 12 }}>
              Lokasi belum disimpan. Tekan Simpan lokasi agar Beranda ikut berubah.
            </Text>
          ) : null}
          {locationStatus ? (
            <Text style={{ color: colors.muted, fontSize: 12 }}>{locationStatus}</Text>
          ) : null}
        </View>

        <View style={[styles.monthRow, { borderColor: colors.border }]}>
          <Pressable style={[styles.monthBtn, { borderColor: colors.border }]} onPress={() => adjustMonth(-1)}>
            <Text style={{ color: colors.text, fontWeight: "800" }}>{"<"}</Text>
          </Pressable>
          <Text style={{ color: colors.text, fontWeight: "800", fontSize: 16 }}>
            {shalatQuery.data?.bulan_nama || `Bulan ${bulan}`} {tahun}
          </Text>
          <Pressable style={[styles.monthBtn, { borderColor: colors.border }]} onPress={() => adjustMonth(1)}>
            <Text style={{ color: colors.text, fontWeight: "800" }}>{">"}</Text>
          </Pressable>
        </View>

        {shalatQuery.isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 6 }} testID="shalat-loading" />
        ) : null}
        {shalatQuery.error ? (
          <Text style={{ color: "red" }}>Gagal memuat: {(shalatQuery.error as Error).message}</Text>
        ) : null}

        <View style={[styles.calendarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.weekRow}>
            {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((day) => (
              <Text key={day} style={[styles.weekText, { color: colors.muted }]}>
                {day}
              </Text>
            ))}
          </View>
          <View style={styles.calendarGrid}>
            {calendarCells.map((day, idx) => {
              const iso = day ? toLocalISO(tahun, bulan, day) : null;
              const selected = iso === selectedDate;
              const isToday = iso === todayIso;
              return (
                <Pressable
                  key={`${idx}-${day ?? "blank"}`}
                  disabled={!day}
                  onPress={() => iso && setSelectedDate(iso)}
                  style={[
                    styles.dayCell,
                    {
                      backgroundColor: selected ? colors.primary : isToday ? colors.badge : "transparent",
                      borderColor: selected ? colors.primary : isToday ? colors.primary : "transparent",
                      opacity: day ? 1 : 0,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: selected ? "#0b1224" : colors.text,
                      fontWeight: selected || isToday ? "900" : "700",
                    }}
                  >
                    {day}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {selectedSchedule ? (
          <View
            style={[
              styles.scheduleCard,
              { borderColor: colors.primary, backgroundColor: colors.card },
            ]}
          >
            <Text style={{ color: colors.primary, fontWeight: "800" }}>
              Jadwal Tanggal Terpilih
            </Text>
            <Text style={{ color: colors.text, fontWeight: "700" }}>
              {selectedSchedule.hari}, {selectedSchedule.tanggal_lengkap}
            </Text>
            <View style={[styles.scheduleTable, { borderColor: colors.border }]}>
              {prayerRows.map(([label, value], idx) => (
                <View
                  key={label}
                  style={[
                    styles.scheduleRow,
                    idx < prayerRows.length - 1 && {
                      borderBottomColor: colors.border,
                      borderBottomWidth: 1,
                    },
                  ]}
                >
                  <Text style={{ color: colors.muted, fontWeight: "700" }}>{label}</Text>
                  <Text style={{ color: colors.text, fontWeight: "900" }}>{value}</Text>
                </View>
              ))}
            </View>
            {selectedSchedule.tanggal_lengkap === todayIso ? (
              <Text style={{ color: colors.primary, fontWeight: "800" }}>Hari ini</Text>
            ) : null}
          </View>
        ) : !shalatQuery.isLoading ? (
          <Text style={{ color: colors.muted, paddingTop: 10 }}>
            Jadwal untuk tanggal ini belum tersedia.
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  title: { fontSize: 20, fontWeight: "800" },
  selectorGroup: { gap: 10 },
  actionBtn: {
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderWidth: 1,
    borderRadius: 10,
  },
  monthBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekText: {
    width: "14.2857%",
    textAlign: "center",
    fontSize: 12,
    fontWeight: "800",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.2857%",
    aspectRatio: 1,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scheduleCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  scheduleTable: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  scheduleRow: {
    minHeight: 44,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});

export default ShalatScreen;
