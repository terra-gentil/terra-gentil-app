import React, { useState, useCallback } from "react";
import {
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { Settings } from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, FONTS, SIZES, RADIUS, SPACING, shadowChunky, shadowSoft } from "../../constants/theme";
import { MASCOT_POSES } from "../../assets/mascot";
import SectionTitle from "./SectionTitle";
import { listarConsultas, limparHistorico, ConsultaHistorico } from "../../storage/historico";
import { resetarWelcome, resetarTutorial } from "../../storage/preferencias";

const YOUTUBE_URL = "https://www.youtube.com/@TerraGentil";
const SITE_URL = "https://terragentil.com.br";

const SCREEN_W = Dimensions.get("window").width;
const GARDEN_CARD_W = (SCREEN_W - SPACING.screenPadding * 2 - 20) / 3;

// Conquistas (alinhado ao figma)
const CONQUISTAS = [
  { emoji: "🌱", name: "Primeira foto", min: 1, color: COLORS.green },
  { emoji: "🔥", name: "7 dias", min: 7, color: COLORS.coral },
  { emoji: "🌻", name: "Mao Verde", min: 15, color: COLORS.amber },
  { emoji: "💚", name: "Comunitaria", min: 30, color: COLORS.lavender },
  { emoji: "🏆", name: "50 plantas", min: 50, color: COLORS.inkMute },
];

// Cores e emojis para cards do jardim (alinhado ao figma)
const GARDEN_ITEMS = [
  { grad: ["#86efac", "#22c55e"] as [string, string], emoji: "🌿" },
  { grad: ["#bae6fd", "#0284c7"] as [string, string], emoji: "🌱" },
  { grad: ["#fde68a", "#f59e0b"] as [string, string], emoji: "🌵" },
  { grad: ["#fbcfe8", "#fb6f92"] as [string, string], emoji: "🌸" },
  { grad: ["#c4b5fd", "#a78bfa"] as [string, string], emoji: "💐" },
  { grad: ["#86efac", "#15803d"] as [string, string], emoji: "🌿" },
];

