import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { COLORS, FONTS, SIZES, shadowSoft } from "../../constants/theme";
import {
  SELOS,
  CATEGORIAS_SELOS,
  ConquistaStats,
  SeloCategoria,
} from "../../storage/conquistas";
import { ConsultaHistorico } from "../../storage/historico";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const CONFETTI_EMOJIS = ["🌱", "🌿", "🌸", "🍀", "🌻", "💚", "⭐", "✨"];
const CAT_COLORS: Record<SeloCategoria, string> = {
  Botanico: COLORS.green,
  Cuidador: COLORS.coral,
  Dedicacao: COLORS.amber,
  Comunidade: COLORS.lavender,
};
const SAUDE_EMOJI: Record<string, string> = {
  saudavel: "💚",
  atencao: "💛",
  doente: "🟠",
  critico: "🔴",
  nao_aplicavel: "⚪",
};

interface ConfettiPiece {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  emoji: string;
}

function useConfetti(active: boolean) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (!active) { setPieces([]); return; }
    const novos: ConfettiPiece[] = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: new Animated.Value(Math.random() * SCREEN_W),
      y: new Animated.Value(-40),
      opacity: new Animated.Value(1),
      emoji: CONFETTI_EMOJIS[i % CONFETTI_EMOJIS.length],
    }));
    setPieces(novos);

    novos.forEach((p, i) => {
      Animated.sequence([
        Animated.delay(i * 60),
        Animated.parallel([
          Animated.timing(p.y, { toValue: SCREEN_H * 0.6, duration: 1400, useNativeDriver: true }),
          Animated.timing(p.opacity, { toValue: 0, duration: 1400, useNativeDriver: true }),
        ]),
      ]).start();
    });
  }, [active]);

  return pieces;
}

export type StatsModalType = "selos" | "especies" | "diagnosticos";

interface Props {
  type: StatsModalType;
  visible: boolean;
  onClose: () => void;
  historico: ConsultaHistorico[];
  conquistaStats: ConquistaStats;
}

export default function StatsModal({ type, visible, onClose, historico, conquistaStats }: Props) {
  const insets = useSafeAreaInsets();
  const [seloComemora, setSeloComemora] = useState<string | null>(null);
  const confetti = useConfetti(seloComemora !== null);

  function handleSeloPress(seloId: string, desbloqueado: boolean) {
    if (!desbloqueado) return;
    setSeloComemora(seloId);
    setTimeout(() => setSeloComemora(null), 2200);
  }

  const titulo =
    type === "selos" ? "🏅 Conquistas" :
    type === "especies" ? "🌿 Minhas Especies" :
    "🔬 Meus Diagnosticos";

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={10} style={styles.closeBtn}>
            <X size={22} color={COLORS.ink} strokeWidth={2.4} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{titulo}</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {type === "selos" && <SelosContent conquistaStats={conquistaStats} onSeloPress={handleSeloPress} />}
          {type === "especies" && <EspeciesContent historico={historico} />}
          {type === "diagnosticos" && <DiagnosticosContent historico={historico} />}
        </ScrollView>

        {/* Confetti overlay */}
        {confetti.map((p) => (
          <Animated.Text
            key={p.id}
            style={[
              styles.confettiPiece,
              { transform: [{ translateX: p.x }, { translateY: p.y }], opacity: p.opacity },
            ]}
          >
            {p.emoji}
          </Animated.Text>
        ))}

        {/* Celebracao overlay ao clicar em selo */}
        {seloComemora && (() => {
          const selo = SELOS.find((s) => s.id === seloComemora);
          if (!selo) return null;
          return (
            <View style={styles.celebracaoOverlay} pointerEvents="none">
              <View style={[styles.celebracaoCard, { borderColor: CAT_COLORS[selo.categoria] }]}>
                <Text style={styles.celebracaoEmoji}>{selo.emoji}</Text>
                <Text style={styles.celebracaoNome}>{selo.nome}</Text>
                <Text style={styles.celebracaoDesc}>{selo.desc}</Text>
                <Text style={[styles.celebracaoCat, { color: CAT_COLORS[selo.categoria] }]}>
                  {selo.categoria}
                </Text>
              </View>
            </View>
          );
        })()}
      </View>
    </Modal>
  );
}

