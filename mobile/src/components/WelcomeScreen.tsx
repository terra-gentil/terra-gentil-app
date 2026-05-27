import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getRandomMascotPose } from "../assets/mascot";
import { COLORS, FONTS, SIZES, shadowChunky, shadowSoft } from "../constants/theme";
import { marcarWelcomeVisto } from "../storage/preferencias";
import { setAuth } from "../storage/auth";
import { FORUM_API_URL } from "../config/api";

interface Props {
  onComecar: () => void;
}

const BENEFICIOS = [
  { emoji: "🌿", texto: "Identifico a planta" },
  { emoji: "⚠️", texto: "Aviso se é tóxica pra pets" },
  { emoji: "📋", texto: "Monto plano de cuidados" },
];

const DURACAO_MS = 10000;

export function WelcomeScreen({ onComecar }: Props) {
  const insets = useSafeAreaInsets();
  const [pose] = useState(() => getRandomMascotPose());
  const disparado = useRef(false);
  const [carregando, setCarregando] = useState(false);

  const progresso = useRef(new Animated.Value(0)).current;
  const pulso = useRef(new Animated.Value(1)).current;

  async function handleComecar() {
    if (disparado.current) return;
    disparado.current = true;
    await marcarWelcomeVisto();
    onComecar();
  }

  useEffect(() => {
    Animated.timing(progresso, {
      toValue: 1,
      duration: DURACAO_MS,
      useNativeDriver: false,
    }).start();

    const timer = setTimeout(() => handleComecar(), DURACAO_MS);

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
    <View style={[styles.safeWrap, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 16) }]}>
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

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={handleComecar} style={styles.tapArea}>
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
              Tire uma foto da sua planta e eu te conto tudo: nome, cuidado, e se tem algum probleminha de saúde.
            </Text>
          </View>
        </Pressable>

        {/* Botao Google — no meio, em cima dos cards de beneficios */}
        <Animated.View style={[styles.btnGoogleWrap, { transform: [{ scale: pulso }] }]}>
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

        <Pressable onPress={handleComecar} style={styles.tapArea}>
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

          <Text style={styles.tapHint}>ou toque para pular 👆</Text>

          {/* Dots */}
          <View style={styles.dotsRow}>
            <Text style={styles.dotInactive}>▪</Text>
            <Text style={styles.dotInactive}>▪</Text>
            <Text style={styles.dotActive}>●</Text>
            <Text style={styles.dotInactive}>▪</Text>
            <Text style={styles.dotInactive}>▪</Text>
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeWrap: {
    flex: 1,
    backgroundColor: COLORS.greenSoft,
  },

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

  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: "center",
  },
  tapArea: {
    width: "100%",
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

  // Botao Google — entre o texto e os cards
  btnGoogleWrap: {
    width: "100%",
    marginBottom: 20,
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
  tapHint: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.body,
    color: COLORS.green,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 8,
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
