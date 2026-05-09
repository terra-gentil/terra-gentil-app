import React, { useEffect, useState } from "react";
import { Image, ImageSourcePropType, StyleSheet, Text, View } from "react-native";
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

const inPhase = (t: number, name: PhaseKey) => t >= PHASES[name][0] && t < PHASES[name][1];

const phaseProgress = (t: number, name: PhaseKey) => {
  const [a, b] = PHASES[name];
  if (t < a) return 0;
  if (t > b) return 1;
  return (t - a) / (b - a);
};

const opacityFor = (t: number, name: PhaseKey, fade = 0.45) => {
  const [a, b] = PHASES[name];
  if (t >= a - fade && t < a) return (t - (a - fade)) / fade;
  if (t >= a && t <= b) return 1;
  if (t > b && t < b + fade) return 1 - (t - b) / fade;
  return 0;
};

function hexAlpha(hex: string, alpha: number): string {
  if (hex.startsWith("#") && hex.length === 7) {
    const a = Math.round(alpha * 255).toString(16).padStart(2, "0");
    return hex + a;
  }
  return hex;
}

interface Props {
  marginTop?: number;
}

export default function DoctorScanner({ marginTop = 14 }: Props) {
  const [t, setT] = useState(0);
  const [exampleIdx, setExampleIdx] = useState(0);

  useEffect(() => {
    let raf = 0;
    let prev = 0;
    let lastUpdate = 0;
    const tick = (now: number) => {
      if (!prev) prev = now;
      const elapsed = now - lastUpdate;
      if (elapsed >= 33) {
        const dt = (now - prev) / 1000;
        prev = now;
        lastUpdate = now;
        setT((curr) => {
          const next = (curr + dt) % LOOP;
          if (curr > LOOP - 1.5 && next < 1) {
            setExampleIdx((i) => (i + 1) % EXAMPLES.length);
          }
          return next;
        });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const example = EXAMPLES[exampleIdx];
  const scanP = phaseProgress(t, "scan");
  const resultP = phaseProgress(t, "result");
  const showScanner = inPhase(t, "scan");
  const showThink = inPhase(t, "think");
  const showResult = t >= PHASES.result[0];
  const resultOp = Math.min(1, resultP * 3);

  let statusLabel = "PRONTO";
  let toneColor: string = COLORS.greenLeaf;
  if (inPhase(t, "intro")) {
    statusLabel = "CÂMERA INICIANDO";
    toneColor = "#F4ECDB";
  } else if (inPhase(t, "scan")) {
    statusLabel = "ESCANEANDO PLANTA";
    toneColor = COLORS.greenLeaf;
  } else if (inPhase(t, "think")) {
    statusLabel = "IA ANALISANDO";
    toneColor = COLORS.greenLeaf;
  } else if (inPhase(t, "result")) {
    statusLabel = "DIAGNÓSTICO PRONTO";
    toneColor = COLORS.coral;
  } else if (inPhase(t, "plan")) {
    statusLabel = "PLANO DE AÇÃO";
    toneColor = COLORS.greenLeaf;
  } else if (inPhase(t, "ebook")) {
    statusLabel = "EBOOK ENVIADO";
    toneColor = COLORS.greenLeaf;
  }

  return (
    <View style={[styles.stage, { marginTop }]}>
      {/* Camada 0: pilha de fotos com crossfade */}
      {ACTS.map((act) => {
        const op = opacityFor(t, act.key);
        return (
          <Image
            key={act.key}
            source={act.src}
            style={[
              styles.photo,
              { opacity: op, transform: [{ scale: 1.02 + op * 0.02 }] },
            ]}
          />
        );
      })}

      {/* Vinheta */}
      <LinearGradient
        colors={["rgba(11,20,16,0)", "rgba(11,20,16,0.65)"]}
        locations={[0.35, 1]}
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
          <LinearGradient
            colors={["transparent", COLORS.greenLeaf, "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.scanline, { top: `${15 + scanP * 70}%` as any }]}
            pointerEvents="none"
          />
          <LinearGradient
            colors={[
              "rgba(116,198,157,0)",
              "rgba(116,198,157,0.18)",
              "rgba(116,198,157,0)",
            ]}
            locations={[0, 0.7, 1]}
            style={[
              styles.scanGlow,
              { top: `${Math.max(0, 15 + scanP * 70 - 12)}%` as any },
            ]}
            pointerEvents="none"
          />
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
        <View
          pointerEvents="none"
          style={[
            styles.result,
            {
              opacity: resultOp,
              transform: [{ translateY: (1 - resultOp) * 14 }],
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
        </View>
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
  scanline: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    shadowColor: COLORS.greenLeaf,
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  scanGlow: {
    position: "absolute",
    left: 0,
    right: 0,
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
