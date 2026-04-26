import React, { useState, useCallback } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS, FONTS, SIZES, shadowChunky, shadowSoft } from "../../constants/theme";
import { MASCOT_POSES } from "../../assets/mascot";
import { listarConsultas, ConsultaHistorico } from "../../storage/historico";
import TopBar from "./TopBar";
import StreakStrip from "./StreakStrip";
import SectionTitle from "./SectionTitle";
import { useFocusEffect } from "@react-navigation/native";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  saudavel: { label: "Saudavel", color: COLORS.green },
  atencao: { label: "Atencao", color: COLORS.amber },
  doente: { label: "Doente", color: COLORS.coral },
  critico: { label: "Critico", color: COLORS.coralDeep },
  nao_aplicavel: { label: "N/A", color: COLORS.inkMute },
};

const ATALHOS = [
  { icon: "👥", label: "Comunidade", desc: "Em breve", bg: COLORS.coral, deep: COLORS.coralDeep },
  { icon: "🎬", label: "Videos", desc: "Em breve", bg: COLORS.lavender, deep: "#7c3aed" },
  { icon: "📚", label: "Ebooks", desc: "Em breve", bg: COLORS.amber, deep: "#d97706" },
  { icon: "🛍️", label: "Promocoes", desc: "Em breve", bg: COLORS.sky, deep: "#0284c7" },
];

interface HomeScreenProps {
  onTirarFoto: () => void;
  onEscolherGaleria: () => void;
  onSettings?: () => void;
  loading?: boolean;
}