// ─── Selos ───────────────────────────────────────────────────────────────────
function SelosContent({
  conquistaStats,
  onSeloPress,
}: {
  conquistaStats: ConquistaStats;
  onSeloPress: (id: string, got: boolean) => void;
}) {
  return (
    <>
      {CATEGORIAS_SELOS.map((cat) => {
        const selosGrupo = SELOS.filter((s) => s.categoria === cat);
        return (
          <View key={cat} style={styles.catSection}>
            <Text style={[styles.catLabel, { color: CAT_COLORS[cat] }]}>{cat}</Text>
            <View style={styles.selosRow}>
              {selosGrupo.map((s) => {
                const got = s.check(conquistaStats);
                return (
                  <TouchableOpacity
                    key={s.id}
                    activeOpacity={got ? 0.7 : 1}
                    onPress={() => onSeloPress(s.id, got)}
                    style={[styles.seloCard, !got && styles.seloLocked]}
                  >
                    <View
                      style={[
                        styles.seloCircle,
                        { backgroundColor: got ? CAT_COLORS[s.categoria] + "20" : COLORS.divider },
                        got && { borderBottomWidth: 3, borderBottomColor: CAT_COLORS[s.categoria] + "60" },
                      ]}
                    >
                      <Text style={styles.seloEmoji}>{got ? s.emoji : "🔒"}</Text>
                    </View>
                    <Text style={styles.seloNome}>{s.nome}</Text>
                    <Text style={styles.seloDesc}>{got ? "Desbloqueado!" : s.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      })}
    </>
  );
}

// ─── Especies ────────────────────────────────────────────────────────────────
function EspeciesContent({ historico }: { historico: ConsultaHistorico[] }) {
  const map = new Map<string, ConsultaHistorico>();
  historico.forEach((h) => {
    if (!map.has(h.especie_identificada)) map.set(h.especie_identificada, h);
  });
  const especies = [...map.values()];

  if (especies.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyEmoji}>🌱</Text>
        <Text style={styles.emptyText}>Ainda sem especies. Faca um diagnostico!</Text>
      </View>
    );
  }

  return (
    <>
      {especies.map((h) => (
        <View key={h.especie_identificada} style={styles.especieCard}>
          {h.imageUri ? (
            <Image source={{ uri: h.imageUri }} style={styles.especieThumb} resizeMode="cover" />
          ) : (
            <View style={[styles.especieThumb, { backgroundColor: COLORS.greenSoft, justifyContent: "center", alignItems: "center" }]}>
              <Text style={{ fontSize: 22 }}>🌿</Text>
            </View>
          )}
          <View style={styles.especieInfo}>
            <Text style={styles.especieNome}>{h.nome_popular}</Text>
            <Text style={styles.especieCientifico} numberOfLines={1}>{h.especie_identificada}</Text>
          </View>
          <Text style={styles.especieSaude}>{SAUDE_EMOJI[h.estado_saude] ?? "⚪"}</Text>
        </View>
      ))}
    </>
  );
}

// ─── Diagnosticos ─────────────────────────────────────────────────────────────
function DiagnosticosContent({ historico }: { historico: ConsultaHistorico[] }) {
  if (historico.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyEmoji}>🔬</Text>
        <Text style={styles.emptyText}>Nenhum diagnostico ainda. Aponte a camera para uma planta!</Text>
      </View>
    );
  }

  return (
    <>
      {[...historico].reverse().map((h) => {
        const data = new Date(h.timestamp);
        const dataStr = `${String(data.getDate()).padStart(2, "0")}/${String(data.getMonth() + 1).padStart(2, "0")}/${data.getFullYear()}`;
        return (
          <View key={h.id} style={styles.diagCard}>
            {h.imageUri ? (
              <Image source={{ uri: h.imageUri }} style={styles.diagThumb} resizeMode="cover" />
            ) : (
              <View style={[styles.diagThumb, { backgroundColor: COLORS.greenSoft, justifyContent: "center", alignItems: "center" }]}>
                <Text style={{ fontSize: 20 }}>🌿</Text>
              </View>
            )}
            <View style={styles.diagInfo}>
              <Text style={styles.diagNome}>{h.nome_popular}</Text>
              <Text style={styles.diagTitulo} numberOfLines={2}>{h.diagnostico_titulo}</Text>
              <Text style={styles.diagData}>{dataStr}</Text>
            </View>
            <Text style={styles.diagSaude}>{SAUDE_EMOJI[h.estado_saude] ?? "⚪"}</Text>
          </View>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    backgroundColor: COLORS.card,
  },
  closeBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: FONTS.displayBlack, fontSize: SIZES.lg, color: COLORS.greenDark },
  content: { paddingHorizontal: 16, paddingTop: 16 },

  // Categorias selos
  catSection: { marginBottom: 24 },
  catLabel: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.smPlus,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  selosRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  seloCard: {
    width: (SCREEN_W - 52) / 3,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    ...shadowSoft(),
  },
  seloLocked: { opacity: 0.45 },
  seloCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  seloEmoji: { fontSize: 28 },
  seloNome: { fontFamily: FONTS.bodyExtraBold, fontSize: SIZES.xs, color: COLORS.ink, textAlign: "center" },
  seloDesc: { fontFamily: FONTS.body, fontSize: 10, color: COLORS.inkMute, textAlign: "center", marginTop: 2 },

  // Celebracao
  celebracaoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  celebracaoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    borderWidth: 3,
    marginHorizontal: 32,
    ...shadowSoft(),
  },
  celebracaoEmoji: { fontSize: 64, marginBottom: 8 },
  celebracaoNome: { fontFamily: FONTS.displayBlack, fontSize: 22, color: COLORS.ink, textAlign: "center" },
  celebracaoDesc: { fontFamily: FONTS.body, fontSize: SIZES.sm, color: COLORS.inkSoft, textAlign: "center", marginTop: 6 },
  celebracaoCat: { fontFamily: FONTS.bodyExtraBold, fontSize: SIZES.xs, marginTop: 8, letterSpacing: 1, textTransform: "uppercase" },

  // Confetti
  confettiPiece: { position: "absolute", fontSize: 20, pointerEvents: "none" } as any,

  // Especies
  especieCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 14,
    marginBottom: 10,
    padding: 10,
    gap: 12,
    ...shadowSoft(),
  },
  especieThumb: { width: 54, height: 54, borderRadius: 10, overflow: "hidden" },
  especieInfo: { flex: 1 },
  especieNome: { fontFamily: FONTS.bodyExtraBold, fontSize: SIZES.smPlus, color: COLORS.ink },
  especieCientifico: { fontFamily: FONTS.body, fontSize: SIZES.xs, color: COLORS.inkMute, marginTop: 2 },
  especieSaude: { fontSize: 22 },

  // Diagnosticos
  diagCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 14,
    marginBottom: 10,
    padding: 10,
    gap: 12,
    ...shadowSoft(),
  },
  diagThumb: { width: 54, height: 54, borderRadius: 10, overflow: "hidden" },
  diagInfo: { flex: 1 },
  diagNome: { fontFamily: FONTS.bodyExtraBold, fontSize: SIZES.smPlus, color: COLORS.ink },
  diagTitulo: { fontFamily: FONTS.body, fontSize: SIZES.xs, color: COLORS.inkSoft, marginTop: 2 },
  diagData: { fontFamily: FONTS.body, fontSize: SIZES.xs, color: COLORS.inkMute, marginTop: 2 },
  diagSaude: { fontSize: 22 },

  // Empty
  emptyWrap: { alignItems: "center", paddingTop: 60, paddingHorizontal: 24 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontFamily: FONTS.body, fontSize: SIZES.body, color: COLORS.inkSoft, textAlign: "center", lineHeight: 22 },
});
