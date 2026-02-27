import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { getShalatKabKota, getShalatProvinsi, getShalatSchedule } from "@/api/equran";
import { queryKeys } from "@/api/queryKeys";
import SelectField from "@/components/SelectField";
import { useSettings } from "@/store/SettingsProvider";
import { useScheduleLocation } from "@/hooks/useScheduleLocation";
import { lightColors, darkColors } from "@/theme";
import { ShalatDay } from "@/types/api";

const todayLocalISO = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
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

  const { location, setLocation, hydrated } = useScheduleLocation();
  const { provinsi, kabkota } = location;
  const normalizedProv = normalizeProvinceName(provinsi || "");
  const normalizedKab = normalizeKabName(kabkota || "");

  const provQuery = useQuery({
    queryKey: queryKeys.shalatProvinsi,
    queryFn: getShalatProvinsi,
    staleTime: 1000 * 60 * 60 * 24
  });

  useEffect(() => {
    if (provQuery.data && !provinsi) {
      const fallback = provQuery.data.find((p) => p.includes("Yogyakarta")) || provQuery.data[0];
      if (fallback) setLocation({ provinsi: fallback, kabkota: null });
    }
  }, [provQuery.data, provinsi, setLocation]);

  const kabQuery = useQuery({
    queryKey: provinsi ? queryKeys.shalatKabKota(normalizedProv) : queryKeys.shalatKabKota(""),
    queryFn: () => getShalatKabKota(normalizedProv || ""),
    enabled: Boolean(normalizedProv),
    staleTime: 1000 * 60 * 60 * 12
  });

  useEffect(() => {
    if (kabQuery.data && provinsi && !kabkota) {
      const fallback = kabQuery.data.find((k) => k.includes("Bantul")) || kabQuery.data[0];
      if (fallback) setLocation({ kabkota: fallback });
    }
  }, [kabQuery.data, provinsi, kabkota, setLocation]);

  const shalatQuery = useQuery({
    queryKey:
      provinsi && kabkota ? queryKeys.shalatSchedule(normalizedProv, normalizedKab, bulan, tahun) : ["shalat", "none"],
    queryFn: () => getShalatSchedule(normalizedProv || "", normalizedKab || "", bulan, tahun),
    enabled: Boolean(normalizedProv && normalizedKab && hydrated),
    staleTime: 1000 * 60 * 15
  });

  const todayIso = todayLocalISO();
  const todayCard = useMemo(
    () => shalatQuery.data?.jadwal.find((item) => item.tanggal_lengkap === todayIso),
    [shalatQuery.data, todayIso]
  );

  const renderCard = ({ item }: { item: ShalatDay }) => {
    const isToday = item.tanggal_lengkap === todayIso;

    const pill = (label: string, value: string, highlight?: boolean) => (
      <View
        style={[
          styles.pill,
          {
            borderColor: colors.border,
            backgroundColor: highlight ? colors.badge : colors.card
          }
        ]}
      >
        <Text style={{ color: colors.muted, fontSize: 12 }}>{label}</Text>
        <Text style={{ color: colors.text, fontWeight: "800", fontSize: 16 }}>{value}</Text>
      </View>
    );

    return (
      <View
        style={[
          styles.card,
          {
            borderColor: isToday ? colors.primary : colors.border,
            backgroundColor: colors.card
          }
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{item.hari}</Text>
          <Text style={{ color: colors.muted }}>{item.tanggal_lengkap}</Text>
        </View>
        <View style={styles.pillRow}>
          {pill("Imsak", item.imsak, true)}
          {pill("Subuh", item.subuh)}
          {pill("Terbit", item.terbit)}
          {pill("Dhuha", item.dhuha)}
        </View>
        <View style={styles.pillRow}>
          {pill("Dzuhur", item.dzuhur)}
          {pill("Ashar", item.ashar)}
          {pill("Maghrib", item.maghrib, true)}
          {pill("Isya", item.isya)}
        </View>
        {isToday && <Text style={{ color: colors.primary, marginTop: 6, fontWeight: "700" }}>Hari ini</Text>}
      </View>
    );
  };

  const header = (
    <View style={{ gap: 10, marginBottom: 6 }}>
      <Text style={[styles.title, { color: colors.text }]}>Jadwal Shalat Bulanan</Text>
      <Text style={{ color: colors.muted }}>
        Tarik data jadwal shalat equran.id untuk satu bulan penuh. Pilih lokasi serta bulan/tahun untuk memuat jadwal.
      </Text>
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
      <View style={[styles.monthRow, { borderColor: colors.border }]}>
        <Pressable style={[styles.monthBtn, { borderColor: colors.border }]} onPress={() => adjustMonth(-1)}>
          <Text style={{ color: colors.text, fontWeight: "800" }}>‹</Text>
        </Pressable>
        <Text style={{ color: colors.text, fontWeight: "800", fontSize: 16 }}>
          {shalatQuery.data?.bulan_nama || `Bulan ${bulan}`} {tahun}
        </Text>
        <Pressable style={[styles.monthBtn, { borderColor: colors.border }]} onPress={() => adjustMonth(1)}>
          <Text style={{ color: colors.text, fontWeight: "800" }}>›</Text>
        </Pressable>
      </View>
      {shalatQuery.isLoading && (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 6 }} testID="shalat-loading" />
      )}
      {shalatQuery.error && <Text style={{ color: "red" }}>Gagal memuat: {(shalatQuery.error as Error).message}</Text>}

      {todayCard && (
        <View
          style={[
            styles.todayCard,
            { borderColor: colors.primary, backgroundColor: colors.badge, shadowColor: colors.text }
          ]}
        >
          <Text style={{ color: colors.primary, fontWeight: "800" }}>Jadwal Hari Ini</Text>
          <Text style={{ color: colors.text, fontWeight: "700" }}>
            {todayCard.hari}, {todayCard.tanggal_lengkap}
          </Text>
          <View style={styles.todayRow}>
            <Text style={{ color: colors.muted }}>Imsak</Text>
            <Text style={{ color: colors.text, fontWeight: "800" }}>{todayCard.imsak}</Text>
          </View>
          <View style={styles.todayRow}>
            <Text style={{ color: colors.muted }}>Subuh</Text>
            <Text style={{ color: colors.text, fontWeight: "800" }}>{todayCard.subuh}</Text>
          </View>
          <View style={styles.todayRow}>
            <Text style={{ color: colors.muted }}>Dzuhur</Text>
            <Text style={{ color: colors.text, fontWeight: "800" }}>{todayCard.dzuhur}</Text>
          </View>
          <View style={styles.todayRow}>
            <Text style={{ color: colors.muted }}>Ashar</Text>
            <Text style={{ color: colors.text, fontWeight: "800" }}>{todayCard.ashar}</Text>
          </View>
          <View style={styles.todayRow}>
            <Text style={{ color: colors.muted }}>Maghrib</Text>
            <Text style={{ color: colors.text, fontWeight: "800" }}>{todayCard.maghrib}</Text>
          </View>
          <View style={styles.todayRow}>
            <Text style={{ color: colors.muted }}>Isya</Text>
            <Text style={{ color: colors.text, fontWeight: "800" }}>{todayCard.isya}</Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={shalatQuery.data?.jadwal || []}
        keyExtractor={(item) => `shalat-${item.tanggal_lengkap}`}
        contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 12 }}
        refreshControl={
          <RefreshControl
            refreshing={shalatQuery.isRefetching}
            onRefresh={() => shalatQuery.refetch()}
            tintColor={colors.primary}
          />
        }
        renderItem={renderCard}
        ListHeaderComponent={header}
        ListEmptyComponent={
          !shalatQuery.isLoading && (
            <Text style={{ color: colors.muted, paddingTop: 10 }}>
              Pilih lokasi lalu tekan refresh untuk melihat jadwal shalat bulan ini.
            </Text>
          )
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 20, fontWeight: "800" },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: 18, fontWeight: "800" },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: "47%"
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderWidth: 1,
    borderRadius: 10
  },
  monthBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  todayCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 6
  },
  todayRow: { flexDirection: "row", justifyContent: "space-between" }
});

export default ShalatScreen;
