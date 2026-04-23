import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MASCOT_ANALYZING } from "../assets/mascot";

const YOUTUBE_URL = "https://www.youtube.com/@TerraGentil";

export function LoadingScreen() {
  const laserAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(laserAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  const laserTranslateY = laserAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 240],
  });

  function abrirCanal() {
    Linking.openURL(YOUTUBE_URL).catch((err) => {
      console.log("[loading] erro ao abrir YouTube:", err);
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.imageWrapper}>
        <Image source={MASCOT_ANALYZING} style={styles.image} resizeMode="cover" />
        <Animated.View style={[styles.laser, { transform: [{ translateY: laserTranslateY }] }]} />
      </View>
      <Text style={styles.title}>O Doutor esta analisando...</Text>
      <Text style={styles.subtitle}>
        Verificando luz, toxicidade e criando tratamento
      </Text>

      <TouchableOpacity style={styles.promoBox} onPress={abrirCanal} activeOpacity={0.7}>
        <Text style={styles.promoTitle}>📺 Enquanto espera</Text>
        <Text style={styles.promoText}>
          Da uma olhada no canal Terra Gentil no YouTube. Tenho dicas novas toda semana.
        </Text>
        <Text style={styles.promoLink}>Abrir canal</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 24,
  },
  imageWrapper: {
    width: 220,
    height: 220,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  laser: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: "#00ff00",
    shadowColor: "#00ff00",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 10,
    opacity: 0.8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a4d2e",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  promoBox: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ffcdd2",
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    width: "90%",
    alignItems: "center",
  },
  promoTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#c62828",
    marginBottom: 4,
  },
  promoText: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 6,
  },
  promoLink: {
    fontSize: 15,
    fontWeight: "700",
    color: "#c62828",
  },
});
