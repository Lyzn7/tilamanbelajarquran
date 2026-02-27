import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  FlatList
} from "react-native";
import { useSettings } from "@/store/SettingsProvider";
import { lightColors, darkColors } from "@/theme";
import { vectorSearch } from "@/api/equran";

type VectorResult = {
  tipe: string;
  skor: number;
  relevansi?: string;
  data: any;
};

const ProSearchScreen: React.FC = () => {
  const { isDark } = useSettings();
  const colors = isDark ? darkColors : lightColors;
  const [query, setQuery] = useState("");
  const [tipeAyat] = useState(false); // ayat dimatikan
  const [tipeTafsir] = useState(true); // default tafsir
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<VectorResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const tipe = useMemo(() => { 
    return ["tafsir"];
  }, []);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await vectorSearch({
        cari: query.trim(),
        batas: 10,
        tipe
      });
      setResults(data);
    } catch (e: any) {
      setError(e?.message || "Gagal mencari");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Pencarian Pro (Vector)</Text>
      <Text style={[styles.caption, { color: colors.muted }]}>
        Powered by equran.id/api/vector — cocok untuk kata/frasa mirip dan semantik.
      </Text>
      <View style={[styles.searchBox, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <TextInput
          placeholder="Ketik kata/frasa (Arab / Latin / Indonesia)"
          placeholderTextColor={colors.muted}
          style={[styles.input, { color: colors.text }]}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={search}
          returnKeyType="search"
        />
        <Pressable style={[styles.searchBtn, { backgroundColor: colors.primary }]} onPress={search}>
          <Text style={{ color: "#0b1224", fontWeight: "800" }}>Cari</Text>
        </Pressable>
      </View>
      <View style={styles.filterRow}>
        <Text style={{ color: colors.muted, fontWeight: "700" }}>Mode: Tafsir (default)</Text>
      </View>

      {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />}
      {error && <Text style={{ color: "red", marginTop: 12 }}>{error}</Text>}

      <FlatList
        data={results}
        keyExtractor={(_, idx) => idx.toString()}
        contentContainerStyle={{ paddingVertical: 16, gap: 12 }}
        renderItem={({ item }) => {
          const tipeLabel = item.tipe?.toUpperCase?.() || "TAFSIR";
          const isi = item.data?.isi || "";
          const arti = item.data?.ringkas || item.data?.sumber || "";
          const sumber = item.data?.nama_surat || "";
          const idx = results.indexOf(item);
          const isExpanded = expanded.has(idx);

          return (
            <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <View style={styles.cardHeader}>
                
                <Text style={[styles.metaLine, { color: colors.muted }]} numberOfLines={1} ellipsizeMode="tail">
                  {sumber && item.data?.id_surat
                    ? `${sumber} (${item.data.id_surat}:${item.data.nomor_ayat ?? "-"})`
                    : sumber || ""}
                </Text>
              </View>
              <Text
                style={[styles.arab, { color: colors.text }]}
                numberOfLines={isExpanded ? undefined : 2}
                ellipsizeMode="tail"
              >
                {isi}
              </Text>
              <Text
                style={{ color: colors.muted }}
                numberOfLines={isExpanded ? undefined : 2}
                ellipsizeMode="tail"
              >
                {arti}
              </Text>
              {sumber ? (
                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 6 }} numberOfLines={1} ellipsizeMode="tail">
                  Sumber: {sumber}
                </Text>
              ) : null}
              <Pressable
                style={[styles.filterChip, { alignSelf: "flex-start", borderColor: colors.border, marginTop: 6 }]}
                onPress={() => {
                  const next = new Set(expanded);
                  next.has(idx) ? next.delete(idx) : next.add(idx);
                  setExpanded(next);
                }}
              >
                <Text style={{ color: colors.text, fontWeight: "700" }}>{isExpanded ? "Tutup" : "Lihat lengkap"}</Text>
              </Pressable>
            </View>
          );
        }}
        ListEmptyComponent={
          !loading && (
            <Text style={{ color: colors.muted, paddingTop: 20, textAlign: "center" }}>
              Belum ada hasil. Coba kata kunci berbeda.
            </Text>
          )
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  title: { fontSize: 20, fontWeight: "800", marginTop: 12 },
  caption: { fontSize: 13, marginTop: 4 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    gap: 8,
    marginTop: 12
  },
  input: { flex: 1, fontSize: 16, minWidth: 0 },
  searchBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10
  },
  filterRow: { flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 6
  },
  metaLine: { fontSize: 12 },
  arab: { fontSize: 18, fontWeight: "700", textAlign: "left" }
});

export default ProSearchScreen;
