import React, { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { getSurahList } from "@/api/equran";
import { queryKeys } from "@/api/queryKeys";
import { useSettings } from "@/store/SettingsProvider";
import { lightColors, darkColors } from "@/theme";
import { SurahSummary } from "@/types/api";
import SurahCard from "@/components/SurahCard";

const SearchScreen: React.FC = () => {
  const { isDark } = useSettings();
  const colors = isDark ? darkColors : lightColors;
  const navigation = useNavigation();
  const [term, setTerm] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.surahList,
    queryFn: getSurahList,
    staleTime: 1000 * 60 * 10
  });

  const filtered: SurahSummary[] = useMemo(() => {
    if (!data) return [];
    if (!term) return data;
    const q = term.toLowerCase();
    return data.filter(
      (s) =>
        s.namaLatin.toLowerCase().includes(q) ||
        s.arti.toLowerCase().includes(q) ||
        s.nama.toLowerCase().includes(q) ||
        `${s.nomor}` === q
    );
  }, [data, term]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.info, { color: colors.muted }]}>
        API equran v2 belum menyediakan pencarian ayat. Pencarian di sini memfilter nama/arti surat secara offline.
      </Text>
      <View style={[styles.searchBox, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <TextInput
          placeholder="Ketik nama surat / arti / nomor..."
          placeholderTextColor={colors.muted}
          style={[styles.input, { color: colors.text }]}
          value={term}
          onChangeText={setTerm}
        />
      </View>
      {isLoading && <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />}
      {error && <Text style={{ color: colors.text }}>Gagal memuat: {(error as Error).message}</Text>}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.nomor.toString()}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <SurahCard
            item={item}
            onPress={() => navigation.navigate("SurahDetail" as never, { nomor: item.nomor } as never)}
          />
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  info: { paddingHorizontal: 16, paddingTop: 12, fontSize: 13 },
  searchBox: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  input: { fontSize: 16 }
});

export default SearchScreen;
