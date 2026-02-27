import React, { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { getSurahList } from "@/api/equran";
import { queryKeys } from "@/api/queryKeys";
import SurahCard from "@/components/SurahCard";
import { useSettings } from "@/store/SettingsProvider";
import { useReadingState } from "@/store/ReadingStateProvider";
import { deleteDownloadByNumber, useDownloadManifest } from "@/hooks/useSurahDownload";
import { lightColors, darkColors } from "@/theme";

const SurahListScreen: React.FC = () => {
  const { isDark } = useSettings();
  const colors = isDark ? darkColors : lightColors;
  const navigation = useNavigation();
  const { lastRead } = useReadingState();
  const { manifest, reload } = useDownloadManifest();
  const [search, setSearch] = useState("");

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: queryKeys.surahList,
    queryFn: getSurahList,
    staleTime: 1000 * 60 * 10
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!search) return data;
    const term = search.toLowerCase();
    return data.filter(
      (item) =>
        item.namaLatin.toLowerCase().includes(term) ||
        item.nama.toLowerCase().includes(term) ||
        item.arti.toLowerCase().includes(term) ||
        `${item.nomor}` === term
    );
  }, [data, search]);

  const renderHeader = () => (
    <View style={styles.topBar}>
      <Text style={[styles.title, { color: colors.text }]}>Al-Qur’an</Text>
      <View style={styles.actions}>
        <Ionicons
          name="search-outline"
          size={22}
          color={colors.text}
          onPress={() => navigation.navigate("Search" as never)}
        />
        <Ionicons
          name="list-outline"
          size={22}
          color={colors.text}
          onPress={() => navigation.navigate("JuzList" as never)}
          style={{ marginLeft: 14 }}
        />
        <Ionicons
          name="settings-outline"
          size={22}
          color={colors.text}
          onPress={() => navigation.navigate("Settings" as never)}
          style={{ marginLeft: 14 }}
        />
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {renderHeader()}
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, padding: 16 }]}>
        {renderHeader()}
        <Text style={[styles.error, { color: colors.text }]}>Gagal memuat data: {(error as Error).message}</Text>
        <Ionicons name="refresh" size={18} color={colors.primary} onPress={() => refetch()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {renderHeader()}
      <View style={[styles.searchBox, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Ionicons name="search" color={colors.muted} size={18} />
        <TextInput
          placeholder="Cari surat..."
          placeholderTextColor={colors.muted}
          style={[styles.input, { color: colors.text }]}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.nomor.toString()}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={async () => {
              await Promise.all([refetch(), reload()]);
            }}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => (
          <SurahCard
            item={item}
            lastReadAyah={lastRead?.surah === item.nomor ? lastRead.ayah : undefined}
            downloaded={Boolean(manifest[item.nomor]?.textCached || manifest[item.nomor]?.audio)}
            onDelete={async () => {
                await deleteDownloadByNumber(item.nomor);
                await reload();
                await refetch();
            }}
            onPress={() => navigation.navigate("SurahDetail" as never, { nomor: item.nomor } as never)}
          />
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  title: { fontSize: 22, fontWeight: "800" },
  actions: { flexDirection: "row", alignItems: "center" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8
  },
  input: { flex: 1, fontSize: 16 },
  error: { fontSize: 15, marginVertical: 16 }
});

export default SurahListScreen;
