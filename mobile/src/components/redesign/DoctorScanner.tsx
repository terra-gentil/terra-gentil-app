import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, ImageSourcePropType, LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Brain } from "lucide-react-native";
import { COLORS, FONTS } from "../../constants/theme";
import { MASCOT_POSES } from "../../assets/mascot";

const PHASES = {
  intro: [0, 1.6],
  scan: [1.6, 3.6],
  think: [3.6, 5.2],
  result: [5.2, 7.4],
  plan: [7.4, 9.4],
  ebook: [9.4, 11.0],
} as const;
const LOOP = 11.0;
type PhaseKey = keyof typeof PHASES;

type Act = { key: PhaseKey; src: ImageSourcePropType };
const ACTS: Act[] = [
  { key: "intro", src: MASCOT_POSES[3] },
  { key: "scan", src: MASCOT_POSES[2] },
  { key: "think", src: MASCOT_POSES[1] },
  { key: "result", src: MASCOT_POSES[4] },
  { key: "plan", src: MASCOT_POSES[6] },
  { key: "ebook", src: MASCOT_POSES[0] },
];

const EXAMPLES = [
  { name: "Tomateiro", problem: "Pinta-preta nas folhas", severity: "Moderado", sevColor: COLORS.amber },
  { name: "Pothos", problem: "Excesso de rega no substrato", severity: "Leve", sevColor: COLORS.green },
  { name: "Manjericão", problem: "Pulgão na face inferior", severity: "Atenção", sevColor: COLORS.coral },
];

function hexAlpha(hex: string, alpha: number): string {
  if (hex.startsWith("#") && hex.length === 7) {
    const a = Math.round(alpha * 255).toString(16).padStart(2, "0");
    return hex + a;
  }
  return hex;
}

// Constantes fora do componente pra nao recriar arrays a cada render.
const VINHETA_CORES = ["rgba(11,20,16,0)", "rgba(11,20,16,0.65)"] as const;
const VINHETA_LOCAIS = [0.35, 1] as const;
const SCANLINE_CORES = ["transparent", COLORS.greenLeaf, "transparent"] as const;
const SCANGLOW_CORES = ["rgba(116,198,157,0)", "rgba(116,198,157,0.18)", "rgba(116,198,157,0)"] as const;
const SCANGLOW_LOCAIS = [0, 0.7, 1] as const;
const GRADIENTE_ESQ = { x: 0, y: 0 };
const GRADIENTE_DIR = { x: 1, y: 0 };

// Ordem das fases dentro do ciclo. A primeira comeca em t = 0.
const ORDEM_FASES: PhaseKey[] = ["intro", "scan", "think", "result", "plan", "ebook"];

const FASE_HUD: Record<PhaseKey, { label: string; cor: string }> = {
  intro: { label: "CÂMERA INICIANDO", cor: "#F4ECDB" },
  scan: { label: "ESCANEANDO PLANTA", cor: COLORS.greenLeaf },
  think: { label: "IA ANALISANDO", cor: COLORS.greenLeaf },
  result: { label: "DIAGNÓSTICO PRONTO", cor: COLORS.coral },
  plan: { label: "PLANO DE AÇÃO", cor: COLORS.greenLeaf },
  ebook: { label: "EBOOK ENVIADO", cor: COLORS.greenLeaf },
};

const FADE_FOTO = 0.45;
// O card de resultado termina de aparecer em 1/3 da fase "result".
const RESULT_INICIO = PHASES.result[0];
const RESULT_CHEIO = PHASES.result[0] + (PHASES.result[1] - PHASES.result[0]) / 3;

interface Props {
  marginTop?: number;
  // Com true a animacao para (tela fora de foco) e nao agenda nada.
  pausado?: boolean;
}

/**
 * Animacao em loop de 11 s. O relogio "t" e um Animated.Value com driver nativo,
 * entao opacidade, escala e deslocamento rodam fora da thread JS. O React so
 * re-renderiza nas trocas de fase (6 por ciclo), nao a cada quadro.
 */
