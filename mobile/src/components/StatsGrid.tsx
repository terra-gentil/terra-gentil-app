import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface Props {
  nivelLuzLabel: string;
  regaCondicao: string;
  regaDias: number;
  temperaturaIdeal: string;
  nivelDificuldade: string;
}

const DIFICULDADE_LABEL: Record<string, string> = {
  facil: "Facil", medio: "Medio", dificil: "Dificil", nao_aplicavel: "N/A",
};

export function StatsGrid({ nivelLuzLabel, regaCondicao, regaDias, temperaturaIdeal, nivelDificuldade }: Props) {
  return (
    <View style={styles.grid}>
      <View style={styles.box}>
        <Text style={styles.icon}>☀️</Text>
        <Text style={styles.label}>Gosta de</Text>
        <Text style={styles.value}>{nivelLuzLabel}</Text>
      </View>
      <View style={styles.box}>
        <Text style={styles.icon}>💧</Text>
        <Text style={styles.label}>Rega</Text>
        <Text style={styles.value}>{regaCondicao || `A cada ${regaDias} dias`}</Text>
      </View>
      <View style={styles.box}>
        <Text style={styles.icon}>🌡️</Text>
        <Text style={styles.label}>Temperatura</Text>
        <Text style={styles.value}>{temperaturaIdeal || "Ambiente"}</Text>
      </View>
      <View style={styles.box}>
        <Text style={styles.icon}>💪</Text>
        <Text style={styles.label}>Nivel</Text>
        <Text style={styles.value}>{DIFICULDADE_LABEL[nivelDificuldade] || nivelDificuldade}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  box: { flex: 1, minWidth: "45%", backgroundColor: "#f8f9fa", padding: 12, borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: "#eee" },
  icon: { fontSize: 24, marginBottom: 4 },
  label: { fontSize: 13, color: "#999", textTransform: "uppercase", fontWeight: "700", marginBottom: 4 },
  value: { fontSize: 15, color: "#333", fontWeight: "700", textAlign: "center", lineHeight: 18 },
});
