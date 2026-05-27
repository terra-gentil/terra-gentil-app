import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Platform,
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

    const timer = setTimeout(() => {
      handleComecar();
    }, DURACAO_MS);

    return () => {
      clearTimeout(timer);
      progresso.stopAnimation();
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
      {/* Barra de progresso do countdown */}
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
        </Pressable>

        {/* Botao Google — fora do Pressable para nao conflitar com o tap-to-skip */}
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

        <Text style={styles.skipHint}>ou toque em qualquer lugar para pular</Text>

        {/* Dots */}
        <View style={styles.dotsRow}>
          <Text style={styles.dotInactive}>▪</Text>
          <Text style={styles.dotInactive}>▪</Text>
          <Text style={styles.dotActive}>●</Text>
          <Text style={styles.dotInactive}>▪</Text>
          <Text style={styles.dotInactive}>▪</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeWrap: {
    flex: 1,
    backgroundColor: COLORS.greenSoft,
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

  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
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
  tapArea: {
    width: "100%",
    alignItems: "center",
  },

  // Google button
  btnGoogle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    width: "100%",
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: COLORS.green,
    borderBottomWidth: 4,
    borderBottomColor: COLORS.greenDeep,
    shadowColor: COLORS.greenDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.7,
    shadowRadius: 0,
    elevation: 4,
    marginBottom: 12,
  },
  googleIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  googleLetter: {
    fontFamily: FONTS.displayBlack,
    fontSize: 16,
    color: COLORS.green,
    lineHeight: 20,
  },
  btnGoogleText: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.body,
    color: "#fff",
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
    marginTop: 4,
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
