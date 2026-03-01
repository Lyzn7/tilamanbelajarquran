import { DoaItem, getAllDoa } from "@/api/doa";
import { useSettings } from "@/store/SettingsProvider";
import { darkColors, lightColors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
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

const DoaListScreen: React.FC = () => {
    const { isDark, settings } = useSettings();
    const colors = isDark ? darkColors : lightColors;
    const route = useRoute<any>();
    const [expandedId, setExpandedId] = useState<number | null>(route.params?.doaId || null);

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["doaList"],
        queryFn: async () => {
            try {
                const res = await getAllDoa();
                return res;
            } catch (err) {
                console.log("Error fetching DOA:", err);
                throw err;
            }
        },
        staleTime: 1000 * 60 * 60 * 24 // Cache for 24 hours
    });

    const fontSize = settings.fontSize || 24;
    const [searchQuery, setSearchQuery] = useState("");

    const filteredData = useMemo(() => {
        if (!data) return [];
        // If there's a specific ID requested by dashboard but we haven't filtered it via search yet,
        // we might want to still show the whole list but perhaps auto-scroll to it. For now auto-expanding is enough.
        if (!searchQuery.trim()) return data;
        const q = searchQuery.toLowerCase();
        return data.filter(
            (item) => item.title.toLowerCase().includes(q) || (item.translation && item.translation.toLowerCase().includes(q))
        );
    }, [data, searchQuery]);

    const renderItem = ({ item }: { item: DoaItem }) => {
        const isExpanded = expandedId === item.id;

        return (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Pressable
                    style={styles.cardHeader}
                    onPress={() => setExpandedId(isExpanded ? null : item.id)}
                >
                    <View style={styles.titleContainer}>
                        <View style={[styles.numberCircle, { backgroundColor: colors.primary + "1A" }]}>
                            <Text style={[styles.numberText, { color: colors.primary }]}>{item.id}</Text>
                        </View>
                        <Text style={[styles.titleText, { color: colors.text }]}>{item.title}</Text>
                    </View>
                    <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={24}
                        color={colors.muted}
                    />
                </Pressable>

                {isExpanded && (
                    <View style={[styles.cardContent, { borderTopColor: colors.border }]}>
                        <Text
                            style={[
                                styles.arabicText,
                                { color: colors.text, fontSize: fontSize, lineHeight: fontSize * 1.8 }
                            ]}
                        >
                            {item.arabic}
                        </Text>
                        <Text style={[styles.latinText, { color: colors.primary }]}>{item.latin}</Text>
                        <Text style={[styles.translationText, { color: colors.muted }]}>
                            "{item.translation}"
                        </Text>
                        {!!item.source && (
                            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
                                <Text style={[styles.sourceText, { color: colors.text }]}>
                                    {item.source}
                                </Text>
                            </View>
                        )}
                    </View>
                )}
            </View>
        );
    };

    const flatListRef = React.useRef<FlatList>(null);

    React.useEffect(() => {
        if (data && route.params?.doaId && flatListRef.current) {
            const index = data.findIndex(d => d.id === route.params.doaId);
            if (index !== -1) {
                // Slight delay to ensure list is rendered
                setTimeout(() => {
                    flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.1 });
                }, 300);
            }
        }
    }, [data, route.params?.doaId]);

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.muted }]}>Memuat daftar doa...</Text>
            </SafeAreaView>
        );
    }

    if (isError || !data) {
        return (
            <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]}>
                <Ionicons name="warning" size={48} color="#E53935" style={{ marginBottom: 16 }} />
                <Text style={[styles.errorText, { color: colors.text }]}>
                    Gagal memuat kumpulan doa.
                </Text>
                <Text style={{ color: colors.muted, textAlign: "center", marginTop: 8 }}>
                    Detail Error: {error instanceof Error ? error.message : "Tidak diketahui"}
                </Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["bottom", "left", "right"]}>
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
                    <Ionicons name="search" size={20} color={colors.muted} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Cari doa..."
                        placeholderTextColor={colors.muted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <Pressable onPress={() => setSearchQuery("")}>
                            <Ionicons name="close-circle" size={20} color={colors.muted} />
                        </Pressable>
                    )}
                </View>
            </View>
            <FlatList
                ref={flatListRef}
                data={filteredData}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                initialNumToRender={10}
                maxToRenderPerBatch={15}
                windowSize={5}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    errorText: {
        fontSize: 16,
        textAlign: "center",
        lineHeight: 24,
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 40,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
    },
    listContent: {
        padding: 16,
        gap: 12,
    },
    card: {
        borderRadius: 16,
        borderWidth: 1,
        overflow: "hidden",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
    },
    titleContainer: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        paddingRight: 16,
    },
    numberCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    numberText: {
        fontSize: 14,
        fontWeight: "700",
    },
    titleText: {
        fontSize: 16,
        fontWeight: "700",
        flex: 1,
    },
    cardContent: {
        padding: 16,
        borderTopWidth: 1,
        backgroundColor: "#00000005",
    },
    arabicText: {
        textAlign: "right",
        fontFamily: "Amiri", // Assuming Amiri is available from global app settings/Quran view
        marginBottom: 16,
    },
    latinText: {
        fontSize: 15,
        fontStyle: "italic",
        marginBottom: 8,
        lineHeight: 22,
    },
    translationText: {
        fontSize: 15,
        lineHeight: 22,
    },
    sourceText: {
        fontSize: 13,
        lineHeight: 20,
        fontStyle: "italic",
    },
});

export default DoaListScreen;
