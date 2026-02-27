import React, { useRef, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, View, Pressable, NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "@/store/storageKeys";
import { lightColors, darkColors } from "@/theme";
import { useSettings } from "@/store/SettingsProvider";

const { width } = Dimensions.get("window");

type Slide = {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const slides: Slide[] = [
  {
    title: "Selamat Datang",
    subtitle: "Baca Qur'an, dengarkan tilawah, dan nikmati tampilan premium.",
    icon: "sparkles-outline"
  },
  {
    title: "Pantau Ibadah Harian",
    subtitle: "Catat sholat, puasa, dan bacaan Qur'an dalam satu layar.",
    icon: "checkbox-outline"
  },
  {
    title: "Waktu Sholat & Imsak",
    subtitle: "Hitung mundur ke waktu sholat berikutnya dan jadwal imsakiyah.",
    icon: "time-outline"
  }
];

const OnboardingScreen: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const { isDark } = useSettings();
  const colors = isDark ? darkColors : lightColors;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(i);
  };

  const next = () => {
    if (index >= slides.length - 1) {
      AsyncStorage.setItem(STORAGE_KEYS.onboardingSeen, "1").finally(onDone);
      return;
    }
    scrollRef.current?.scrollTo({ x: (index + 1) * width, animated: true });
    setIndex((i) => Math.min(i + 1, slides.length - 1));
  };

  const skip = () => {
    AsyncStorage.setItem(STORAGE_KEYS.onboardingSeen, "1").finally(onDone);
  };

  return (
    <LinearGradient colors={["#06110d", "#0c1a14"]} style={styles.flex}>
      <View style={[styles.header, { paddingHorizontal: 24, paddingTop: 20 }]}>
        <Text style={{ color: colors.primary, fontWeight: "800", letterSpacing: 1.4 }}>WELCOME</Text>
        <Pressable onPress={skip}>
          <Text style={{ color: colors.muted, fontWeight: "700" }}>Skip</Text>
        </Pressable>
      </View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {slides.map((s, idx) => (
          <View key={idx} style={[styles.slide, { width }]}>
            <View style={[styles.iconWrap, { backgroundColor: colors.badge }]}>
              <Ionicons name={s.icon} size={42} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{s.title}</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>{s.subtitle}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i === index ? colors.primary : colors.muted + "55",
                width: i === index ? 26 : 8
              }
            ]}
          />
        ))}
      </View>

      <Pressable
        style={[
          styles.button,
          { backgroundColor: colors.primary, shadowColor: colors.primary }
        ]}
        onPress={next}
      >
        <Text style={{ color: "#0B0F1E", fontWeight: "800", fontSize: 16 }}>
          {index === slides.length - 1 ? "Mulai" : "Next"}
        </Text>
      </Pressable>
      <View style={{ height: 28 }} />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  slide: {
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 16
  },
  iconWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4
  },
  title: { fontSize: 24, fontWeight: "800", textAlign: "center" },
  subtitle: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 12
  },
  dot: {
    height: 8,
    borderRadius: 4
  },
  button: {
    marginHorizontal: 24,
    marginTop: 18,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 }
  }
});

export default OnboardingScreen;
