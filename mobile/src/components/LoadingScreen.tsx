import React, { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";
import { MASCOT_ANALYZING } from "../assets/mascot";

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
    fontSize: 13,
    color: "#666",
    textAlign: "center",
  },
});
