import { useSettings } from "@/store/SettingsProvider";
import { darkColors, lightColors } from "@/theme";
import { getQiblaBearing } from "@/utils/qibla";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { Magnetometer } from "expo-sensors";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const COMPASS_SIZE = width * 0.40;

const KiblatScreen: React.FC = () => {
    const { isDark } = useSettings();
    const colors = isDark ? darkColors : lightColors;

    const [locationError, setLocationError] = useState<string | null>(null);
    const [qiblaBearing, setQiblaBearing] = useState<number | null>(null);
    const [heading, setHeading] = useState<number>(0);
    const [isReady, setIsReady] = useState(false);
    const [offset, setOffset] = useState(0); // koreksi manual sensor gyro (derajat)

    useEffect(() => {
        let sub: ReturnType<typeof Magnetometer.addListener> | undefined;

        const setup = async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== "granted") {
                    setLocationError(
                        "Izin lokasi ditolak. Kompas membutuhkan lokasi GPS Anda untuk menentukan arah Kiblat yang akurat."
                    );
                    return;
                }

                const location = await Location.getCurrentPositionAsync({});
                const bearing = getQiblaBearing(
                    location.coords.latitude,
                    location.coords.longitude
                );
                setQiblaBearing(bearing);

                const isAvailable = await Magnetometer.isAvailableAsync();
                if (!isAvailable) {
                    setLocationError(
                        "Sensor kompas (Magnetometer) tidak tersedia di perangkat ini."
                    );
                    return;
                }

                Magnetometer.setUpdateInterval(50);
                sub = Magnetometer.addListener((data) => {
                    let angle = Math.atan2(data.y, data.x) * (180 / Math.PI);
                    angle = angle - 90;
                    if (angle < 0) angle = angle + 360;
                    setHeading(angle);
                });

                setIsReady(true);
            } catch (err) {
                setLocationError("Gagal mengambil data lokasi atau sensor kompas.");
            }
        };

        setup();
        return () => { if (sub) sub.remove(); };
    }, []);

    // Heading setelah koreksi offset
    const adjustedHeading = (heading + offset + 360) % 360;

    const isFacingQibla = useMemo(() => {
        if (qiblaBearing === null) return false;
        const diff = Math.abs(adjustedHeading - qiblaBearing);
        return diff <= 5 || diff >= 355;
    }, [adjustedHeading, qiblaBearing]);

    const changeOffset = (delta: number) =>
        setOffset((prev) => Math.round((prev + delta + 360) % 360));

    if (locationError) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.centerBox}>
                    <Ionicons name="warning" size={48} color={colors.accent} style={{ marginBottom: 16 }} />
                    <Text style={[styles.errorText, { color: colors.text }]}>{locationError}</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!isReady || qiblaBearing === null) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.muted }]}>
                        Menyiapkan kompas & mencari lokasi Anda...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    const compassRotation = `${360 - adjustedHeading}deg`;
    const qiblaPointerRotation = `${qiblaBearing}deg`;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["bottom", "left", "right"]}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>Kompas Kiblat</Text>
                    <Text style={[styles.subtitle, { color: colors.muted }]}>
                        Putar perangkat Anda hingga tanda panah sejajar dengan ikon Ka'bah.
                    </Text>
                </View>

                {/* Disclaimer akurasi */}
                <View style={[styles.disclaimer, { backgroundColor: "#FFF8E1", borderColor: "#FFC107" }]}>
                    <Ionicons name="warning-outline" size={16} color="#F59E0B" style={{ marginTop: 1 }} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.disclaimerTitle}>⚠️ Perhatian Akurasi Sensor</Text>
                        <Text style={styles.disclaimerText}>
                            {"• Sensor gyro & GPS HP terkadang tidak akurat.\n"}
                            {"• Kalibrasi dulu: pastikan "}
                            <Text style={{ fontWeight: "800" }}>huruf U (Utara)</Text>
                            {" pada kompas benar-benar menghadap utara sesuai Google Maps.\n"}
                            {"• Gunakan tombol Koreksi Sensor di bawah jika kompas miring."}
                        </Text>
                    </View>
                </View>

                <View style={styles.compassWrapper}>
                    <View
                        style={[
                            styles.outerRing,
                            {
                                borderColor: isFacingQibla ? colors.accent : colors.border,
                                backgroundColor: isFacingQibla ? colors.accent + "1A" : colors.card,
                            },
                        ]}
                    >
                        <Animated.View
                            style={[
                                styles.compassBase,
                                { transform: [{ rotate: compassRotation }] },
                            ]}
                        >
                            <Text style={[styles.cardinal, styles.north, { color: colors.primary }]}>U</Text>
                            <Text style={[styles.cardinal, styles.east, { color: colors.text }]}>T</Text>
                            <Text style={[styles.cardinal, styles.south, { color: colors.text }]}>S</Text>
                            <Text style={[styles.cardinal, styles.west, { color: colors.text }]}>B</Text>

                            <View
                                style={[
                                    styles.qiblaIndicatorContainer,
                                    { transform: [{ rotate: qiblaPointerRotation }] },
                                ]}
                            >
                                <Ionicons name="caret-up" size={32} color={colors.accent} style={{ marginTop: -15, zIndex: 11 }} />
                                <View style={[styles.qiblaLine, { backgroundColor: colors.accent }]} />
                            </View>

                            <View style={styles.centerIconContainer}>
                                <Text style={styles.kaabahIcon}>🕋</Text>
                            </View>
                        </Animated.View>

                        <View style={styles.devicePointer}>
                            <Ionicons name="chevron-up" size={48} color={isFacingQibla ? colors.accent : colors.primary} />
                        </View>
                    </View>

                    {/* Info row */}
                    <View style={styles.infoRow}>
                        <View style={styles.infoBox}>
                            <Text style={[styles.infoLabel, { color: colors.muted }]}>Sudut Kiblat</Text>
                            <Text style={[styles.infoValue, { color: colors.text }]}>{Math.round(qiblaBearing)}°</Text>
                        </View>
                        <View style={styles.infoBox}>
                            <Text style={[styles.infoLabel, { color: colors.muted }]}>Arah HP</Text>
                            <Text style={[styles.infoValue, { color: isFacingQibla ? colors.accent : colors.text }]}>
                                {Math.round(adjustedHeading)}°
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Offset / Koreksi Manual */}
                <View style={[styles.offsetCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.offsetTitle, { color: colors.text }]}>🔧 Koreksi Sensor</Text>
                    <Text style={[styles.offsetSub, { color: colors.muted }]}>
                        Geser kompas jika arah tidak sesuai kenyataan
                    </Text>
                    <View style={styles.offsetRow}>
                        {([-45, -5, -1] as const).map((d) => (
                            <Pressable
                                key={d}
                                style={[styles.offsetBtn, { borderColor: colors.border, backgroundColor: colors.badge }]}
                                onPress={() => changeOffset(d)}
                            >
                                <Text style={[styles.offsetBtnText, { color: colors.text }]}>{d}°</Text>
                            </Pressable>
                        ))}
                        <View style={[styles.offsetCurrent, { borderColor: colors.primary }]}>
                            <Text style={[styles.offsetCurrentText, { color: colors.primary }]}>
                                {offset >= 0 ? `+${offset}` : offset}°
                            </Text>
                        </View>
                        {([1, 5, 45] as const).map((d) => (
                            <Pressable
                                key={d}
                                style={[styles.offsetBtn, { borderColor: colors.border, backgroundColor: colors.badge }]}
                                onPress={() => changeOffset(d)}
                            >
                                <Text style={[styles.offsetBtnText, { color: colors.text }]}>+{d}°</Text>
                            </Pressable>
                        ))}
                    </View>
                    {offset !== 0 && (
                        <Pressable onPress={() => setOffset(0)} style={styles.resetBtn}>
                            <Ionicons name="refresh" size={14} color={colors.muted} />
                            <Text style={[styles.resetText, { color: colors.muted }]}>Reset koreksi</Text>
                        </Pressable>
                    )}
                </View>

                {isFacingQibla && (
                    <View style={[styles.successBanner, { backgroundColor: colors.accent }]}>
                        <Text style={styles.successText}>✅ Arah Kiblat Sudah Tepat!</Text>
                    </View>
                )}

                <View style={{ height: 24 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    centerBox: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
    errorText: { textAlign: "center", fontSize: 16, lineHeight: 24 },
    loadingText: { marginTop: 16, fontSize: 14 },
    header: { padding: 20, paddingTop: 16, alignItems: "center" },
    title: { fontSize: 24, fontWeight: "800", marginBottom: 6 },
    subtitle: { fontSize: 13, textAlign: "center", lineHeight: 20 },
    disclaimer: {
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 12,
        borderWidth: 1,
        padding: 12,
        flexDirection: "row",
        gap: 8,
    },
    disclaimerTitle: { fontSize: 13, fontWeight: "800", color: "#B45309", marginBottom: 4 },
    disclaimerText: { fontSize: 12, color: "#78350F", lineHeight: 18 },
    compassWrapper: { alignItems: "center", paddingBottom: 8 },
    outerRing: {
        width: COMPASS_SIZE,
        height: COMPASS_SIZE,
        borderRadius: COMPASS_SIZE / 2,
        borderWidth: 8,
        alignItems: "center",
        justifyContent: "center",
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8,
    },
    compassBase: {
        width: COMPASS_SIZE - 20,
        height: COMPASS_SIZE - 20,
        borderRadius: (COMPASS_SIZE - 20) / 2,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
    },
    cardinal: { position: "absolute", fontSize: 24, fontWeight: "900" },
    north: { top: 10 },
    south: { bottom: 10 },
    east: { right: 15 },
    west: { left: 15 },
    qiblaIndicatorContainer: {
        position: "absolute",
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "flex-start",
    },
    qiblaLine: { width: 4, height: (COMPASS_SIZE / 2) - 35, borderRadius: 2, marginTop: -5 },
    centerIconContainer: {
        position: "absolute",
        justifyContent: "center",
        alignItems: "center",
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "#ffffffcc",
        zIndex: 10,
    },
    kaabahIcon: { fontSize: 32 },
    devicePointer: { position: "absolute", top: -35, alignItems: "center" },
    infoRow: { flexDirection: "row", gap: 32, marginTop: 16 },
    infoBox: { alignItems: "center" },
    infoLabel: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 },
    infoValue: { fontSize: 26, fontWeight: "900", marginTop: 2 },
    offsetCard: {
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 14,
        borderWidth: 1,
        padding: 14,
    },
    offsetTitle: { fontSize: 15, fontWeight: "800", marginBottom: 2 },
    offsetSub: { fontSize: 12, marginBottom: 10 },
    offsetRow: { flexDirection: "row", alignItems: "center", gap: 4, flexWrap: "wrap", justifyContent: "center" },
    offsetBtn: {
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        minWidth: 36,
        alignItems: "center",
    },
    offsetBtnText: { fontSize: 12, fontWeight: "700" },
    offsetCurrent: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 2,
        minWidth: 48,
        alignItems: "center",
    },
    offsetCurrentText: { fontSize: 13, fontWeight: "900" },
    resetBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8, alignSelf: "center" },
    resetText: { fontSize: 12 },
    successBanner: {
        alignSelf: "center",
        marginTop: 12,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 30,
        elevation: 4,
    },
    successText: { color: "white", fontWeight: "800", fontSize: 15 },
});

export default KiblatScreen;
