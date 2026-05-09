import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Download, X, Check } from "lucide-react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { COLORS, FONTS, SIZES, shadowChunky } from "../../constants/theme";
import { Ebook } from "../../data/ebooks";

interface Props {
  visible: boolean;
  ebook: Ebook | null;
  onClose: () => void;
}

type DownloadState = "idle" | "baixando" | "concluido";

function slug(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function viewerUrl(pdfUrl: string): string {
  if (Platform.OS === "android") {
    return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUrl)}`;
  }
  return pdfUrl;
}

const LOADING_MIN_MS = 10000;

export default function EbookViewerModal({ visible, ebook, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [carregando, setCarregando] = useState(true);
  const [download, setDownload] = useState<DownloadState>("idle");
  const startedAt = useRef<number>(Date.now());
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible && ebook) {
      setCarregando(true);
      setDownload("idle");
      startedAt.current = Date.now();
    }
    return () => {
      if (fallbackTimer.current) {
        clearTimeout(fallbackTimer.current);
        fallbackTimer.current = null;
      }
    };
  }, [visible, ebook?.id]);

  function pararLoading() {
    const elapsed = Date.now() - startedAt.current;
    const restante = LOADING_MIN_MS - elapsed;
    if (fallbackTimer.current) {
      clearTimeout(fallbackTimer.current);
      fallbackTimer.current = null;
    }
    if (restante <= 0) {
      setCarregando(false);
    } else {
      fallbackTimer.current = setTimeout(() => {
        setCarregando(false);
        fallbackTimer.current = null;
      }, restante);
    }
  }

  function iniciarLoading() {
    if (fallbackTimer.current) {
      clearTimeout(fallbackTimer.current);
      fallbackTimer.current = null;
    }
    setCarregando(true);
    startedAt.current = Date.now();
  }

  if (!ebook) return null;

  async function abrirNoNavegador() {
    if (!ebook) return;
    try {
      const ok = await Linking.canOpenURL(ebook.pdf);
      if (!ok) throw new Error("Linking nao pode abrir a URL");
      await Linking.openURL(ebook.pdf);
    } catch (err) {
      console.log("[ebook] fallback openURL falhou:", err);
      Alert.alert(
        "Não consegui abrir",
        "Tenta de novo com o celular conectado à internet.",
        [{ text: "Combinado", style: "default" }],
      );
    }
  }

  async function handleBaixar() {
    if (!ebook || download === "baixando") return;
    setDownload("baixando");

    try {
      console.log("[ebook] iniciando download:", ebook.pdf);
      console.log("[ebook] cacheDirectory:", FileSystem.cacheDirectory);

      if (!FileSystem.cacheDirectory) {
        throw new Error("cacheDirectory indisponivel");
      }

      const nomeArquivo = `terra-gentil-${slug(ebook.titulo)}.pdf`;
      const destino = FileSystem.cacheDirectory + nomeArquivo;

      console.log("[ebook] baixando para:", destino);
      const resultado = await FileSystem.downloadAsync(ebook.pdf, destino);
      console.log("[ebook] resultado:", resultado.status, resultado.uri);

      if (resultado.status !== 200) {
        throw new Error(`Servidor respondeu ${resultado.status}`);
      }

      setDownload("concluido");

      const podeCompartilhar = await Sharing.isAvailableAsync();
      console.log("[ebook] sharing disponivel:", podeCompartilhar);

      if (podeCompartilhar) {
        try {
          await Sharing.shareAsync(resultado.uri, {
            dialogTitle: `Salvar ${ebook.titulo}`,
            mimeType: "application/pdf",
            UTI: "com.adobe.pdf",
          });
        } catch (shareErr) {
          console.log("[ebook] sharing erro:", shareErr);
          // sharing cancelado pelo user nao eh erro real
        }
      } else {
        Alert.alert(
          "PDF baixado no app",
          "O sharing nativo não está disponível. Vou abrir o PDF no navegador pra você baixar de lá.",
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Abrir no navegador", onPress: abrirNoNavegador },
          ],
        );
      }

      setTimeout(() => setDownload("idle"), 1500);
    } catch (err: any) {
      const detalhe = err?.message ? String(err.message) : String(err);
      console.log("[ebook] erro ao baixar:", detalhe, err);
      setDownload("idle");
      Alert.alert(
        "Erro no download",
        `${detalhe}\n\nQuer abrir direto no navegador? Lá você baixa do mesmo jeito.`,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Abrir no navegador", onPress: abrirNoNavegador },
        ],
      );
    }
  }

  const baixando = download === "baixando";
  const concluido = download === "concluido";

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={10} style={styles.closeBtn}>
            <X size={22} color="#fff" strokeWidth={2.4} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerLabel} numberOfLines={1}>
              EBOOK GRÁTIS · DOUTOR GENTILEZA
            </Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {ebook.emoji} {ebook.titulo}
            </Text>
          </View>
        </View>

        {/* Viewer */}
        <View style={styles.viewerWrap}>
          <WebView
            source={{ uri: viewerUrl(ebook.pdf) }}
            style={styles.webview}
            onLoadStart={iniciarLoading}
            onLoadEnd={pararLoading}
            startInLoadingState={false}
            javaScriptEnabled
            domStorageEnabled
            allowsBackForwardNavigationGestures
            originWhitelist={["*"]}
          />
          {carregando && (
            <View style={styles.loadingOverlay} pointerEvents="none">
              <View style={styles.loadingCard}>
                <ActivityIndicator size="large" color={COLORS.amber} />
                <Text style={styles.loadingText}>Abrindo o guia...</Text>
                <Text style={styles.loadingSub}>
                  Os PDFs grandes levam uns segundos. Já já o seu guia aparece aqui.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Footer com botao baixar */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleBaixar}
            disabled={baixando}
            style={[
              styles.btnBaixar,
              concluido && { backgroundColor: COLORS.green, shadowColor: COLORS.greenDeep },
            ]}
          >
            <View style={styles.btnInner}>
              {baixando ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : concluido ? (
                <Check size={22} color="#fff" strokeWidth={2.6} />
              ) : (
                <Download size={22} color="#fff" strokeWidth={2.4} />
              )}
              <Text style={styles.btnText}>
                {baixando
                  ? "Baixando seu guia..."
                  : concluido
                  ? "Pronto! Veja onde salvar"
                  : "Baixar PDF grátis"}
              </Text>
            </View>
            {!baixando && !concluido && (
              <Text style={styles.btnSub}>Pra ler offline ou compartilhar</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const FUNDO = "#0F1B15";

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: FUNDO,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: FUNDO,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  headerLabel: {
    fontFamily: FONTS.displayBlack,
    fontSize: 9,
    color: COLORS.amber,
    letterSpacing: 1,
  },
  headerTitle: {
    fontFamily: FONTS.displayBlack,
    fontSize: SIZES.body + 1,
    color: "#fff",
    marginTop: 2,
  },
  viewerWrap: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  webview: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: FUNDO,
    zIndex: 5,
    paddingHorizontal: 32,
  },
  loadingCard: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.35)",
    maxWidth: 320,
  },
  loadingText: {
    fontFamily: FONTS.displayBlack,
    fontSize: SIZES.lg,
    color: COLORS.amber,
    marginTop: 14,
    textAlign: "center",
  },
  loadingSub: {
    fontFamily: FONTS.body,
    fontSize: SIZES.smPlus,
    color: "rgba(255,255,255,0.7)",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    backgroundColor: FUNDO,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  btnBaixar: {
    backgroundColor: COLORS.amber,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    ...shadowChunky("#b45309"),
  },
  btnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  btnText: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.body + 2,
    color: "#fff",
    letterSpacing: 0.3,
  },
  btnSub: {
    fontFamily: FONTS.body,
    fontSize: SIZES.xs,
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
  },
});
