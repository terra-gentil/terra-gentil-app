import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { DiagnosticoResponse } from "../../api/diagnostico";
import { COLORS, FONTS, SIZES, shadowChunky, shadowSoft } from "../../constants/theme";
import StatCard from "./StatCard";
import SectionTitle from "./SectionTitle";
import { EbookCard } from "../EbookCard";

const NIVEL_LUZ_LABEL: Record<string, string> = {
  sol_pleno: "Sol pleno",
  meia_sombra: "Meia sombra",
  indireta_brilhante: "Indireta",
  sombra: "Sombra",
  nao_aplicavel: "N/A",
};

const NIVEL_DIFICULDADE_LABEL: Record<string, string> = {
  facil: "Facil",
  medio: "Medio",
  dificil: "Dificil",
  nao_aplicavel: "N/A",
};

const ESTADO_SAUDE_LABEL: Record<string, string> = {
  saudavel: "Saudavel",
  atencao: "Atencao",
  doente: "Doente",
  critico: "Critico",
  nao_aplicavel: "N/A",
};

interface Props {
  imageUri: string;
  resultado: DiagnosticoResponse;
  onVoltar: () => void;
  onNovaConsulta: () => void;
}

export default function DiagnosisScreen({ imageUri, resultado, onVoltar, onNovaConsulta }: Props) {
  const confiancaPct = Math.round(resultado.confianca * 100);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onVoltar} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Diagnostico</Text>
        <View style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>🔖</Text>
        </View>
      </View>

      {/* Hero da planta */}
      <View style={styles.heroWrap}>
        <View style={styles.hero}>
          <Image source={{ uri: imageUri }} style={styles.heroImage} />
          <View style={styles.heroBadge}>
            <View style={styles.heroDot} />
            <Text style={styles.heroBadgeText}>{confiancaPct}% de certeza</Text>
          </View>
        </View>
      </View>

      {/* Identidade */}
      <View style={styles.identity}>
        <Text style={styles.plantName}>{resultado.nome_popular}</Text>
        <Text style={styles.plantSci}>{resultado.especie_identificada}</Text>
      </View>

      {/* Stats grid 2x2 */}
      <View style={styles.statsGrid}>
        <View style={styles.statCell}>
          <StatCard icon="☀️" label="Luz" value={NIVEL_LUZ_LABEL[resultado.nivel_luz] || resultado.nivel_luz} bgColor={COLORS.amberSoft} />
        </View>
        <View style={styles.statCell}>
          <StatCard icon="💧" label="Rega" value={`${resultado.rega_dias} em ${resultado.rega_dias} dias`} bgColor={COLORS.skySoft} />
        </View>
        <View style={styles.statCell}>
          <StatCard icon="🌿" label="Saude" value={ESTADO_SAUDE_LABEL[resultado.estado_saude] || resultado.estado_saude} bgColor={COLORS.greenSoft} />
        </View>
        <View style={styles.statCell}>
          <StatCard icon="⭐" label="Cuidado" value={NIVEL_DIFICULDADE_LABEL[resultado.nivel_dificuldade] || resultado.nivel_dificuldade} bgColor={COLORS.lavenderSoft} />
        </View>
      </View>

      {/* Card de alerta / diagnostico */}
      {resultado.diagnostico_titulo && (
        <View style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <Text style={styles.alertIcon}>⚠️</Text>
            <Text style={styles.alertTitle}>{resultado.diagnostico_titulo}</Text>
          </View>
          <Text style={styles.alertText}>{resultado.diagnostico_explicacao}</Text>
        </View>
      )}

      {/* Toxicidade */}
      {resultado.toxica_para_pets && (
        <View style={styles.toxicCard}>
          <Text style={styles.toxicTitle}>🚨 Toxica pra pets</Text>
          <Text style={styles.toxicText}>{resultado.toxicidade_detalhes}</Text>
        </View>
      )}

      {!resultado.toxica_para_pets && (
        <View style={styles.safeCard}>
          <Text style={styles.safeText}>✅ Segura pra pets e criancas</Text>
        </View>
      )}

      {/* Problemas detectados */}
      {resultado.problemas_detectados.length > 0 && (
        <View style={styles.problemsWrap}>
          <SectionTitle title="⚠️ Problemas detectados" />
          {resultado.problemas_detectados.map((p, idx) => (
            <View key={idx} style={styles.problemItem}>
              <Text style={styles.problemDesc}>{p.descricao}</Text>
              <Text style={styles.problemCause}>Gravidade {p.gravidade}. {p.causa_provavel}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Plano de tratamento */}
      <SectionTitle title="💊 Plano de tratamento" />
      <View style={styles.timelineWrap}>
        {resultado.plano_timeline.map((step, i) => (
          <View key={i} style={styles.timelineRow}>
            <View style={[
              styles.timelineCircle,
              i === 0
                ? { backgroundColor: COLORS.coral }
                : { backgroundColor: "#fff", borderWidth: 2, borderColor: COLORS.divider },
            ]}>
              <Text style={[styles.timelineNum, i === 0 ? { color: "#fff" } : { color: COLORS.inkMute }]}>{i + 1}</Text>
            </View>
            <View style={styles.timelineContent}>
              <Text style={[styles.timelineEtapa, i === 0 ? { color: COLORS.coralDeep } : { color: COLORS.inkMute }]}>{step.etapa}</Text>
              <Text style={styles.timelineAcao}>{step.acao}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Lembrete */}
      {resultado.precisa_retorno && resultado.mensagem_retorno && (
        <View style={styles.reminderCard}>
          <Text style={styles.reminderTitle}>🔔 Lembrete do Doutor</Text>
          <Text style={styles.reminderText}>{resultado.mensagem_retorno}</Text>
        </View>
      )}

      {/* Ebook gift card */}
      <View style={styles.giftCard}>
        <Text style={styles.giftEmoji}>🎁</Text>
        <View style={styles.giftTextWrap}>
          <Text style={styles.giftTitle}>Presente do Doutor!</Text>
          <Text style={styles.giftDesc}>Guia completo da {resultado.nome_popular}, gratis no seu email</Text>
        </View>
      </View>

      <EbookCard nomePopular={resultado.nome_popular} />

      {/* Botoes de acao */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionOutline} onPress={onNovaConsulta} activeOpacity={0.8}>
          <Text style={styles.actionOutlineText}>💬 Pedir 2a opiniao</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionPrimary} onPress={onNovaConsulta} activeOpacity={0.8}>
          <Text style={styles.actionPrimaryText}>📷 Nova consulta</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    paddingBottom: 20,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.divider,
  },
  headerBtnText: {
    fontSize: 20,
  },
  headerTitle: {
    flex: 1,
    fontFamily: FONTS.displayBlack,
    fontSize: SIZES.lg,
    color: COLORS.greenDark,
  },

  // Hero
  heroWrap: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  hero: {
    height: 240,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: COLORS.greenSoft,
    ...shadowChunky(COLORS.greenDeep + "40"),
  },
  heroImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  heroBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  heroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.green,
  },
  heroBadgeText: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.sm,
    color: COLORS.green,
  },

  // Identity
  identity: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  plantName: {
    fontFamily: FONTS.displayBlack,
    fontSize: SIZES.hero,
    color: COLORS.greenDark,
    lineHeight: 32,
  },
  plantSci: {
    fontFamily: FONTS.body,
    fontSize: SIZES.body,
    color: COLORS.inkSoft,
    fontStyle: "italic",
    marginTop: 4,
  },

  // Stats
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  statCell: {
    width: "48%",
  },

  // Alert
  alertCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: COLORS.coralSoft,
    borderRadius: 18,
    padding: 16,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.coral,
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  alertIcon: {
    fontSize: 22,
  },
  alertTitle: {
    fontFamily: FONTS.displayBlack,
    fontSize: SIZES.body + 1,
    color: COLORS.coralDeep,
    flex: 1,
  },
  alertText: {
    fontFamily: FONTS.body,
    fontSize: SIZES.smPlus,
    color: COLORS.ink,
    lineHeight: 20,
  },

  // Toxicidade
  toxicCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: COLORS.coralSoft,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.coralDeep,
  },
  toxicTitle: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.body + 1,
    color: COLORS.coralDeep,
    marginBottom: 6,
  },
  toxicText: {
    fontFamily: FONTS.body,
    fontSize: SIZES.smPlus,
    color: COLORS.ink,
    lineHeight: 20,
  },
  safeCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: COLORS.greenSoft,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
  },
  safeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: SIZES.body,
    color: COLORS.green,
  },

  // Problemas
  problemsWrap: {
    marginBottom: 4,
  },
  problemItem: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: COLORS.amberSoft,
    padding: 12,
    borderRadius: 12,
  },
  problemDesc: {
    fontFamily: FONTS.bodyBold,
    fontSize: SIZES.body,
    color: COLORS.ink,
  },
  problemCause: {
    fontFamily: FONTS.body,
    fontSize: SIZES.smPlus,
    color: COLORS.inkSoft,
    marginTop: 4,
  },

  // Timeline
  timelineWrap: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  timelineRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 10,
  },
  timelineCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  timelineNum: {
    fontFamily: FONTS.displayBlack,
    fontSize: SIZES.body,
  },
  timelineContent: {
    flex: 1,
  },
  timelineEtapa: {
    fontFamily: FONTS.bodyBold,
    fontSize: SIZES.sm,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  timelineAcao: {
    fontFamily: FONTS.body,
    fontSize: SIZES.body,
    color: COLORS.ink,
    marginTop: 2,
  },

  // Lembrete
  reminderCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: COLORS.skySoft,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.sky,
  },
  reminderTitle: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.body,
    color: "#0d47a1",
    marginBottom: 6,
  },
  reminderText: {
    fontFamily: FONTS.body,
    fontSize: SIZES.smPlus,
    color: "#1565c0",
    lineHeight: 20,
  },

  // Gift card
  giftCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: "#fef3c7",
    borderRadius: 22,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.amber,
    shadowColor: COLORS.amber + "40",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  giftEmoji: {
    fontSize: 36,
  },
  giftTextWrap: {
    flex: 1,
  },
  giftTitle: {
    fontFamily: FONTS.displayBlack,
    fontSize: SIZES.body,
    color: "#92400e",
  },
  giftDesc: {
    fontFamily: FONTS.body,
    fontSize: SIZES.sm,
    color: "#78350f",
    marginTop: 2,
  },

  // Action buttons
  actionButtons: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  actionOutline: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.green,
    backgroundColor: "#fff",
    alignItems: "center",
    shadowColor: COLORS.greenDeep + "40",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  actionOutlineText: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.body,
    color: COLORS.greenDark,
  },
  actionPrimary: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: COLORS.green,
    alignItems: "center",
    ...shadowChunky(COLORS.greenDeep),
  },
  actionPrimaryText: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.body,
    color: "#fff",
  },
});
