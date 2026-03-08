import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface Props {
    content: string;
    color: string;
    fontSize?: number;
}

/**
 * Renderer sederhana untuk markdown dasar dari Gemini:
 * ### Heading, ## Heading, **bold**, *italic*, - bullet, numbered list
 */
const MarkdownText: React.FC<Props> = ({ content, color, fontSize = 14 }) => {
    const lineHeight = fontSize * 1.6;

    const renderInline = (text: string, key: string) => {
        // Split by **bold** dan *italic* sekaligus
        const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
        return (
            <Text key={key} style={{ color, fontSize, lineHeight }}>
                {parts.map((part, i) => {
                    if (part.startsWith("**") && part.endsWith("**")) {
                        return (
                            <Text key={i} style={{ fontWeight: "800" }}>
                                {part.slice(2, -2)}
                            </Text>
                        );
                    }
                    if (part.startsWith("*") && part.endsWith("*")) {
                        return (
                            <Text key={i} style={{ fontStyle: "italic" }}>
                                {part.slice(1, -1)}
                            </Text>
                        );
                    }
                    return <Text key={i}>{part}</Text>;
                })}
            </Text>
        );
    };

    const lines = content.split("\n");
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        // H3: ### ...
        if (line.startsWith("### ")) {
            elements.push(
                <Text key={i} style={[styles.h3, { color, fontSize: fontSize + 2 }]}>
                    {line.slice(4).replace(/\*\*/g, "")}
                </Text>
            );
        }
        // H2: ## ...
        else if (line.startsWith("## ")) {
            elements.push(
                <Text key={i} style={[styles.h2, { color, fontSize: fontSize + 3 }]}>
                    {line.slice(3).replace(/\*\*/g, "")}
                </Text>
            );
        }
        // H1: # ...
        else if (line.startsWith("# ")) {
            elements.push(
                <Text key={i} style={[styles.h1, { color, fontSize: fontSize + 4 }]}>
                    {line.slice(2).replace(/\*\*/g, "")}
                </Text>
            );
        }
        // Bullet: - ... atau * ...
        else if (/^[\-\*] /.test(line)) {
            elements.push(
                <View key={i} style={styles.bulletRow}>
                    <Text style={{ color, fontSize, lineHeight }}>{"• "}</Text>
                    {renderInline(line.slice(2), `inline-${i}`)}
                </View>
            );
        }
        // Numbered list: 1. ...
        else if (/^\d+\. /.test(line)) {
            const match = line.match(/^(\d+)\. (.*)/);
            if (match) {
                elements.push(
                    <View key={i} style={styles.bulletRow}>
                        <Text style={{ color, fontSize, lineHeight, minWidth: 22 }}>{match[1]}. </Text>
                        {renderInline(match[2], `inline-${i}`)}
                    </View>
                );
            }
        }
        // Baris kosong → spasi kecil
        else if (line.trim() === "") {
            elements.push(<View key={i} style={{ height: 6 }} />);
        }
        // Teks biasa
        else {
            elements.push(renderInline(line, `line-${i}`));
        }

        i++;
    }

    return <View style={styles.wrap}>{elements}</View>;
};

const styles = StyleSheet.create({
    wrap: { gap: 2 },
    h1: { fontWeight: "900", marginTop: 6, marginBottom: 2 },
    h2: { fontWeight: "800", marginTop: 4, marginBottom: 2 },
    h3: { fontWeight: "700", marginTop: 4, marginBottom: 2 },
    bulletRow: { flexDirection: "row", alignItems: "flex-start" },
});

export default MarkdownText;
