import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getRandomMascotPose } from "../assets/mascot";

interface Props {
  onPress: () => void;
  disabled?: boolean;
}

const TIPS = [
  "☀️ Dica: Luz natural e amiga da foto boa. Prefira a sombra clarinha, evite o sol a pino.",
  "🔍 Dica: Aproxime a camera da folha com problema. Quanto mais perto, melhor eu enxergo.",
  "📱 Dica: Toque na tela pra focar antes de clicar. Foto nitida vale ouro pro diagnostico.",
  "🎯 Dica: Mire numa folha so. O Doutor precisa de foco, nao de bagunca no quadro.",
  "🍂 Dica: Folha amarelada? Fotografe ela inteira. O padrao me conta muita coisa.",
  "🔬 Dica: Tem mancha na folha? Capriche no enquadramento. Quero ver o detalhe bem de perto.",
  "🧽 Dica: Limpe a lente da camera com um paninho. Foto embacada atrapalha meu trabalho.",
  "🌿 Dica: Se o problema esta no caule, fotografe o caule tambem, nao so as folhas.",
  "✨ Dica: Evite sombra projetada sobre a folha. Posicione a planta num lugar iluminado.",
  "🖼️ Dica: Fundo neutro ajuda. Uma parede clara atras da planta ja faz milagre.",
];

export function ScannerArea({ onPress, disabled }: Props) {
  const [pose] = useState(() => getRandomMascotPose());
  const [tipIndex, setTipIndex] = useState(0);
  const tipOpacity = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const laserAnim = useRef(new Animated.Value(0)).current;

  // Rotacao de dicas a cada 3.5s
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(tipOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(tipOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
      setTimeout(() => {
        setTipIndex((prev) => (prev + 1) % TIPS.length);
      }, 500);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Pulse do mascote
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.98,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  // Laser beam azul atravessando
  useEffect(() => {
    Animated.loop(
      Animated.timing(laserAnim, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  const laserTranslateY = laserAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 200],
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.95}
    >
      <View style={styles.scanner}>
        <View style={[styles.corner, styles.tl]} />
        <View style={[styles.corner, styles.tr]} />
        <View style={[styles.corner, styles.bl]} />
        <View style={[styles.corner, styles.br]} />

        <Animated.View
          style={[styles.mascotWrapper, { transform: [{ scale: pulseAnim }] }]}
        >
          <Image source={pose} style={styles.mascotImage} resizeMode="cover" />
          <Animated.View style={[styles.laser, { transform: [{ translateY: laserTranslateY }] }]} />
        </Animated.View>

        <Text style={styles.label}>Toque no Doutor Gentileza</Text>

        <Animated.Text style={[styles.tip, { opacity: tipOpacity }]}>
          {TIPS[tipIndex]}
        </Animated.Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  scanner: {
    borderWidth: 3,
    borderStyle: "dashed",
    borderColor: "#2E7D32",
    backgroundColor: "#f1f8f1",
    borderRadius: 25,
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: "#2E7D32",
  },
  tl: {
    top: 10,
    left: 10,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  tr: {
    top: 10,
    right: 10,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  bl: {
    bottom: 10,
    left: 10,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  br: {
    bottom: 10,
    right: 10,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  mascotWrapper: {
    width: 260,
    height: 180,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 12,
    position: "relative",
  },
  mascotImage: {
    width: "100%",
    height: "100%",
  },
  laser: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "#2196F3",
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
    opacity: 0.7,
  },
  label: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1a4d2e",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    textAlign: "center",
  },
  tip: {
    fontSize: 15,
    color: "#d84315",
    fontWeight: "700",
    textAlign: "center",
  },
});
