import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { DiagnosticoResponse } from "../api/diagnostico";
import { EbookCard } from "./EbookCard";
import { LuxMeter } from "./LuxMeter";
import { StatsGrid } from "./StatsGrid";
import { Timeline } from "./Timeline";

const NIVEL_LUZ_LABEL: Record<string, string> = {
  sol_pleno: "Sol pleno", meia_sombra: "Meia sombra",
  indireta_brilhante: "Luz indireta", sombra: "Sombra", nao_aplicavel: "N/A",
};

interface Props {
  imageUri: string;
  resultado: DiagnosticoResponse;
  onNovaConsulta: () => void;
}

export function ResultCard({ imageUri, resultado, onNovaConsulta }: Props) {
  return (
    <View style={styles.wrapper}>
      <Image source={{ uri: imageUri }} style={styles.userImg} />

      <View style={styles.header}>
        <Text style={styles.plantName}>{resultado.nome_popular}</Text>
        <Text style={styles.plantSci}>Tambem chamada de {resultado.especie_identificada}</Text>
        <Text style={styles.confidence}>Tenho {Math.round(resultado.confianca * 100)}% de certeza</Text>
      </View>

      {resultado.diagnostico_titulo && (
        <View style={styles.diagSection}>
          <Text style={styles.diagTitle}>{resultado.diagnostico_titulo}</Text>
          <Text style={styles.diagText}>{resultado.diagnostico_explicacao}</Text>
        </View>
      )}

      <LuxMeter porcentagem={resultado.luz_porcentagem} veredito={resultado.luz_veredito} />

      {resultado.toxica_para_pets && (
        <View style={styles.toxicBox}>
          <Text style={styles.toxicTitle}>🚨 Cuidado com pets e criancas pequenas</Text>
          <Text style={styles.toxicText}>{resultado.toxicidade_detalhes}</Text>
        </View>
      )}

      {!resultado.toxica_para_pets && (
        <View style={styles.safeBox}>
          <Text style={styles.safeText}>✅ Seguro para pets e criancas</Text>
        </View>
      )}

      <StatsGrid
        nivelLuzLabel={NIVEL_LUZ_LABEL[resultado.nivel_luz] || resultado.nivel_luz}
        regaCondicao={resultado.rega_condicao}
        regaDias={resultado.rega_dias}
        temperaturaIdeal={resultado.temperatura_ideal}
        nivelDificuldade={resultado.nivel_dificuldade}
      />

      {resultado.problemas_detectados.length > 0 && (
        <View style={styles.problemsSection}>
          <Text style={styles.sectionTitle}>⚠️ Problemas detectados</Text>
          {resultado.problemas_detectados.map((p, idx) => (
            <View key={idx} style={styles.problemItem}>
              <Text style={styles.problemDesc}>{p.descricao}</Text>
              <Text style={styles.problemCause}>Gravidade {p.gravidade}. {p.causa_provavel}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.planSection}>
        <Text style={styles.sectionTitle}>💊 Plano de Tratamento</Text>
        {resultado.plano_tratamento && (
          <Text style={styles.planSummary}>{resultado.plano_tratamento}</Text>
        )}
        <Timeline passos={resultado.plano_timeline} />
      </View>

      {resultado.precisa_retorno && resultado.mensagem_retorno && (
        <View style={styles.reminder}>
          <Text style={styles.reminderTitle}>🔔 Lembrete do Doutor</Text>
          <Text style={styles.reminderText}>{resultado.mensagem_retorno}</Text>
        </View>
      )}

      <EbookCard nomePopular={resultado.nome_popular} />

      <TouchableOpacity style={styles.primaryButton} onPress={onNovaConsulta}>
        <Text style={styles.primaryButtonText}>📷 Nova Consulta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginTop: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  userImg: { width: "100%", height: 240, borderRadius: 12, marginBottom: 16, resizeMode: "cover" },
  header: { alignItems: "center", paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#eee", marginBottom: 16 },
  plantName: { fontSize: 24, fontWeight: "800", color: "#1a1a1a" },
  plantSci: { fontSize: 14, color: "#888", fontStyle: "italic", marginTop: 4 },
  confidence: { fontSize: 13, color: "#2E7D32", marginTop: 8, fontWeight: "600" },
  diagSection: { backgroundColor: "#fff8e1", borderLeftWidth: 5, borderLeftColor: "#ffab00", padding: 16, borderRadius: 12, marginBottom: 16 },
  diagTitle: { fontSize: 17, fontWeight: "800", color: "#e65100", marginBottom: 8 },
  diagText: { fontSize: 14, color: "#5d4037", lineHeight: 20 },
  toxicBox: { backgroundColor: "#ffebee", borderLeftWidth: 5, borderLeftColor: "#d32f2f", padding: 16, borderRadius: 12, marginBottom: 16 },
  toxicTitle: { color: "#d32f2f", fontWeight: "800", fontSize: 15, marginBottom: 8 },
  toxicText: { fontSize: 13, color: "#555", lineHeight: 20 },
  safeBox: { backgroundColor: "#e8f5e9", borderWidth: 1, borderColor: "#c8e6c9", padding: 12, borderRadius: 12, marginBottom: 16, alignItems: "center" },
  safeText: { color: "#2e7d32", fontWeight: "700", fontSize: 14 },
  problemsSection: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#1b5e20", marginBottom: 12 },
  problemItem: { backgroundColor: "#fff8e1", padding: 12, borderRadius: 8, marginBottom: 8 },
  problemDesc: { fontSize: 14, fontWeight: "700", color: "#424242" },
  problemCause: { fontSize: 13, color: "#666", marginTop: 4 },
  planSection: { marginBottom: 16 },
  planSummary: { fontSize: 14, color: "#555", lineHeight: 20, marginBottom: 16, fontStyle: "italic" },
  reminder: { backgroundColor: "#e3f2fd", borderWidth: 1, borderColor: "#bbdefb", padding: 16, borderRadius: 12, marginBottom: 16 },
  reminderTitle: { fontSize: 15, fontWeight: "800", color: "#0d47a1", marginBottom: 6 },
  reminderText: { fontSize: 14, color: "#1565c0" },
  primaryButton: { backgroundColor: "#2E7D32", paddingVertical: 16, borderRadius: 12, alignItems: "center", marginTop: 8, minHeight: 56, justifyContent: "center" },
  primaryButtonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