export default function DoctorScanner({ marginTop = 14, pausado = false }: Props) {
  const t = useRef(new Animated.Value(0)).current;
  const [fase, setFase] = useState<PhaseKey>("intro");
  const [exampleIdx, setExampleIdx] = useState(0);
  const [altura, setAltura] = useState(0);

  useEffect(() => {
    if (pausado) return;
    let vivo = true;
    let timers: ReturnType<typeof setTimeout>[] = [];
    const limparTimers = () => {
      timers.forEach(clearTimeout);
      timers = [];
    };
    const iniciarCiclo = (proximoExemplo: boolean) => {
      if (!vivo) return;
      limparTimers();
      t.setValue(0);
      setFase("intro");
      if (proximoExemplo) setExampleIdx((i) => (i + 1) % EXAMPLES.length);
      for (const key of ORDEM_FASES.slice(1)) {
        timers.push(
          setTimeout(() => {
            if (vivo) setFase(key);
          }, PHASES[key][0] * 1000),
        );
      }
      Animated.timing(t, {
        toValue: LOOP,
        duration: LOOP * 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();
      // O reinicio vem de um timer proprio, nao do callback da animacao, pra o
      // ciclo nao depender de quando o driver nativo avisa que terminou.
      timers.push(setTimeout(() => iniciarCiclo(true), LOOP * 1000));
    };
    iniciarCiclo(false);
    return () => {
      vivo = false;
      limparTimers();
      t.stopAnimation();
    };
  }, [pausado, t]);

  const fotos = useMemo(
    () =>
      ACTS.map((act) => {
        const [a, b] = PHASES[act.key];
        const inputRange = [a - FADE_FOTO, a, b, b + FADE_FOTO];
        return {
          key: act.key,
          src: act.src,
          opacity: t.interpolate({ inputRange, outputRange: [0, 1, 1, 0], extrapolate: "clamp" }),
          scale: t.interpolate({ inputRange, outputRange: [1.02, 1.04, 1.04, 1.02], extrapolate: "clamp" }),
        };
      }),
    [t],
  );

  const scan = useMemo(() => {
    const inputRange = [PHASES.scan[0], PHASES.scan[1]];
    return {
      linhaY: t.interpolate({ inputRange, outputRange: [altura * 0.15, altura * 0.85], extrapolate: "clamp" }),
      brilhoY: t.interpolate({ inputRange, outputRange: [altura * 0.03, altura * 0.73], extrapolate: "clamp" }),
    };
  }, [t, altura]);

  const resultado = useMemo(() => {
    const inputRange = [RESULT_INICIO, RESULT_CHEIO];
    return {
      opacity: t.interpolate({ inputRange, outputRange: [0, 1], extrapolate: "clamp" }),
      translateY: t.interpolate({ inputRange, outputRange: [14, 0], extrapolate: "clamp" }),
    };
  }, [t]);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    setAltura((atual) => (Math.abs(atual - h) < 0.5 ? atual : h));
  }, []);

  const example = EXAMPLES[exampleIdx];
  const { label: statusLabel, cor: toneColor } = FASE_HUD[fase];
  const showScanner = fase === "scan" && altura > 0;
  const showThink = fase === "think";
  const showResult = fase === "result" || fase === "plan" || fase === "ebook";

  return (
    <View style={[styles.stage, { marginTop }]} onLayout={onLayout}>
      {/* Camada 0: pilha de fotos com crossfade */}
      {fotos.map((foto) => (
        <Animated.Image
          key={foto.key}
          source={foto.src}
          style={[
            styles.photo,
            { opacity: foto.opacity, transform: [{ scale: foto.scale }] },
          ]}
        />
      ))}

      {/* Vinheta */}
      <LinearGradient
        colors={VINHETA_CORES}
        locations={VINHETA_LOCAIS}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      {/* Cantos viewfinder */}
      <View pointerEvents="none" style={styles.vfWrap}>
        <View style={[styles.vfCorner, styles.vfTL]} />
        <View style={[styles.vfCorner, styles.vfTR]} />
        <View style={[styles.vfCorner, styles.vfBL]} />
        <View style={[styles.vfCorner, styles.vfBR]} />
      </View>

      {/* HUD topo */}
      <View pointerEvents="none" style={styles.hudTop}>
        <View style={styles.hudBrand}>
          <View style={styles.hudMark}>
            <Text style={styles.hudMarkText}>+</Text>
          </View>
          <Text style={styles.hudBrandName}>DOUTOR GENTILEZA</Text>
        </View>
        <View style={[styles.hudChip, { borderColor: hexAlpha(toneColor, 0.45) }]}>
          <View style={[styles.hudDot, { backgroundColor: toneColor }]} />
          <Text
            style={[styles.hudChipText, { color: toneColor }]}
            numberOfLines={1}
          >
            {statusLabel}
          </Text>
        </View>
      </View>

      {/* Linha do scanner */}
      {showScanner && (
        <>
          <Animated.View
            pointerEvents="none"
            style={[styles.scanTrilho, { transform: [{ translateY: scan.linhaY }] }]}
          >
            <LinearGradient
              colors={SCANLINE_CORES}
              start={GRADIENTE_ESQ}
              end={GRADIENTE_DIR}
              style={styles.scanline}
            />
          </Animated.View>
          <Animated.View
            pointerEvents="none"
            style={[styles.scanTrilho, { transform: [{ translateY: scan.brilhoY }] }]}
          >
            <LinearGradient
              colors={SCANGLOW_CORES}
              locations={SCANGLOW_LOCAIS}
              style={styles.scanGlow}
            />
          </Animated.View>
        </>
      )}

      {/* Pilula "analisando" */}
      {showThink && (
        <View pointerEvents="none" style={styles.thinkWrap}>
          <View style={styles.thinkPill}>
            <Brain size={12} color={COLORS.amber} strokeWidth={2.5} />
            <Text style={styles.thinkText}>Analisando padrões na folha</Text>
            <View style={styles.thinkDots}>
              <View style={styles.thinkDot} />
              <View style={styles.thinkDot} />
              <View style={styles.thinkDot} />
            </View>
          </View>
        </View>
      )}

      {/* Card diagnostico */}
      {showResult && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.result,
            {
              opacity: resultado.opacity,
              transform: [{ translateY: resultado.translateY }],
            },
          ]}
        >
          <View style={styles.rsRow}>
            <Text style={styles.rsName} numberOfLines={1}>
              {example.name}
            </Text>
            <View style={[styles.rsSev, { backgroundColor: example.sevColor }]}>
              <Text style={styles.rsSevText}>
                {example.severity.toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.rsProb}>
            <View
              style={[styles.rsBullet, { backgroundColor: example.sevColor }]}
            />
            <Text style={styles.rsProbText} numberOfLines={1}>
              {example.problem}
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    aspectRatio: 16 / 10,
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#0B1410",
  },
  photo: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  vfWrap: {
    ...StyleSheet.absoluteFillObject,
    margin: 10,
  },
  vfCorner: {
    position: "absolute",
    width: 14,
    height: 14,
    borderColor: COLORS.amber,
  },
  vfTL: {
    top: 0,
    left: 0,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: 4,
  },
  vfTR: {
    top: 0,
    right: 0,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderTopRightRadius: 4,
  },
  vfBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderBottomLeftRadius: 4,
  },
  vfBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomRightRadius: 4,
  },
  hudTop: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hudBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
    backgroundColor: "rgba(11,20,16,0.7)",
    borderWidth: 1,
    borderColor: "rgba(244,236,219,0.18)",
  },
  hudMark: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.amber,
    alignItems: "center",
    justifyContent: "center",
  },
  hudMarkText: {
    color: "#0B1410",
    fontFamily: FONTS.displayBlack,
    fontSize: 12,
    lineHeight: 14,
    marginTop: -1,
  },
  hudBrandName: {
    color: "#F4ECDB",
    fontFamily: FONTS.displayBlack,
    fontSize: 9,
    letterSpacing: 0.6,
  },
  hudChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
    backgroundColor: "rgba(11,20,16,0.7)",
    borderWidth: 1,
  },
  hudDot: { width: 6, height: 6, borderRadius: 3 },
  hudChipText: {
    fontFamily: FONTS.displayBlack,
    fontSize: 9,
    letterSpacing: 0.6,
    maxWidth: 130,
  },
  scanTrilho: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  scanline: {
    height: 2,
    shadowColor: COLORS.greenLeaf,
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  scanGlow: {
    height: 60,
  },
  thinkWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  thinkPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
    backgroundColor: "rgba(11,20,16,0.85)",
    borderWidth: 1,
    borderColor: "rgba(244,236,219,0.18)",
  },
  thinkText: {
    color: "#F4ECDB",
    fontFamily: FONTS.bodySemiBold,
    fontSize: 11,
  },
  thinkDots: { flexDirection: "row", gap: 3, marginLeft: 2 },
  thinkDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.greenLeaf,
  },
  result: {
    position: "absolute",
    left: 10,
    bottom: 10,
    maxWidth: "82%",
    backgroundColor: "#F4ECDB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  rsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  rsName: {
    fontFamily: FONTS.displayBlack,
    fontSize: 13,
    color: COLORS.ink,
    flexShrink: 1,
  },
  rsSev: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 100 },
  rsSevText: {
    fontFamily: FONTS.displayBlack,
    fontSize: 8,
    letterSpacing: 0.6,
    color: "#fff",
  },
  rsProb: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 3,
  },
  rsBullet: { width: 5, height: 5, borderRadius: 3 },
  rsProbText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.inkSoft,
    flex: 1,
  },
});
