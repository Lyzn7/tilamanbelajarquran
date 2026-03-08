import MarkdownText from "@/components/MarkdownText";
import { useSettings } from "@/store/SettingsProvider";
import { darkColors, lightColors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useChatLimit } from "../hooks/useChatLimit";

const SYSTEM_PROMPT = `Kamu adalah asisten Islam bernama "Ustadz AI". Aturan wajib yang TIDAK BOLEH dilanggar:

1. HANYA jawab pertanyaan seputar Islam (akidah, fiqih, akhlak, sejarah Islam, ibadah, muamalah, dll). Tolak dengan sopan jika pertanyaan bukan tentang Islam.

2. Setiap klaim atau hukum Islam WAJIB disertai minimal satu sumber berikut:
   - Al-Quran: sebutkan nama surah dan nomor ayat (contoh: QS. Al-Baqarah: 183)
   - Hadith: sebutkan nama kitab, nama perawi, dan nomor hadith jika ada (contoh: HR. Bukhari no. 8)
   - Tafsir: sebutkan nama kitab tafsir dan nama ulama pengarangnya (contoh: Tafsir Al-Misbah karya Prof. Quraish Shihab)
   - Pendapat ulama: sebutkan nama ulama, mazhab, dan kitab rujukan (contoh: Imam Syafi'i dalam Al-Umm)
   - Website Islam terpercaya: sebutkan nama situs dan URL (contoh: islamqa.info - https://islamqa.info/id/...)

3. Jika tidak menemukan sumber yang jelas dan kuat, katakan dengan jujur:
   "Saya tidak menemukan sumber yang cukup kuat untuk pertanyaan ini. Silakan tanyakan langsung kepada ustadz atau ulama terpercaya."

4. JANGAN PERNAH mengarang atau memalsukan sumber. Lebih baik mengaku tidak tahu daripada memberikan informasi yang tidak benar (halu).

5. Prioritaskan pendapat jumhur (mayoritas) ulama. Jika ada perbedaan pendapat antara mazhab atau ulama, sebutkan perbedaan tersebut dengan adil.

6. Jawab dalam Bahasa Indonesia yang mudah dipahami oleh orang awam. Sertakan istilah Arab jika perlu, dengan penjelasannya.

7. Mulai setiap jawaban dengan Bismillah jika pertanyaannya membutuhkan jawaban panjang.`;

interface Message {
    id: string;
    role: "user" | "model";
    text: string;
}

const TypingIndicator = ({ color }: { color: string }) => {
    return (
        <View style={styles.typingWrap}>
            <Text style={[styles.typingText, { color }]}>Ustadz AI sedang menulis</Text>
            <ActivityIndicator size="small" color={color} style={{ marginLeft: 6 }} />
        </View>
    );
};

