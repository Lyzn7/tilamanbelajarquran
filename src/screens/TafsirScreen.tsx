import { getTafsir } from "@/api/equran";
import { queryKeys } from "@/api/queryKeys";
import { RootStackParamList } from "@/navigation";
import { useSettings } from "@/store/SettingsProvider";
import { darkColors, lightColors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ScreenRoute = RouteProp<RootStackParamList, "Tafsir">;

const TafsirScreen: React.FC = () => {
    const { isDark, settings } = useSettings();
    const colors = isDark ? darkColors : lightColors;
    const route = useRoute<ScreenRoute>();
    const navigation = useNavigation();
    const { nomor } = route.params;

    const { data, isLoading, error } = useQuery({
        queryKey: queryKeys.tafsir(nomor),
        queryFn: () => getTafsir(nomor),
        staleTime: 1000 * 60 * 60, // 1 hour
    });

    const [searchQuery, setSearchQuery] = useState("");

    const filteredData = useMemo(() => {
        if (!data?.tafsir) return [];
        if (!searchQuery.trim()) return data.tafsir;
        return data.tafsir.filter((item) =>
            item.ayat.toString() === searchQuery.trim() ||
            item.teks.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [data, searchQuery]);

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </SafeAreaView>
        );
    }

    if (error || !data) {
        return (
            <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]}>
                <Ionicons name="warning" size={48} color={colors.primary} />
                <Text style={{ color: colors.text, marginTop: 16 }}>Gagal memuat tafsir</Text>
                <Pressable
                    style={[styles.backBtn, { borderColor: colors.primary, marginTop: 24 }]}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={{ color: colors.primary, fontWeight: "600" }}>Kembali</Text>
                </Pressable>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["bottom", "left", "right"]}>
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <View style={styles.headerTitleRow}>
                    <Pressable onPress={() => navigation.goBack()} style={{ paddingRight: 16 }}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </Pressable>
                    <View>
                        <Text style={[styles.surahTitle, { color: colors.text }]}>Tafsir Surat {data.namaLatin}</Text>
                        <Text style={{ color: colors.muted }}>{data.jumlahAyat} ayat</Text>
                    </View>
                </View>

                <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
                    <Ionicons name="search" size={20} color={colors.muted} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Cari ayat atau kata kunci..."
                        placeholderTextColor={colors.muted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        keyboardType="default"
                    />
                    {searchQuery.length > 0 && (
                        <Pressable onPress={() => setSearchQuery("")}>
                            <Ionicons name="close-circle" size={20} color={colors.muted} />
                        </Pressable>
                    )}
                </View>
            </View>
            <FlatList
                data={filteredData}
                keyExtractor={(item) => item.ayat.toString()}
                contentContainerStyle={styles.listContent}
                initialNumToRender={10}
                windowSize={5}
                renderItem={({ item }) => (
                    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={[styles.badge, { backgroundColor: colors.primary + "15" }]}>
                            <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>Ayat {item.ayat}</Text>
                        </View>
                        <Text style={[styles.teks, { color: colors.text, fontSize: (settings.fontSize || 24) * 0.65 }]}>{item.teks}</Text>
                    </View>
                )}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        gap: 12,
    },
    headerTitleRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    surahTitle: {
        fontSize: 20,
        fontWeight: "700",
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 48,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
    },
    listContent: {
        padding: 16,
        gap: 16,
    },
    card: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        elevation: 2,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    badge: {
        alignSelf: "flex-start",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginBottom: 12,
    },
    teks: {
        lineHeight: 26,
    },
    backBtn: {
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
});

export default TafsirScreen;
