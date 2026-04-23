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
import { marcarWelcomeVisto } from "../storage/preferencias";

interface Props {
  onComecar: () => void;
}

const BENEFICIOS = [
  {
    icon: "🌿",
    titulo: "Identifico sua planta",
    desc: "Nome popular, especie, nivel de cuidado",
  },
  {
    icon: "⚠️",
    titulo: "Aviso se e toxica",
    desc: "Seguranca pra pets e criancas em casa",
  },
  {
    icon: "📋",
    titulo: "Monto um plano pra ela",
    desc: "Luz, rega e passo a passo pra cuidar",
  },
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
      <View style={styles.header}>
        <Text style={styles.appName}>Terra Gentil</Text>
        <Text style={styles.appSubtitle}>Doutor das Plantas</Text>
      </View>

      <View style={styles.mascotWrapper}>
        <Image source={pose} style={styles.mascotImage} resizeMode="cover" />
      </View>

      <Text style={styles.greeting}>Oi! Eu sou o Doutor Gentileza</Text>
      <Text style={styles.intro}>
        Seu assistente pra cuidar das plantas com carinho.
      </Text>

      <View style={styles.beneficiosList}>
        {BENEFICIOS.map((b, idx) => (
          <View key={idx} style={styles.beneficioItem}>
            <Text style={styles.beneficioIcon}>{b.icon}</Text>
            <View style={styles.beneficioText}>
              <Text style={styles.beneficioTitulo}>{b.titulo}</Text>
              <Text style={styles.beneficioDesc}>{b.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.closing}>Vamos comecar?</Text>

      <TouchableOpacity
        style={[styles.ctaButton, salvando && styles.ctaButtonDisabled]}
        onPress={handleComecar}
        disabled={salvando}
      >
        <Text style={styles.ctaButtonText}>Ver dicas rapidas →</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>
        Em 4 telinhas eu te ensino a tirar uma foto boa 🌱
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f9f5",
  },
  content: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  appName: {
    fontSize: 30,
    fontWeight: "800",
    color: "#1b5e20",
  },
  appSubtitle: {
    fontSize: 17,
    color: "#558b2f",
    marginTop: 4,
  },
  mascotWrapper: {
    width: 220,
    height: 220,
    borderRadius: 22,
    overflow: "hidden",
    marginBottom: 24,
    borderWidth: 3,
    borderColor: "#c8e6c9",
  },
  mascotImage: {
    width: "100%",
    height: "100%",
  },
  greeting: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1a4d2e",
    textAlign: "center",
    marginBottom: 8,
  },
  intro: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  beneficiosList: {
    width: "100%",
    marginBottom: 24,
  },
  beneficioItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e8f5e9",
  },
  beneficioIcon: {
    fontSize: 32,
    marginRight: 14,
  },
  beneficioText: {
    flex: 1,
  },
  beneficioTitulo: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1b5e20",
    marginBottom: 2,
  },
  beneficioDesc: {
    fontSize: 15,
    color: "#666",
    lineHeight: 20,
  },
  closing: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a4d2e",
    textAlign: "center",
    marginBottom: 20,
  },
  ctaButton: {
    backgroundColor: "#2e7d32",
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: "100%",
    alignItems: "center",
    minHeight: 60,
    justifyContent: "center",
    shadowColor: "#1b5e20",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  ctaButtonDisabled: {
    opacity: 0.7,
  },
  ctaButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  footer: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginTop: 20,
    fontStyle: "italic",
  },
});