export default function ChatbotScreen() {
    const { isDark } = useSettings();
    const colors = isDark ? darkColors : lightColors;
    const { remaining, canSend, increment, loaded } = useChatLimit();

    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "model",
            text: "Assalamu'alaikum! Saya Ustadz AI 🕌\n\nSaya siap menjawab pertanyaan seputar Islam berdasarkan Al-Quran, Hadith, Tafsir, dan pendapat ulama.\n\nApa yang ingin Anda tanyakan?",
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const sendMessage = async () => {
        const text = input.trim();
        if (!text || isLoading || !canSend) return;

        const userMsg: Message = { id: Date.now().toString(), role: "user", text };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        // Increment limit BEFORE sending (pessimistic — mencegah spam jika error)
        await increment();

        try {
            const apiKey = process.env.EXPO_PUBLIC_GEMINI_KEY;
            const model = process.env.EXPO_PUBLIC_GEMINI_MODEL ?? "gemini-flash-latest";

            // Bangun conversation history untuk konteks multi-turn
            const historyContents = messages
                .filter((m) => m.id !== "welcome")
                .map((m) => ({
                    role: m.role,
                    parts: [{ text: m.text }],
                }));

            const body = {
                system_instruction: {
                    parts: [{ text: SYSTEM_PROMPT }],
                },
                contents: [
                    ...historyContents,
                    { role: "user", parts: [{ text }] },
                ],
                generationConfig: {
                    temperature: 0.3, // rendah = lebih konsisten, kurang halu
                    maxOutputTokens: 1024,
                },
                safetySettings: [
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                ],
            };

            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                }
            );

            const json = await res.json();

            if (!res.ok) {
                throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
            }

            const aiText: string =
                json?.candidates?.[0]?.content?.parts?.[0]?.text ??
                "Maaf, tidak ada respons dari server. Coba lagi.";

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "model",
                text: aiText,
            };
            setMessages((prev) => [...prev, aiMsg]);
        } catch (err) {
            const errMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "model",
                text: `⚠️ Gagal terhubung ke server. Pastikan koneksi internet Anda aktif.\n\nDetail: ${(err as Error).message}`,
            };
            setMessages((prev) => [...prev, errMsg]);
        } finally {
            setIsLoading(false);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
    };

    const renderItem = ({ item }: { item: Message }) => {
        const isUser = item.role === "user";
        return (
            <View style={[styles.bubbleWrap, isUser && styles.bubbleWrapUser]}>
                {!isUser && (
                    <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                        <Text style={styles.avatarText}>AI</Text>
                    </View>
                )}
                <View
                    style={[
                        styles.bubble,
                        isUser
                            ? [styles.bubbleUser, { backgroundColor: colors.primary }]
                            : [styles.bubbleAI, { backgroundColor: colors.card, borderColor: colors.border }],
                    ]}
                >
                    {isUser ? (
                        <Text style={[styles.bubbleText, { color: "#fff" }]}>{item.text}</Text>
                    ) : (
                        <MarkdownText content={item.text} color={colors.text} fontSize={14} />
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
            {/* Header — di luar KeyboardAvoidingView agar tidak ikut naik */}
            <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>🕌 Ustadz AI</Text>
                    <Text style={[styles.headerSub, { color: colors.muted }]}>
                        Tanya seputar Islam dengan sumber jelas
                    </Text>
                </View>
                <View style={[styles.limitBadge, { backgroundColor: colors.badge, borderColor: colors.border }]}>
                    <Ionicons name="chatbubble-ellipses" size={12} color={remaining > 0 ? colors.primary : colors.muted} />
                    <Text style={[styles.limitText, { color: remaining > 0 ? colors.primary : colors.muted }]}>
                        {loaded ? `${remaining}/5 hari ini` : "..."}
                    </Text>
                </View>
            </View>

            {/* KeyboardAvoidingView membungkus chat + disclaimer + input */}
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 40}
            >
                {/* Chat list */}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                    ListFooterComponent={isLoading ? <TypingIndicator color={colors.primary} /> : null}
                    keyboardShouldPersistTaps="handled"
                />

                {/* Disclaimer */}
                <View style={[styles.disclaimer, { backgroundColor: colors.badge, borderColor: colors.border }]}>
                    <Ionicons name="warning-outline" size={12} color={colors.muted} />
                    <Text style={[styles.disclaimerText, { color: colors.muted }]}>
                        AI dapat membuat kesalahan. Pendapat ulama &amp; fatwa resmi lebih diutamakan. Selalu verifikasi ke ustadz terpercaya.
                    </Text>
                </View>

                {/* Input area */}
                {!canSend && loaded ? (
                    <View style={[styles.limitReached, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Ionicons name="time-outline" size={18} color={colors.muted} />
                        <Text style={[styles.limitReachedText, { color: colors.muted }]}>
                            Batas harian habis (0/5). Coba lagi besok. 🌙
                        </Text>
                    </View>
                ) : (
                    <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <TextInput
                            style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
                            placeholder="Tanyakan seputar Islam..."
                            placeholderTextColor={colors.muted}
                            value={input}
                            onChangeText={setInput}
                            multiline
                            maxLength={500}
                            editable={!isLoading}
                            returnKeyType="send"
                            onSubmitEditing={sendMessage}
                            blurOnSubmit={false}
                        />
                        <Pressable
                            style={[
                                styles.sendBtn,
                                { backgroundColor: input.trim() && !isLoading ? colors.primary : colors.badge },
                            ]}
                            onPress={sendMessage}
                            disabled={!input.trim() || isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Ionicons name="send" size={18} color={input.trim() ? "#fff" : colors.muted} />
                            )}
                        </Pressable>
                    </View>
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    headerTitle: { fontSize: 18, fontWeight: "800" },
    headerSub: { fontSize: 12, marginTop: 2 },
    limitBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1,
    },
    limitText: { fontSize: 12, fontWeight: "700" },
    listContent: { padding: 16, paddingBottom: 8, gap: 12 },
    bubbleWrap: { flexDirection: "row", alignItems: "flex-end", gap: 8, maxWidth: "85%" },
    bubbleWrapUser: { alignSelf: "flex-end", flexDirection: "row-reverse" },
    avatar: {
        width: 32, height: 32, borderRadius: 16,
        alignItems: "center", justifyContent: "center",
    },
    avatarText: { color: "#fff", fontSize: 10, fontWeight: "800" },
    bubble: { borderRadius: 16, padding: 12, flexShrink: 1 },
    bubbleUser: { borderBottomRightRadius: 4 },
    bubbleAI: { borderWidth: 1, borderBottomLeftRadius: 4 },
    bubbleText: { fontSize: 14, lineHeight: 21 },
    typingWrap: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 8 },
    typingText: { fontSize: 13, fontStyle: "italic" },
    disclaimer: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderTopWidth: 1,
    },
    disclaimerText: { fontSize: 11, flex: 1, lineHeight: 16 },
    inputRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 8,
        padding: 10,
        borderTopWidth: 1,
    },
    input: {
        flex: 1, borderRadius: 20, paddingHorizontal: 14,
        paddingVertical: 10, fontSize: 14, maxHeight: 120,
    },
    sendBtn: {
        width: 42, height: 42, borderRadius: 21,
        alignItems: "center", justifyContent: "center",
    },
    limitReached: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        padding: 16,
        borderTopWidth: 1,
    },
    limitReachedText: { fontSize: 14 },
});
