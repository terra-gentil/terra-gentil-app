import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Linking from "expo-linking";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { COLORS, FONTS, SIZES, shadowChunky, shadowSoft } from "../../constants/theme";
import { setAuth, AuthUser } from "../../storage/auth";
import { FORUM_API_URL } from "../../config/api";

interface Props {
  visible: boolean;
  onClose: () => void;
  onLogin: (user: AuthUser) => void;
}

export default function LoginModal({ visible, onClose, onLogin }: Props) {
  const insets = useSafeAreaInsets();
  const [carregando, setCarregando] = useState<"google" | "apple" | null>(null);
  const [appleDisponivel, setAppleDisponivel] = useState(false);

  useEffect(() => {
    if (Platform.OS === "ios") {
      AppleAuthentication.isAvailableAsync().then(setAppleDisponivel).catch(() => {});
    }
  }, []);

  async function handleGoogle() {
    setCarregando("google");
    try {
      const redirectUri = Linking.createURL("auth");
      console.log("[login] redirectUri gerado:", redirectUri);

      const loginUrl = `${FORUM_API_URL}/auth/google/login/mobile?redirect_uri=${encodeURIComponent(redirectUri)}`;
      console.log("[login] abrindo:", loginUrl);

      const result = await WebBrowser.openAuthSessionAsync(loginUrl, redirectUri);
      console.log("[login] resultado:", JSON.stringify(result));

      if (result.type !== "success") {
        console.log("[login] cancelado ou falhou, type=", result.type);
        return;
      }

      console.log("[login] URL retornada:", result.url);
      const parsed = Linking.parse(result.url);
      console.log("[login] params parseados:", JSON.stringify(parsed.queryParams));

      const params = parsed.queryParams ?? {};
      const token = params["token"] as string | undefined;
      const user_id = params["user_id"] as string | undefined;
      const name = params["name"] as string | undefined;
      const avatar = params["avatar"] as string | undefined;

      if (!token || !user_id) {
        console.log("[login] token ou user_id ausente, params=", JSON.stringify(params));
        Alert.alert("Erro", "Não foi possível completar o login. Tente de novo.");
        return;
      }

      const user: AuthUser = {
        id: user_id,
        display_name: name ? decodeURIComponent(name) : "Usuário",
        avatar_url: avatar ? decodeURIComponent(avatar) : null,
      };
      await setAuth(token, user);
      console.log("[login] sucesso! usuario:", user.display_name);
      onLogin(user);
    } catch (err) {
      console.log("[login] google erro:", err);
      Alert.alert("Erro", "Falha ao conectar com Google. Tente de novo.");
    } finally {
      setCarregando(null);
    }
  }

  async function handleApple() {
    setCarregando("apple");
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const full_name = [
        credential.fullName?.givenName,
        credential.fullName?.familyName,
      ]
        .filter(Boolean)
        .join(" ")
        .trim() || null;

      const resp = await fetch(`${FORUM_API_URL}/auth/apple/mobile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identity_token: credential.identityToken,
          full_name,
        }),
      });

      if (!resp.ok) {
        const txt = await resp.text().catch(() => String(resp.status));
        throw new Error(txt);
      }

      const data = await resp.json() as {
        token: string;
        user_id: string;
        display_name: string;
        avatar_url: string | null;
      };

      const user: AuthUser = {
        id: data.user_id,
        display_name: data.display_name,
        avatar_url: data.avatar_url,
      };
      await setAuth(data.token, user);
      onLogin(user);
    } catch (err: unknown) {
      if ((err as { code?: string })?.code === "ERR_REQUEST_CANCELED") return;
      console.log("[login] apple erro:", err);
      Alert.alert("Erro", "Falha ao conectar com Apple. Tente de novo.");
    } finally {
      setCarregando(null);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.handle} />

          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={10}>
            <X size={20} color={COLORS.inkSoft} strokeWidth={2.4} />
          </TouchableOpacity>

          <Text style={styles.titulo}>Entre na comunidade</Text>
          <Text style={styles.subtitulo}>
            Para publicar ou comentar, entre com sua conta.
          </Text>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleGoogle}
            disabled={carregando !== null}
            style={[styles.btn, styles.btnGoogle]}
          >
            {carregando === "google" ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.btnText}>Continuar com Google</Text>
              </>
            )}
          </TouchableOpacity>

          {appleDisponivel && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleApple}
              disabled={carregando !== null}
              style={[styles.btn, styles.btnApple]}
            >
              {carregando === "apple" ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.appleIcon}></Text>
                  <Text style={[styles.btnText, { color: "#fff" }]}>
                    Continuar com Apple
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <Text style={styles.aviso}>
            Ao entrar, você concorda com nossos termos de uso e política de privacidade.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    ...shadowChunky(),
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.divider,
    marginBottom: 16,
  },
  closeBtn: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  titulo: {
    fontFamily: FONTS.displayBlack,
    fontSize: SIZES.xl,
    color: COLORS.greenDark,
    marginBottom: 6,
  },
  subtitulo: {
    fontFamily: FONTS.body,
    fontSize: SIZES.body,
    color: COLORS.inkSoft,
    marginBottom: 28,
    lineHeight: 20,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 12,
    ...shadowSoft(),
  },
  btnGoogle: {
    backgroundColor: COLORS.green,
  },
  btnApple: {
    backgroundColor: "#000",
  },
  btnText: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.body,
    color: "#fff",
    letterSpacing: 0.3,
  },
  googleIcon: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: 20,
    color: "#fff",
    lineHeight: 24,
  },
  appleIcon: {
    fontSize: 20,
    color: "#fff",
    lineHeight: 24,
  },
  aviso: {
    fontFamily: FONTS.body,
    fontSize: SIZES.xs,
    color: COLORS.inkMute,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 16,
  },
});
