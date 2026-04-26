import React, { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getRandomMascotPose } from "../assets/mascot";
import { COLORS, FONTS, SIZES, shadowChunky, shadowSoft } from "../constants/theme";
import { marcarWelcomeVisto } from "../storage/preferencias";

interface Props {
  onComecar: () => void;
}

const BENEFICIOS = [
  { emoji: "🌿", texto: "Identifico a planta" },
  { emoji: "⚠️", texto: "Aviso se e toxica pra pets" },
  { emoji: "📋", texto: "Monto plano de cuidados" },
];

export function WelcomeScreen({ onComecar }: Props) {
  const [pose] = useState(() => getRandomMascotPose());
  const [salvando, setSalvando] = useState(false);

  async function handleComecar() {
    setSalvando(true);
    await marcarWelcomeVisto();
    onComecar();
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appName}>TERRA GENTIL</Text>
        <Text style={styles.appSubtitle}>DOUTOR DAS PLANTAS</Text>
      </View>

      {/* Mascote */}
      <View style={styles.mascotWrapper}>
        <Image source={pose} style={styles.mascotImage} resizeMode="cover" />
        <Text style={styles.sparkle}>✨</Text>
        <Text style={styles.leaf}>🌱</Text>
      </View>

      {/* Titulo */}
      <View style={styles.titleWrap}>
        <Text style={styles.greeting}>
          Oi! Eu sou o{"\n"}
          <Text style={styles.greetingAccent}>Doutor Gentileza</Text>
        </Text>
        <Text style={styles.intro}>
          Tire uma foto da sua planta e eu te conto tudo: nome, cuidado, e se tem algum probleminha de saude.
        </Text>
      </View>

      {/* Beneficios */}
      <View style={styles.beneficiosList}>
        {BENEFICIOS.map((b, idx) => (
          <View key={idx} style={styles.beneficioItem}>
            <View style={styles.beneficioIconWrap}>
              <Text style={styles.beneficioEmoji}>{b.emoji}</Text>
            </View>
            <Text style={styles.beneficioTexto}>{b.texto}</Text>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        ))}
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={[styles.ctaButton, salvando && styles.ctaDisabled]}
        onPress={handleComecar}
        disabled={salvando}
        activeOpacity={0.8}
      >
        <Text style={styles.ctaText}>Comecar agora →</Text>
      </TouchableOpacity>

      {/* Dots */}
      <View style={styles.dotsRow}>
        <Text style={styles.dotInactive}>▪</Text>
        <Text style={styles.dotInactive}>▪</Text>
        <Text style={styles.dotActive}>●</Text>
        <Text style={styles.dotInactive}>▪</Text>
        <Text style={styles.dotInactive}>▪</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.greenSoft,
  },
  content: {
    paddingTop: 40,
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  appName: {
    fontFamily: FONTS.displayBlack,
    fontSize: SIZES.body,
    color: COLORS.green,
    letterSpacing: 1.5,
  },
  appSubtitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: SIZES.xs,
    color: COLORS.inkSoft,
    letterSpacing: 1,
    marginTop: 2,
  },
  mascotWrapper: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 32,
    overflow: "hidden",
    borderWidth: 6,
    borderColor: "#fff",
    backgroundColor: COLORS.greenLeaf,
    ...shadowChunky(COLORS.greenDeep + "40"),
    marginBottom: 24,
  },
  mascotImage: {
    width: "100%",
    height: "100%",
  },
  sparkle: {
    position: "absolute",
    top: 16,
    right: 16,
    fontSize: 24,
  },
  leaf: {
    position: "absolute",
    bottom: 16,
    left: 16,
    fontSize: 20,
  },
  titleWrap: {
    alignItems: "center",
    marginBottom: 20,
  },
  greeting: {
    fontFamily: FONTS.displayBlack,
    fontSize: SIZES.xxl,
    color: COLORS.greenDark,
    textAlign: "center",
    lineHeight: 32,
  },
  greetingAccent: {
    color: COLORS.coralDeep,
  },
  intro: {
    fontFamily: FONTS.body,
    fontSize: SIZES.body,
    color: COLORS.inkSoft,
    textAlign: "center",
    lineHeight: 21,
    marginTop: 10,
    paddingHorizontal: 12,
  },
  beneficiosList: {
    width: "100%",
    gap: 10,
    marginBottom: 24,
  },
  beneficioItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    ...shadowSoft(),
  },
  beneficioIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.greenSoft,
    justifyContent: "center",
    alignItems: "center",
  },
  beneficioEmoji: {
    fontSize: 18,
  },
  beneficioTexto: {
    flex: 1,
    fontFamily: FONTS.bodyBold,
    fontSize: SIZES.body,
    color: COLORS.greenDark,
  },
  checkmark: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: 20,
    color: COLORS.green,
  },
  ctaButton: {
    width: "100%",
    paddingVertical: 18,
    borderRadius: 18,
    backgroundColor: COLORS.green,
    alignItems: "center",
    ...shadowChunky(COLORS.greenDeep),
  },
  ctaDisabled: {
    opacity: 0.7,
  },
  ctaText: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.md,
    color: "#fff",
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
  },
  dotInactive: {
    fontSize: 10,
    color: COLORS.inkMute,
  },
  dotActive: {
    fontSize: 12,
    color: COLORS.green,
  },
});
