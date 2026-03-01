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
                    // Adjust for 0=North standard instead of usual coordinate system.
                    angle = angle - 90;
                    if (angle < 0) {
                        angle = angle + 360;
                    }
                    setHeading(angle);
                });

                setIsReady(true);
            } catch (err) {
                setLocationError("Gagal mengambil data lokasi atau sensor kompas.");
            }
        };

        setup();

        return () => {
            if (sub) {
                sub.remove();
            }
        };
    }, []);

    // Is pointing roughly at Qibla (tolerance of +/- 5 degrees)
    const isFacingQibla = useMemo(() => {
        if (qiblaBearing === null) return false;
        const diff = Math.abs(heading - qiblaBearing);
        // account for 359 -> 0 wraparound
        return diff <= 5 || diff >= 355;
    }, [heading, qiblaBearing]);

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

    // Calculate rotation. Note: React Native transforms need strings like "45deg"
    // The compass needs to rotate opposite to the heading to keep North pointing Up.
    const compassRotation = `${360 - heading}deg`;
    // The Qibla indicator is fixed relative to the compass background
    const qiblaPointerRotation = `${qiblaBearing}deg`;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["bottom", "left", "right"]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Kompas Kiblat</Text>
                <Text style={[styles.subtitle, { color: colors.muted }]}>
                    Putar perangkat Anda hingga tanda panah sejajar dengan ikon Ka'bah.
                </Text>
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
                    {/* Compass Dial Rotating */}
                    <Animated.View
                        style={[
                            styles.compassBase,
                            { transform: [{ rotate: compassRotation }] },
                        ]}
                    >
                        {/* Cardinal points */}
                        <Text style={[styles.cardinal, styles.north, { color: colors.primary }]}>U</Text>
                        <Text style={[styles.cardinal, styles.east, { color: colors.text }]}>T</Text>
                        <Text style={[styles.cardinal, styles.south, { color: colors.text }]}>S</Text>
                        <Text style={[styles.cardinal, styles.west, { color: colors.text }]}>B</Text>

                        {/* Qibla Indicator: A line pointing from the center (Kaabah) to the bearing */}
                        <View
                            style={[
                                styles.qiblaIndicatorContainer,
                                { transform: [{ rotate: qiblaPointerRotation }] },
                            ]}
                        >
                            <Ionicons name="caret-up" size={32} color={colors.accent} style={{ marginTop: -15, zIndex: 11 }} />
                            <View style={[styles.qiblaLine, { backgroundColor: colors.accent }]} />
                        </View>

                        {/* Kaabah icon strictly in the center */}
                        <View style={styles.centerIconContainer}>
                            <Text style={styles.kaabahIcon}>🕋</Text>
                        </View>
                    </Animated.View>

                    {/* Static Device Pointer Overlay (Always points UP to show where phone is facing) */}
                    <View style={styles.devicePointer}>
                        <Ionicons name="chevron-up" size={48} color={isFacingQibla ? colors.accent : colors.primary} />
                    </View>
                </View>

                <View style={styles.infoBox}>
                    <Text style={[styles.infoLabel, { color: colors.muted }]}>Sudut Kiblat</Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                        {Math.round(qiblaBearing)}°
                    </Text>
                </View>
                <View style={styles.infoBox}>
                    <Text style={[styles.infoLabel, { color: colors.muted }]}>Arah HP Anda</Text>
                    <Text style={[styles.infoValue, { color: isFacingQibla ? colors.accent : colors.text }]}>
                        {Math.round(heading)}°
                    </Text>
                </View>
            </View>

            {isFacingQibla && (
                <View style={[styles.successBanner, { backgroundColor: colors.accent }]}>
                    <Text style={styles.successText}>Arah Kiblat Sudah Tepat!</Text>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    centerBox: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
    errorText: { textAlign: "center", fontSize: 16, lineHeight: 24 },
    loadingText: { marginTop: 16, fontSize: 14 },
    header: { padding: 20, paddingTop: 30, alignItems: "center" },
    title: { fontSize: 26, fontWeight: "800", marginBottom: 8 },
    subtitle: { fontSize: 14, textAlign: "center", lineHeight: 22 },
    compassWrapper: { flex: 1, alignItems: "center", justifyContent: "center" },
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
    devicePointer: {
        position: "absolute",
        top: -35,
        alignItems: "center",
    },
    infoBox: { marginTop: 20, alignItems: "center" },
    infoLabel: { fontSize: 14, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 },
    infoValue: { fontSize: 28, fontWeight: "900", marginTop: 4 },
    successBanner: {
        position: "absolute",
        bottom: 40,
        alignSelf: "center",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 30,
        elevation: 10,
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    successText: { color: "white", fontWeight: "800", fontSize: 16, letterSpacing: 0.5 },
});

export default KiblatScreen;
