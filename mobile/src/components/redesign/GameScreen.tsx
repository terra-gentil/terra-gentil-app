import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import * as ScreenOrientation from "expo-screen-orientation";
import { StatusBar } from "expo-status-bar";
import { X } from "lucide-react-native";
import { COLORS, FONTS, SIZES } from "../../constants/theme";

const GAME_URL = "https://terra-gentil.github.io/terra-gentil-game/";

interface GameScreenProps {
  onClose: () => void;
  nickname?: string;
}

export default function GameScreen({ onClose, nickname }: GameScreenProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  // Trava landscape ao entrar e libera ao sair
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      } catch (err) {
        if (mounted) console.log("[GameScreen] erro ao travar orientacao:", err);
      }
    })();
    return () => {
      mounted = false;
      ScreenOrientation.unlockAsync().catch(() => {
        // se falhar, restaura portrait explicito
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT).catch(() => {});
      });
    };
  }, []);

  // Botao voltar do Android sai do jogo
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [onClose]);

  const url = buildGameUrl(nickname);

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <WebView
        source={{ uri: url }}
        style={styles.webview}
        onLoadEnd={() => setLoaded(true)}
        onError={() => setErrored(true)}
        onHttpError={() => setErrored(true)}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={["https://*"]}
        setSupportMultipleWindows={false}
        // Evita que o usuario navegue pra fora do jogo dentro da WebView
        onShouldStartLoadWithRequest={(req) => req.url.startsWith(GAME_URL)}
      />

      {!loaded && !errored && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={COLORS.green} />
          <Text style={styles.loadingText}>Carregando o jogo...</Text>
        </View>
      )}

      {errored && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorTitle}>Nao consegui abrir o jogo</Text>
          <Text style={styles.errorDesc}>Verifique sua conexao e tente de novo.</Text>
          <TouchableOpacity style={styles.errorBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.errorBtnText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={styles.closeBtn}
        onPress={onClose}
        activeOpacity={0.8}
        accessibilityLabel="Sair do jogo"
      >
        <X size={20} color="#fff" strokeWidth={2.4} />
      </TouchableOpacity>
    </View>
  );
}

function buildGameUrl(nickname?: string): string {
  if (!nickname) return GAME_URL;
  const trimmed = nickname.trim().toUpperCase();
  if (!/^[A-Z0-9_]{3,12}$/.test(trimmed)) return GAME_URL;
  return `${GAME_URL}?nickname=${encodeURIComponent(trimmed)}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  webview: {
    flex: 1,
    backgroundColor: "#000",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.bg,
    gap: 12,
  },
  loadingText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: SIZES.body,
    color: COLORS.greenDark,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.bg,
    paddingHorizontal: 32,
    gap: 8,
  },
  errorTitle: {
    fontFamily: FONTS.displayBlack,
    fontSize: SIZES.xl,
    color: COLORS.greenDark,
    textAlign: "center",
  },
  errorDesc: {
    fontFamily: FONTS.body,
    fontSize: SIZES.body,
    color: COLORS.inkSoft,
    textAlign: "center",
    marginBottom: 12,
  },
  errorBtn: {
    backgroundColor: COLORS.green,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  errorBtnText: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.body,
    color: "#fff",
  },
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
});