// Nivel baseado no total
function getNivelInfo(total: number) {
  if (total >= 50) return { nivel: 5, nome: "Doutor das Plantas", progresso: 1, falta: 0 };
  if (total >= 25) return { nivel: 4, nome: "Mao Verde", progresso: (total - 25) / 25, falta: 50 - total };
  if (total >= 10) return { nivel: 3, nome: "Jardineiro", progresso: (total - 10) / 15, falta: 25 - total };
  if (total >= 3) return { nivel: 2, nome: "Broto", progresso: (total - 3) / 7, falta: 10 - total };
  return { nivel: 1, nome: "Semente", progresso: total / 3, falta: 3 - total };
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [historico, setHistorico] = useState<ConsultaHistorico[]>([]);

  useFocusEffect(
    useCallback(() => {
      listarConsultas().then(setHistorico);
    }, [])
  );

  const total = historico.length;
  const { nivel, nome, progresso, falta } = getNivelInfo(total);
  const especiesUnicas = new Set(historico.map((h) => h.especie_identificada)).size;

  function handleLimparHistorico() {
    Alert.alert(
      "Limpar historico",
      "Vou apagar todas as consultas guardadas neste celular. Essa acao nao tem volta. Tem certeza?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apagar tudo",
          style: "destructive",
          onPress: async () => {
            await limparHistorico();
            setHistorico([]);
          },
        },
      ],
    );
  }

  function handleResetWelcome() {
    Alert.alert(
      "Ver boas-vindas",
      "A tela de boas-vindas e o tutorial vao aparecer na proxima vez que voce abrir o app.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sim",
          onPress: async () => {
            await resetarWelcome();
            await resetarTutorial();
            Alert.alert("Pronto!", "Feche o app e abra de novo.");
          },
        },
      ],
    );
  }

  function handleResetTutorial() {
    Alert.alert(
      "Ver tutorial",
      "O tutorial vai aparecer na proxima vez que voce abrir o app.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Sim", onPress: () => resetarTutorial().then(() => Alert.alert("Pronto!", "Feche o app e abra de novo.")) },
      ],
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero cover */}
        <LinearGradient colors={["#86efac", "#22c55e", "#15803d"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.cover, { paddingTop: insets.top }]}>
          <View style={styles.coverCircle1} />
          <View style={styles.coverCircle2} />
          <View style={styles.coverWave} />
          <TouchableOpacity style={[styles.settingsBtn, { top: insets.top + 10 }]} onPress={handleResetWelcome} activeOpacity={0.8}>
            <Settings size={20} color={COLORS.greenDark} />
          </TouchableOpacity>
        </LinearGradient>

        {/* Profile card overlapping */}
        <View style={styles.profileCardWrap}>
          <View style={styles.profileCard}>
            <View style={styles.profileTop}>
              <View style={styles.avatarRing}>
                <View style={styles.avatarWrap}>
                  <Image source={MASCOT_POSES[0]} style={styles.avatar} />
                </View>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>Meu Jardim</Text>
                <Text style={styles.profileBio}>{especiesUnicas} especie{especiesUnicas !== 1 ? "s" : ""} diferentes</Text>
              </View>
            </View>

            <Text style={styles.profileDesc}>
              🌱 Seu Doutor das Plantas de bolso. Cuide com carinho, a planta agradece 💚
            </Text>

            {/* Stats row */}
            <View style={styles.statsRow}>
              {[
                { n: String(total), l: "Diagnosticos" },
                { n: String(especiesUnicas), l: "Especies" },
                { n: String(CONQUISTAS.filter((c) => total >= c.min).length), l: "Selos" },
              ].map((s, i) => (
                <View key={i} style={styles.statCell}>
                  <Text style={styles.statNum}>{s.n}</Text>
                  <Text style={styles.statLabel}>{s.l}</Text>
                </View>
              ))}
            </View>

            {/* Buttons */}
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.btnPrimary} onPress={handleResetTutorial} activeOpacity={0.8}>
                <Text style={styles.btnPrimaryText}>Editar perfil</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnOutline} onPress={handleLimparHistorico} activeOpacity={0.8}>
                <Text style={styles.btnOutlineText}>Compartilhar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Streak & level */}
        <View style={styles.streakWrap}>
          <LinearGradient colors={["#fde68a", "#fbbf24"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.streakCard}>
            <Text style={styles.streakEmoji}>{"🔥"}</Text>
            <View style={styles.streakInfo}>
              <Text style={styles.streakTitle}>{nome} . Nivel {nivel}</Text>
              <View style={styles.streakBarBg}>
                <View style={[styles.streakBarFill, { width: `${Math.min(progresso * 100, 100)}%` }]} />
              </View>
              <Text style={styles.streakSub}>
                {falta > 0 ? `Faltam ${falta} cuidados pro proximo nivel 🌳` : "Nivel maximo! 🌳"}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Conquistas */}
        <SectionTitle title="🏅 Conquistas" action="Ver tudo →" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.conquistasRow}>
          {CONQUISTAS.map((c, i) => {
            const got = total >= c.min;
            return (
              <View key={i} style={[styles.conquistaCard, !got && styles.conquistaLocked]}>
                <View style={[
                  styles.conquistaCircle,
                  { backgroundColor: got ? c.color + "20" : COLORS.divider },
                  got && { borderBottomWidth: 3, borderBottomColor: c.color + "40", shadowColor: c.color + "40", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 },
                ]}>
                  <Text style={styles.conquistaEmoji}>{c.emoji}</Text>
                </View>
                <Text style={styles.conquistaName}>{c.name}</Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Meu jardim — grid 3 colunas */}
        <SectionTitle title="🪴 Meu jardim" action="Adicionar +" actionColor={COLORS.green} />
        <View style={styles.gardenGrid}>
          {historico.slice(0, 5).map((h, i) => {
            const item = GARDEN_ITEMS[i % GARDEN_ITEMS.length];
            return (
              <View key={h.id} style={[styles.gardenCard, { width: GARDEN_CARD_W }]}>
                {h.imageUri ? (
                  <Image source={{ uri: h.imageUri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                ) : (
                  <LinearGradient colors={item.grad} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                )}
                <View style={styles.gardenOverlay} />
                <Text style={styles.gardenEmoji}>{item.emoji}</Text>
                <Text style={styles.gardenName}>{h.nome_popular}</Text>
              </View>
            );
          })}
          {/* Card "+ Nova" */}
          <View style={[styles.gardenCardEmpty, { width: GARDEN_CARD_W }]}>
            <Text style={styles.gardenEmptyPlus}>➕</Text>
            <Text style={styles.gardenEmptyText}>+ Nova</Text>
          </View>
        </View>

        {/* Links */}
        <SectionTitle title="Terra Gentil" />
        <View style={styles.linksWrap}>
          <TouchableOpacity style={styles.linkCard} onPress={() => Linking.openURL(YOUTUBE_URL)} activeOpacity={0.7}>
            <Text style={styles.linkEmoji}>{"📺"}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.linkTitle}>Canal no YouTube</Text>
              <Text style={styles.linkDesc}>Dicas novas toda semana</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkCard} onPress={() => Linking.openURL(SITE_URL)} activeOpacity={0.7}>
            <Text style={styles.linkEmoji}>{"🌐"}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.linkTitle}>terragentil.com.br</Text>
              <Text style={styles.linkDesc}>Visite nosso site</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.versao}>Terra Gentil v1.0.0</Text>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Cover
  cover: {
    height: 180,
    position: "relative",
    overflow: "hidden",
  },
  coverCircle1: {
    position: "absolute",
    left: 30,
    top: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  coverCircle2: {
    position: "absolute",
    right: 20,
    bottom: 40,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  coverWave: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 50,
    backgroundColor: "rgba(20,83,45,0.3)",
    borderTopLeftRadius: 200,
    borderTopRightRadius: 100,
  },
  settingsBtn: {
    position: "absolute",
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Profile card
  profileCardWrap: {
    paddingHorizontal: SPACING.screenPadding,
    marginTop: -56,
  },
  profileCard: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    padding: 18,
    ...shadowSoft(),
  },
  profileTop: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    marginTop: -58,
  },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: COLORS.green,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.green,
  },
  avatarWrap: {
    width: 92,
    height: 92,
    borderRadius: 46,
    overflow: "hidden",
    borderWidth: 4,
    borderColor: "#fff",
    backgroundColor: COLORS.greenLeaf,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  profileInfo: {
    flex: 1,
    paddingBottom: 4,
  },
  profileName: {
    fontFamily: FONTS.displayBlack,
    fontSize: 22,
    color: COLORS.ink,
  },
  profileBio: {
    fontFamily: FONTS.body,
    fontSize: SIZES.sm,
    color: COLORS.inkSoft,
    marginTop: 2,
  },
  profileDesc: {
    fontFamily: FONTS.body,
    fontSize: SIZES.smPlus,
    color: COLORS.inkSoft,
    marginTop: 12,
    lineHeight: 19,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  statCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: COLORS.bg,
    borderRadius: 12,
  },
  statNum: {
    fontFamily: FONTS.displayBlack,
    fontSize: 20,
    color: COLORS.greenDark,
  },
  statLabel: {
    fontFamily: FONTS.body,
    fontSize: SIZES.xs,
    color: COLORS.inkSoft,
    marginTop: 2,
  },

  // Buttons
  btnRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  btnPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.green,
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: COLORS.greenDeep,
    shadowColor: COLORS.greenDeep,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  btnPrimaryText: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.smPlus,
    color: "#fff",
  },
  btnOutline: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.divider,
  },
  btnOutlineText: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.smPlus,
    color: COLORS.greenDark,
  },

  // Streak / Level
  streakWrap: {
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: 14,
  },
  streakCard: {
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 5,
    borderBottomColor: "#d97706",
    shadowColor: "#d97706",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.67,
    shadowRadius: 0,
    elevation: 5,
  },
  streakEmoji: {
    fontSize: 32,
  },
  streakInfo: {
    flex: 1,
  },
  streakTitle: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.smPlus,
    color: "#78350f",
  },
  streakBarBg: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.5)",
    borderRadius: 4,
    marginTop: 6,
    overflow: "hidden",
  },
  streakBarFill: {
    height: "100%",
    backgroundColor: COLORS.green,
    borderRadius: 4,
  },
  streakSub: {
    fontFamily: FONTS.body,
    fontSize: SIZES.xs,
    color: "#92400e",
    marginTop: 4,
  },

  // Conquistas
  conquistasRow: {
    paddingHorizontal: SPACING.screenPadding,
    gap: 10,
    paddingBottom: 18,
  },
  conquistaCard: {
    width: 86,
    padding: 10,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    alignItems: "center",
    ...shadowSoft(),
  },
  conquistaLocked: {
    opacity: 0.5,
  },
  conquistaCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  conquistaEmoji: {
    fontSize: 26,
  },
  conquistaName: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.xs,
    color: COLORS.ink,
    marginTop: 8,
    textAlign: "center",
  },

  // Meu jardim grid
  gardenGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: SPACING.screenPadding,
    paddingBottom: 18,
  },
  gardenCard: {
    aspectRatio: 1 / 1.1,
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
    justifyContent: "flex-end",
    ...shadowSoft(),
  },
  gardenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  gardenEmoji: {
    position: "absolute",
    top: 10,
    left: 10,
    fontSize: 22,
  },
  gardenName: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.sm,
    color: "#fff",
    padding: 10,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  gardenCardEmpty: {
    aspectRatio: 1 / 1.1,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.inkMute,
    backgroundColor: COLORS.divider,
    justifyContent: "center",
    alignItems: "center",
  },
  gardenEmptyPlus: {
    fontFamily: FONTS.displayBlack,
    fontSize: 24,
    color: COLORS.inkSoft,
  },
  gardenEmptyText: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.sm,
    color: COLORS.inkSoft,
    marginTop: 2,
  },

  // Links
  linksWrap: {
    paddingHorizontal: SPACING.screenPadding,
    gap: 8,
    paddingBottom: 14,
  },
  linkCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    ...shadowSoft(),
  },
  linkEmoji: {
    fontSize: 28,
  },
  linkTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: SIZES.body,
    color: COLORS.ink,
  },
  linkDesc: {
    fontFamily: FONTS.body,
    fontSize: SIZES.xs,
    color: COLORS.inkMute,
    marginTop: 1,
  },

  // Versao
  versao: {
    fontFamily: FONTS.body,
    fontSize: SIZES.xs,
    color: COLORS.inkMute,
    textAlign: "center",
    marginTop: 8,
  },
});
