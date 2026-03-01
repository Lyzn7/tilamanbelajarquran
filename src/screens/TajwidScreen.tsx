import FontSizeSlider from "@/components/FontSizeSlider";
import { tajwidData, TajwidRule } from "@/data/tajwid";
import { useSettings } from "@/store/SettingsProvider";
import { darkColors, lightColors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    LayoutAnimation,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    UIManager,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

if (
    Platform.OS === "android" &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const AccordionItem: React.FC<{
    rule: TajwidRule;
    colors: typeof lightColors;
    fontSize: number;
}> = ({ rule, colors, fontSize }) => {
    const [expanded, setExpanded] = useState(false);

    const toggle = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    };

    return (
        <View style={[styles.accordionContainer, { borderColor: colors.border }]}>
            <Pressable
                style={[styles.accordionHeader, { backgroundColor: expanded ? colors.card : "transparent" }]}
                onPress={toggle}
            >
                <Text style={[styles.accordionTitle, { color: colors.text }]}>
                    {rule.title}
                </Text>
                <Ionicons
                    name={expanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={colors.primary}
                />
            </Pressable>
            {expanded && (
                <View style={styles.accordionBody}>
                    <Text style={[styles.accordionDesc, { color: colors.muted }]}>
                        {rule.description}
                    </Text>
                    {rule.letters && (
                        <View style={styles.lettersContainer}>
                            <Text style={[styles.lettersLabel, { color: colors.primary }]}>
                                Huruf:
                            </Text>
                            <Text style={[styles.arabicText, { color: colors.text, fontSize }]}>
                                {rule.letters}
                            </Text>
                        </View>
                    )}
                    <View style={[styles.exampleBox, { backgroundColor: colors.background }]}>
                        <Text style={[styles.exampleLabel, { color: colors.primary }]}>
                            Contoh:
                        </Text>
                        <Text style={[styles.arabicText, { color: colors.text, fontSize }]}>
                            {rule.examples}
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );
};

const TajwidScreen: React.FC = () => {
    const { isDark, settings } = useSettings();
    const colors = isDark ? darkColors : lightColors;

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["bottom", "left", "right"]}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>
                        Panduan Tajwid
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.muted }]}>
                        Ringkasan ilmu tajwid dasar untuk memudahkan belajar Al-Quran
                    </Text>
                </View>

                <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <FontSizeSlider />
                </View>

                {tajwidData.map((category, idx) => (
                    <View key={idx} style={styles.categoryBlock}>
                        <Text style={[styles.categoryTitle, { color: colors.primary }]}>
                            {category.category}
                        </Text>
                        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            {category.rules.map((rule, ruleIdx) => (
                                <React.Fragment key={ruleIdx}>
                                    <AccordionItem rule={rule} colors={colors} fontSize={settings.fontSize} />
                                    {ruleIdx < category.rules.length - 1 && (
                                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                                    )}
                                </React.Fragment>
                            ))}
                        </View>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1 },
    scroll: { padding: 18, paddingBottom: 40 },
    header: { marginBottom: 16 },
    title: { fontSize: 28, fontWeight: "800", marginBottom: 6 },
    subtitle: { fontSize: 14, lineHeight: 22 },
    settingsCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 24 },
    categoryBlock: { marginBottom: 24 },
    categoryTitle: { fontSize: 16, fontWeight: "800", marginBottom: 10, letterSpacing: 0.5 },
    card: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
    accordionContainer: { overflow: "hidden" },
    accordionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
    },
    accordionTitle: { fontSize: 16, fontWeight: "700", flex: 1, marginRight: 8 },
    accordionBody: { padding: 16, paddingTop: 4 },
    accordionDesc: { fontSize: 14, lineHeight: 22, marginBottom: 12 },
    lettersContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
        flexWrap: "wrap",
    },
    lettersLabel: { fontSize: 14, fontWeight: "700", marginRight: 8 },
    arabicText: {
        fontSize: 20,
        fontFamily: Platform.OS === "ios" ? "Geeza Pro" : "sans-serif",
        lineHeight: 32,
        textAlign: "right",
    },
    exampleBox: {
        padding: 12,
        borderRadius: 8,
        marginTop: 6,
    },
    exampleLabel: { fontSize: 12, fontWeight: "800", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 },
    divider: { height: 1, width: "100%" },
});

export default TajwidScreen;
