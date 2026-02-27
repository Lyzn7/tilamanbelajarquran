import React, { useMemo, useState } from "react";
import { Modal, Pressable, FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { ColorTheme } from "@/theme";

interface SelectFieldProps {
  label: string;
  value?: string | null;
  options: string[];
  colors: ColorTheme;
  onSelect: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
}

const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  options,
  colors,
  onSelect,
  placeholder = "Pilih...",
  disabled = false,
  loading = false
}) => {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return options;
    return options.filter((opt) => opt.toLowerCase().includes(search.toLowerCase()));
  }, [options, search]);

  const handleSelect = (val: string) => {
    onSelect(val);
    setVisible(false);
    setSearch("");
  };

  return (
    <>
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      <Pressable
        style={[
          styles.field,
          {
            borderColor: colors.border,
            backgroundColor: colors.card,
            opacity: disabled ? 0.6 : 1,
            shadowColor: colors.primary
          }
        ]}
        onPress={() => !disabled && setVisible(true)}
      >
        <Text style={{ color: value ? colors.text : colors.muted, fontWeight: "700" }}>{value || placeholder}</Text>
        <Text style={{ color: colors.muted }}>v</Text>
      </Pressable>

      <Modal transparent animationType="slide" visible={visible} onRequestClose={() => setVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{label}</Text>
              <Pressable onPress={() => setVisible(false)}>
                <Text style={{ color: colors.primary, fontWeight: "700" }}>Tutup</Text>
              </Pressable>
            </View>
            <TextInput
              placeholder="Cari..."
              placeholderTextColor={colors.muted}
              style={[styles.searchInput, { borderColor: colors.border, color: colors.text }]}
              value={search}
              onChangeText={setSearch}
            />
            {loading ? (
              <Text style={{ color: colors.muted, paddingVertical: 12 }}>Memuat...</Text>
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={(item) => item}
                contentContainerStyle={{ paddingBottom: 16 }}
                style={{ maxHeight: 380, alignSelf: "stretch" }}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <Pressable
                    style={[styles.option, { borderColor: colors.border }]}
                    onPress={() => handleSelect(item)}
                  >
                    <Text style={{ color: colors.text }}>{item}</Text>
                  </Pressable>
                )}
                ListEmptyComponent={
                  <Text style={{ color: colors.muted, paddingVertical: 12 }}>Tidak ada opsi ditemukan.</Text>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  label: { fontSize: 13, marginBottom: 6 },
  field: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end"
  },
  modalCard: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  modalTitle: { fontSize: 18, fontWeight: "800" },
  searchInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10
  },
  option: {
    paddingVertical: 12,
    borderBottomWidth: 1
  }
});

export default SelectField;