export default function HomeScreen({
  onTirarFoto,
  onEscolherGaleria,
  onSettings,
  loading = false,
}: HomeScreenProps) {
  const [historico, setHistorico] = useState<ConsultaHistorico[]>([]);

  useFocusEffect(
    useCallback(() => {
      listarConsultas(5).then(setHistorico);
    }, [])
  );

  function timeAgo(ts: number): string {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `ha ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `ha ${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `ha ${days} dia${days > 1 ? "s" : ""}`;
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TopBar avatarSource={MASCOT_POSES[0]} badge={0} onAvatarPress={onSettings} />

      {/* Greeting */}
      <View style={styles.greeting}>
        <Text style={styles.greetingTitle}>Ola! 🌱</Text>
        <Text style={styles.greetingSubtitle}>Como estao suas plantinhas hoje?</Text>
      </View>

      {/* Streak */}
      <StreakStrip days={historico.length} badge={historico.length >= 5 ? "Mao Verde" : undefined} />

      {/* Scanner card grande */}
      <View style={styles.scannerCard}>
        <View style={styles.scannerCircleBg1} />
        <View style={styles.scannerCircleBg2} />

        <View style={styles.scannerTop}>
          <View style={styles.scannerMascotWrap}>
            <Image source={MASCOT_POSES[0]} style={styles.scannerMascot} />
          </View>
          <View style={styles.scannerTextWrap}>
            <Text style={styles.scannerTitle}>
              Doutor Gentileza{"\n"}
              <Text style={styles.scannerTitleAccent}>esta pronto!</Text>
            </Text>
            <Text style={styles.scannerDesc}>
              Tire uma foto e em 15s eu descubro tudo da sua planta.
            </Text>
          </View>
        </View>

        <View style={styles.scannerButtons}>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={onTirarFoto}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.btnPrimaryText}>📷  Tirar foto</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnOutline}
            onPress={onEscolherGaleria}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.btnOutlineText}>🖼️ Galeria</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Atalhos rapidos */}
      <SectionTitle title="Atalhos rapidos" />
      <View style={styles.atalhosGrid}>
        {ATALHOS.map((a) => (
          <View key={a.label} style={styles.atalhoCard}>
            <View style={[styles.atalhoIconWrap, { backgroundColor: a.bg, shadowColor: a.deep, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 }]}>
              <Text style={styles.atalhoIcon}>{a.icon}</Text>
            </View>
            <Text style={styles.atalhoLabel}>{a.label}</Text>
            <Text style={styles.atalhoDesc}>{a.desc}</Text>
          </View>
        ))}
      </View>

      {/* Diagnosticos recentes */}
      {historico.length > 0 && (
        <>
          <SectionTitle title="Diagnosticos recentes" action="Ver tudo →" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentesRow}>
            {historico.map((h) => {
              const st = STATUS_LABELS[h.estado_saude] || STATUS_LABELS.nao_aplicavel;
              return (
                <View key={h.id} style={styles.recenteCard}>
                  <View style={[styles.recenteImageWrap, { backgroundColor: st.color + "20" }]}>
                    {h.imageUri && <Image source={{ uri: h.imageUri }} style={styles.recenteImage} />}
                    <View style={styles.recenteStatusPill}>
                      <View style={[styles.recenteDot, { backgroundColor: st.color }]} />
                      <Text style={[styles.recenteStatusText, { color: st.color }]}>{st.label}</Text>
                    </View>
                  </View>
                  <View style={styles.recenteBody}>
                    <Text style={styles.recenteName} numberOfLines={1}>{h.nome_popular}</Text>
                    <Text style={styles.recenteTime}>{timeAgo(h.timestamp)}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </>
      )}

      <View style={{ height: 100 }} />
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
  greeting: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 16,
  },
  greetingTitle: {
    fontFamily: FONTS.displayBlack,
    fontSize: SIZES.xxl,
    color: COLORS.greenDark,
    lineHeight: 32,
  },
  greetingSubtitle: {
    fontFamily: FONTS.body,
    fontSize: SIZES.body,
    color: COLORS.inkSoft,
    marginTop: 4,
  },

  // Scanner card
  scannerCard: {
    backgroundColor: COLORS.greenSoft,
    borderRadius: 28,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 18,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: COLORS.green,
    overflow: "hidden",
    ...shadowChunky(COLORS.greenDeep + "40"),
  },
  scannerCircleBg1: {
    position: "absolute",
    right: -30,
    top: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(34,197,94,0.18)",
  },
  scannerCircleBg2: {
    position: "absolute",
    right: 30,
    bottom: -10,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(251,111,146,0.25)",
  },
  scannerTop: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  scannerMascotWrap: {
    width: 96,
    height: 96,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#fff",
    ...shadowChunky(COLORS.greenDeep + "40"),
  },
  scannerMascot: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  scannerTextWrap: {
    flex: 1,
  },
  scannerTitle: {
    fontFamily: FONTS.displayBlack,
    fontSize: SIZES.lg,
    color: COLORS.greenDark,
    lineHeight: 22,
  },
  scannerTitleAccent: {
    color: COLORS.coralDeep,
  },
  scannerDesc: {
    fontFamily: FONTS.body,
    fontSize: SIZES.sm,
    color: COLORS.inkSoft,
    marginTop: 6,
    lineHeight: 18,
  },
  scannerButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  btnPrimary: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
    ...shadowChunky(COLORS.greenDeep),
  },
  btnPrimaryText: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.body + 1,
    color: "#fff",
  },
  btnOutline: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.greenDeep + "40",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  btnOutlineText: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.smPlus,
    color: COLORS.greenDark,
  },

  // Atalhos
  atalhosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    rowGap: 10,
  },
  atalhoCard: {
    width: "48.5%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    ...shadowSoft(),
  },
  atalhoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  atalhoIcon: {
    fontSize: 22,
  },
  atalhoLabel: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.body,
    color: COLORS.ink,
    marginTop: 10,
  },
  atalhoDesc: {
    fontFamily: FONTS.body,
    fontSize: SIZES.xs,
    color: COLORS.inkSoft,
    marginTop: 2,
  },

  // Diagnosticos recentes
  recentesRow: {
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 18,
  },
  recenteCard: {
    width: 150,
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    ...shadowSoft(),
  },
  recenteImageWrap: {
    height: 90,
  },
  recenteImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  recenteStatusPill: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
  },
  recenteDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  recenteStatusText: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: 10,
  },
  recenteBody: {
    padding: 12,
  },
  recenteName: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.smPlus,
    color: COLORS.ink,
  },
  recenteTime: {
    fontFamily: FONTS.body,
    fontSize: SIZES.xs,
    color: COLORS.inkMute,
    marginTop: 2,
  },
});
