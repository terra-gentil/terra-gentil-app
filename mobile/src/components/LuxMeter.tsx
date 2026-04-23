import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface Props {
  porcentagem: number;
  veredito: string;
}

export function LuxMeter({ porcentagem, veredito }: Props) {
  const pct = Math.max(0, Math.min(100, porcentagem));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>☀️ Medidor de Luz da Foto</Text>
      <View style={styles.labels}>
        <Text style={styles.labelText}>Sombra</Text>
        <Text style={styles.labelText}>Luz Difusa</Text>
        <Text style={styles.labelText}>Sol Pleno</Text>
      </View>
      <View style={styles.barBg}>
        <View style={[styles.pointer, { left: `${pct}%` }]} />
      </View>
      <Text style={styles.verdict}>{veredito}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#fcfcfc", borderWidth: 1, borderColor: "#eee", padding: 16, borderRadius: 12, marginBottom: 16 },
  title: { fontSize: 14, fontWeight: "800", color: "#555", textTransform: "uppercase", marginBottom: 12, textAlign: "center" },
  labels: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  labelText: { fontSize: 11, color: "#999" },
  barBg: { height: 14, borderRadius: 7, backgroundColor: "#333", position: "relative", marginBottom: 12 },
  pointer: { width: 0, height: 0, borderLeftWidth: 8, borderRightWidth: 8, borderTopWidth: 12, borderLeftColor: "transparent", borderRightColor: "transparent", borderTopColor: "#000", position: "absolute", top: -14, marginLeft: -8 },
  verdict: { fontSize: 14, fontWeight: "700", color: "#2E7D32", textAlign: "center" },
});
