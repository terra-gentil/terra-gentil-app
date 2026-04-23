import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";

import {
  DiagnosticoResponse,
  diagnosticarPlanta,
} from "./src/api/diagnostico";
import { ErrorScreen } from "./src/components/ErrorScreen";
import { ScannerArea } from "./src/components/ScannerArea";
import { LoadingScreen } from "./src/components/LoadingScreen";
import { HistoricoList } from "./src/components/HistoricoList";
import { ResultCard } from "./src/components/ResultCard";
import { SettingsScreen } from "./src/components/SettingsScreen";
import { TutorialScreen } from "./src/components/TutorialScreen";
import { WelcomeScreen } from "./src/components/WelcomeScreen";
import { BRANDING } from "./src/constants/branding";
import { salvarConsulta } from "./src/storage/historico";
import {
  resetarWelcome,
  tutorialJaVisto,
  welcomeJaVisto,
} from "./src/storage/preferencias";
import { AppError } from "./src/errors/AppError";
import { toAppError, logError } from "./src/errors/errorHandler";

type Tela = "boot" | "welcome" | "tutorial" | "home" | "settings";

export default function App() {
  const [tela, setTela] = useState<Tela>("boot");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<DiagnosticoResponse | null>(null);
  const [appError, setAppError] = useState<AppError | null>(null);

  useEffect(() => {
    (async () => {
      const welcomeOk = await welcomeJaVisto();
      if (!welcomeOk) {
        setTela("welcome");
        return;
      }
      const tutorialOk = await tutorialJaVisto();
      setTela(tutorialOk ? "home" : "tutorial");
    })();
  }, []);

  useEffect(() => {
    const onBack = () => {
      if (tela === "settings") {
        setTela("home");
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", onBack);
    return () => sub.remove();
  }, [tela]);

  async function handleWelcomeDone() {
    const tutorialOk = await tutorialJaVisto();
    setTela(tutorialOk ? "home" : "tutorial");
  }

  function handleTutorialDone() {
    setTela("home");
  }

  function handleAbrirSettings() {
    setTela("settings");
  }

  function handleVoltarDeSettings() {
    setTela("home");
  }

  function handleLongPressReset() {
    Alert.alert(
      "Modo desenvolvedor",
      "Resetar a tela de boas-vindas? Ela vai aparecer na proxima abertura do app.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Resetar",
          style: "destructive",
          onPress: async () => {
            await resetarWelcome();
            Alert.alert("Pronto", "Feche e abra o app pra ver a tela de boas-vindas.");
          },
        },
      ],
    );
  }

  async function handleTirarFoto() {
    const permissao = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert(
        "Permissao negada",
        "Precisamos da camera pra fotografar a planta.",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.5,
      base64: false,
    });

    if (result.canceled) return;

    const uri = result.assets[0].uri;
    setImageUri(uri);
    setResultado(null);
    await enviarParaDiagnostico(uri);
  }

  async function handleEscolherGaleria() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert(
        "Permissao negada",
        "Precisamos acessar a galeria pra escolher a imagem.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.5,
      base64: false,
    });

    if (result.canceled) return;

    const uri = result.assets[0].uri;
    setImageUri(uri);
    setResultado(null);
    await enviarParaDiagnostico(uri);
  }

  async function enviarParaDiagnostico(uri: string) {
    setLoading(true);
    try {
      const data = await diagnosticarPlanta(uri);
      setResultado(data);
      if (data.eh_planta) {
        await salvarConsulta(data, uri);
      }
    } catch (err) {
      const appErr = toAppError(err);
      logError(appErr, "diagnostico");
      setAppError(appErr);
      setImageUri(null);
    } finally {
      setLoading(false);
    }
  }

  function handleNovaFoto() {
    setImageUri(null);
    setResultado(null);
    setAppError(null);
  }

  if (tela === "boot") {
    return (
      <View style={[styles.container, styles.bootScreen]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  if (tela === "welcome") {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <WelcomeScreen onComecar={handleWelcomeDone} />
      </View>
    );
  }

  if (tela === "tutorial") {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <TutorialScreen onConcluir={handleTutorialDone} />
      </View>
    );
  }

  if (tela === "settings") {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <SettingsScreen onVoltar={handleVoltarDeSettings} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerSide} />
          <View style={styles.headerCenter}>
            <TouchableOpacity
              onLongPress={handleLongPressReset}
              delayLongPress={3000}
              activeOpacity={1}
            >
              <Text style={styles.title}>{BRANDING.appName}</Text>
            </TouchableOpacity>
            <Text style={styles.subtitle}>{BRANDING.subtitle}</Text>
          </View>
          <TouchableOpacity
            style={styles.headerSide}
            onPress={handleAbrirSettings}
            hitSlop={12}
          >
            <Text style={styles.gearIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {!imageUri && !resultado && !appError && (
          <View style={styles.initial}>
            <ScannerArea onPress={handleTirarFoto} disabled={loading} />

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleEscolherGaleria}
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>
                🖼️ Usar uma foto que ja tirei
              </Text>
            </TouchableOpacity>

            <HistoricoList />
          </View>
        )}

        {imageUri && !resultado?.eh_planta && (
          <View style={styles.imageWrapper}>
            <Image source={{ uri: imageUri }} style={styles.image} />
          </View>
        )}

        {loading && <LoadingScreen />}

        {appError && !loading && (
          <ErrorScreen
            error={appError}
            onRetry={handleNovaFoto}
            onHome={handleNovaFoto}
          />
        )}

        {resultado && !loading && !resultado.eh_planta && (
          <View style={styles.resultBox}>
            <Text style={styles.naoPlantaTitle}>Hmm...</Text>
            <Text style={styles.naoPlantaMessage}>
              {resultado.plano_tratamento}
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleNovaFoto}
            >
              <Text style={styles.primaryButtonText}>Tentar outra foto</Text>
            </TouchableOpacity>
          </View>
        )}

        {resultado && !loading && resultado.eh_planta && (
          <ResultCard
            imageUri={imageUri!}
            resultado={resultado}
            onNovaConsulta={handleNovaFoto}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f9f5",
  },
  bootScreen: {
    justifyContent: "center",
    alignItems: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerSide: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  gearIcon: {
    fontSize: 26,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1b5e20",
  },
  subtitle: {
    fontSize: 16,
    color: "#558b2f",
    marginTop: 4,
  },
  initial: {
    marginTop: 24,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#2e7d32",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
    borderColor: "#2e7d32",
  },
  secondaryButtonText: {
    color: "#2e7d32",
    fontSize: 16,
    fontWeight: "600",
  },
  imageWrapper: {
    alignItems: "center",
    marginBottom: 20,
  },
  image: {
    width: "100%",
    height: 300,
    borderRadius: 12,
    resizeMode: "cover",
  },
  resultBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  naoPlantaTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1b5e20",
    textAlign: "center",
    marginBottom: 12,
  },
  naoPlantaMessage: {
    fontSize: 15,
    color: "#424242",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
});
