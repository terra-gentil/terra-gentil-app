import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface Passo { etapa: string; acao: string; }
interface Props { passos: Passo[]; }

export function Timeline({ passos }: Props) {
  if (!passos || passos.length === 0) return null;
  return (
    <View style={styles.container}>
      {passos.map((passo, idx) => (
        <View key={idx} style={styles.step}>
          <View style={styles.stepLine}>
            <View style={styles.dot} />
            {idx < passos.length - 1 && <View style={styles.line} />}
          </View>
          <View style={styles.stepContent}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{passo.etapa.toUpperCase()}</Text>
            </View>
            <Text style={styles.action}>{passo.acao}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginLeft: 8 },
  step: { flexDirection: "row", marginBottom: 16 },
  stepLine: { alignItems: "center", width: 20, marginRight: 12 },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: "#2E7D32", borderWidth: 3, borderColor: "#fff" },
  line: { width: 2, flex: 1, backgroundColor: "#e0e0e0", marginTop: 2 },
  stepContent: { flex: 1, paddingBottom: 4 },
  badge: { backgroundColor: "#e8f5e9", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, alignSelf: "flex-start", marginBottom: 6 },
  badgeText: { fontSize: 10, color: "#1b5e20", fontWeight: "800" },
  action: { fontSize: 14, color: "#444", lineHeight: 20 },
});
