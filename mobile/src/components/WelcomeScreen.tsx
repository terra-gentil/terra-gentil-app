import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getRandomMascotPose } from "../assets/mascot";
import { COLORS, FONTS, SIZES, shadowChunky } from "../constants/theme";
import { marcarWelcomeVisto } from "../storage/preferencias";
import { setAuth } from "../storage/auth";
import { FORUM_API_URL } from "../config/api";

interface Props {
  onComecar: () => void;
}

const DURACAO_MS = 10000;

export function WelcomeScreen({ onComecar }: Props) {
  const insets = useSafeAreaInsets();
  const [pose] = useState(() => getRandomMascotPose());
  const disparado = useRef(false);
  const [carregando, setCarregando] = useState(false);

  // Barra de progresso
  const progresso = useRef(new Animated.Value(0)).current;

  // Pulso do botao Google — igual ao FAB da camera
  const pulso = useRef(new Animated.Value(1)).current;

  async function handleComecar() {
    if (disparado.current) return;
    disparado.current = true;
    await marcarWelcomeVisto();
    onComecar();
  }

  useEffect(() => {
    // Barra de progresso
    Animated.timing(progresso, {
      toValue: 1,
      duration: DURACAO_MS,
      useNativeDriver: false,
    }).start();

    // Auto-avanco
    const timer = setTimeout(() => handleComecar(), DURACAO_MS);

    // Pulso intermitente no botao Google
    function pulsarBotao() {
      Animated.sequence([
        Animated.timing(pulso, { toValue: 1.08, duration: 200, useNativeDriver: true }),
        Animated.timing(pulso, { toValue: 0.96, duration: 150, useNativeDriver: true }),
        Animated.timing(pulso, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start(() => {
        setTimeout(pulsarBotao, 3000);
      });
    }
    const pulsoTimer = setTimeout(pulsarBotao, 1500);

    return () => {
      clearTimeout(timer);
      clearTimeout(pulsoTimer);
      progresso.stopAnimation();
      pulso.stopAnimation();
    };
  }, []);

  async function handleGoogle() {
    if (carregando) return;
    setCarregando(true);
    try {
      const redirectUri = Linking.createURL("auth");
      const loginUrl = `${FORUM_API_URL}/auth/google/login/mobile?redirect_uri=${encodeURIComponent(redirectUri)}`;
      const result = await WebBrowser.openAuthSessionAsync(loginUrl, redirectUri);
      if (result.type !== "success") return;
      const parsed = Linking.parse(result.url);
      const params = parsed.queryParams ?? {};
      const token = params["token"] as string | undefined;
      const user_id = params["user_id"] as string | undefined;
      const name = params["name"] as string | undefined;
      const avatar = params["avatar"] as string | undefined;
      if (!token || !user_id) {
        Alert.alert("Erro", "Não foi possível completar o login. Tente de novo.");
        return;
      }
      await setAuth(token, {
        id: user_id,
        display_name: name ? decodeURIComponent(name) : "Usuário",
        avatar_url: avatar ? decodeURIComponent(avatar) : null,
      });
      await handleComecar();
    } catch {
      Alert.alert("Erro", "Falha ao conectar com Google. Tente de novo.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Pressable
      style={[styles.root, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 20) }]}
      onPress={handleComecar}
    >
      {/* Barra de progresso */}
      <View style={styles.progressBg}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progresso.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
      </View>

      {/* Topo: logo */}
      <View style={styles.topSection}>
        <Text style={styles.appName}>TERRA GENTIL</Text>
        <Text style={styles.appSubtitle}>DOUTOR DAS PLANTAS</Text>
      </View>

      {/* Centro: mascote + saudacao */}
      <View style={styles.centerSection}>
        <View style={styles.mascotWrapper}>
          <Image source={pose} style={styles.mascotImage} resizeMode="cover" />
          <Text style={styles.sparkle}>✨</Text>
          <Text style={styles.leaf}>🌱</Text>
        </View>

        <Text style={styles.greeting}>
          Oi! Sou o{" "}
          <Text style={styles.greetingAccent}>Doutor Gentileza</Text>
        </Text>
        <Text style={styles.intro}>
          Tire uma foto e eu identifico sua planta, aviso sobre toxicidade e monto o plano de cuidados.
        </Text>
      </View>

      {/* Botao Google — centro/baixo da tela, sempre visivel */}
      <View style={styles.btnSection}>
        <Animated.View style={{ transform: [{ scale: pulso }] }}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleGoogle}
            disabled={carregando}
            style={styles.btnGoogle}
          >
            {carregando ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <View style={styles.googleIconWrap}>
                  <Text style={styles.googleLetter}>G</Text>
                </View>
                <Text style={styles.btnGoogleText}>Entrar com Google</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.skipHint}>ou toque em qualquer lugar para pular</Text>

        {/* Dots */}
        <View style={styles.dotsRow}>
          <Text style={styles.dotInactive}>▪</Text>
          <Text style={styles.dotInactive}>▪</Text>
          <Text style={styles.dotActive}>●</Text>
          <Text style={styles.dotInactive}>▪</Text>
          <Text style={styles.dotInactive}>▪</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.greenSoft,
    justifyContent: "space-between",
  },

  // Progress bar
  progressBg: {
    height: 4,
    backgroundColor: "rgba(0,0,0,0.08)",
    width: "100%",
  },
  progressFill: {
    height: 4,
    backgroundColor: COLORS.green,
    borderRadius: 2,
  },

  // Topo
  topSection: {
    alignItems: "center",
    paddingTop: 16,
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

  // Centro
  centerSection: {
    alignItems: "center",
    paddingHorizontal: 28,
    flex: 1,
    justifyContent: "center",
  },
  mascotWrapper: {
    width: 180,
    height: 180,
    borderRadius: 90,
    overflow: "hidden",
    borderWidth: 5,
    borderColor: "#fff",
    backgroundColor: COLORS.greenLeaf,
    ...shadowChunky(COLORS.greenDeep + "40"),
    marginBottom: 20,
  },
  mascotImage: {
    width: "100%",
    height: "100%",
  },
  sparkle: {
    position: "absolute",
    top: 12,
    right: 12,
    fontSize: 20,
  },
  leaf: {
    position: "absolute",
    bottom: 12,
    left: 12,
    fontSize: 16,
  },
  greeting: {
    fontFamily: FONTS.displayBlack,
    fontSize: SIZES.xl,
    color: COLORS.greenDark,
    textAlign: "center",
    lineHeight: 28,
    marginBottom: 10,
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
    paddingHorizontal: 8,
  },

  // Botao + rodape
  btnSection: {
    paddingHorizontal: 24,
    alignItems: "center",
    paddingBottom: 8,
  },
  btnGoogle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    width: "100%",
    paddingVertical: 18,
    borderRadius: 18,
    backgroundColor: COLORS.green,
    borderBottomWidth: 5,
    borderBottomColor: COLORS.greenDeep,
    shadowColor: COLORS.greenDeep,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
    marginBottom: 14,
  },
  googleIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  googleLetter: {
    fontFamily: FONTS.displayBlack,
    fontSize: 18,
    color: COLORS.green,
    lineHeight: 22,
  },
  btnGoogleText: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.body + 1,
    color: "#fff",
    letterSpacing: 0.3,
  },

  skipHint: {
    fontFamily: FONTS.body,
    fontSize: SIZES.xs,
    color: COLORS.inkMute,
    textAlign: "center",
    marginBottom: 12,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
