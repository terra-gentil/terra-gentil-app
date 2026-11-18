import React, { memo, useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";
// Fontes importadas por peso. O import pela raiz do pacote puxava os 30 arquivos .ttf
// das duas familias (3,5 MB) pro bundle e pro update OTA, e o app usa so estes 8.
import { useFonts } from "@expo-google-fonts/nunito/useFonts";
import { Nunito_700Bold } from "@expo-google-fonts/nunito/700Bold";
import { Nunito_800ExtraBold } from "@expo-google-fonts/nunito/800ExtraBold";
import { Nunito_900Black } from "@expo-google-fonts/nunito/900Black";
import { PlusJakartaSans_400Regular } from "@expo-google-fonts/plus-jakarta-sans/400Regular";
import { PlusJakartaSans_500Medium } from "@expo-google-fonts/plus-jakarta-sans/500Medium";
import { PlusJakartaSans_600SemiBold } from "@expo-google-fonts/plus-jakarta-sans/600SemiBold";
import { PlusJakartaSans_700Bold } from "@expo-google-fonts/plus-jakarta-sans/700Bold";
import { PlusJakartaSans_800ExtraBold } from "@expo-google-fonts/plus-jakarta-sans/800ExtraBold";

import {
  DiagnosticoResponse,
  diagnosticarPlanta,
} from "./src/api/diagnostico";
import { ErrorScreen } from "./src/components/ErrorScreen";
import { LoadingScreen } from "./src/components/LoadingScreen";
import { TutorialScreen } from "./src/components/TutorialScreen";
import { WelcomeScreen } from "./src/components/WelcomeScreen";
import HomeScreen from "./src/components/redesign/HomeScreen";
import DiagnosisScreen from "./src/components/redesign/DiagnosisScreen";
import VideosScreen from "./src/components/redesign/VideosScreen";
import ProfileScreen from "./src/components/redesign/ProfileScreen";
import CommunityScreen from "./src/components/redesign/CommunityScreen";
import GameScreen from "./src/components/redesign/GameScreen";
import { ConsultaHistorico, carregarLaudo, salvarConsulta } from "./src/storage/historico";
import { registrarLaudo } from "./src/storage/plantasEmCuidado";
import {
  tutorialJaVisto,
  welcomeJaVisto,
} from "./src/storage/preferencias";
import { obterOuCriarNickname } from "./src/storage/nickname";
import { AppError } from "./src/errors/AppError";
import { toAppError, logError } from "./src/errors/errorHandler";
import { COLORS } from "./src/constants/theme";
import EbooksScreen from "./src/components/redesign/EbooksScreen";
import PromotionsScreen from "./src/components/redesign/PromotionsScreen";
import MainTabBar from "./src/components/redesign/MainTabBar";
import { NotifProvider } from "./src/context/NotifContext";
import ConfiguracoesModal from "./src/components/redesign/ConfiguracoesModal";
import LoginModal from "./src/components/redesign/LoginModal";
import { registrarPushToken as registrarTokenNaApi } from "./src/api/notificacoes";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const navigationRef = createNavigationContainerRef<any>();

async function pedirPermissaoERegistrarPush() {
  try {
    if (!Device.isDevice) return;
    const { status: atual } = await Notifications.getPermissionsAsync();
    const status =
      atual !== "granted"
        ? (await Notifications.requestPermissionsAsync()).status
        : atual;
    if (status !== "granted") return;
    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId: "f5d75a08-a9e1-421a-ab64-c77097cb19a0",
    });
    await registrarTokenNaApi(token, Platform.OS as "ios" | "android");
  } catch {
    // silencioso — simuladores nao tem push token fisico
  }
}

const Tab = createBottomTabNavigator();

function CommunityTabScreen() { return <CommunityScreen />; }
function VideosTab() { return <VideosScreen />; }

// Main tabs com FAB. Memoizado: com os handlers estaveis do App, abrir
// Configuracoes ou Login nao re-renderiza mais as abas montadas.
const MainTabs = memo(function MainTabs({ onTirarFoto, onEscolherGaleria, onSettings, onJogar, onAbrirLaudo }: {
  onTirarFoto: () => void;
  onEscolherGaleria: () => void;
  onSettings: () => void;
  onJogar: () => void;
  onAbrirLaudo: (consultaId: string) => void;
}) {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <MainTabBar {...props} onFabPress={onTirarFoto} />}
    >
      <Tab.Screen name="HomeTab">
        {() => (
          <HomeScreen
            onTirarFoto={onTirarFoto}
            onEscolherGaleria={onEscolherGaleria}
            onSettings={onSettings}
            onJogar={onJogar}
            onAbrirLaudo={onAbrirLaudo}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="CommunityTab" component={CommunityTabScreen} />
      {/* Abas preguicosas (padrao do navegador): promocoes e ebooks so montam na primeira visita. */}
      <Tab.Screen name="PromosTab" component={PromotionsScreen} />
      <Tab.Screen name="EbooksTab" component={EbooksScreen} />
      <Tab.Screen name="VideosTab" component={VideosTab} />
      <Tab.Screen name="ProfileTab">
        {() => <ProfileScreen onSettings={onSettings} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
});

export default function App() {
  const [fontsLoaded] = useFonts({
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  const [bootDone, setBootDone] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [configAberta, setConfigAberta] = useState(false);
  const [loginAberto, setLoginAberto] = useState(false);
  const [gameNickname, setGameNickname] = useState<string | undefined>(undefined);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<DiagnosticoResponse | null>(null);
  const [consulta, setConsulta] = useState<ConsultaHistorico | null>(null);
  const [appError, setAppError] = useState<AppError | null>(null);

  useEffect(() => {
    (async () => {
      // As duas leituras em paralelo: uma ida ao storage a menos antes da primeira tela.
      const [welcomeOk, tutorialOk] = await Promise.all([welcomeJaVisto(), tutorialJaVisto()]);
      if (!welcomeOk) {
        setShowWelcome(true);
        setBootDone(true);
        return;
      }
      if (!tutorialOk) {
        setShowTutorial(true);
      }
      setBootDone(true);
      pedirPermissaoERegistrarPush();
    })();

    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      if (navigationRef.isReady()) {
        navigationRef.navigate("HomeTab");
      }
    });
    return () => sub.remove();
  }, []);

  async function handleWelcomeDone() {
    setShowWelcome(false);
    const tutorialOk = await tutorialJaVisto();
    if (!tutorialOk) {
      setShowTutorial(true);
    }
  }

  function handleTutorialDone() {
    setShowTutorial(false);
  }

  const enviarParaDiagnostico = useCallback(async (uri: string) => {
    setLoading(true);
    try {
      const data = await diagnosticarPlanta(uri);
      // Salva antes de mostrar: a tela usa a consulta para o antes e depois e os lembretes
      let salva: ConsultaHistorico | null = null;
      if (data.eh_planta) {
        salva = await salvarConsulta(data, uri);
        await registrarLaudo(data, salva);
      }
      setConsulta(salva);
      setResultado(data);
    } catch (err) {
      const appErr = toAppError(err);
      logError(appErr, "diagnostico");
      setAppError(appErr);
      setImageUri(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleTirarFoto = useCallback(async () => {
    const permissao = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert("Permissão negada", "Precisamos da câmera pra fotografar a planta.");
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
    setAppError(null);
    await enviarParaDiagnostico(uri);
  }, [enviarParaDiagnostico]);

  const handleEscolherGaleria = useCallback(async () => {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert("Permissão negada", "Precisamos acessar a galeria pra escolher a imagem.");
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
    setAppError(null);
    await enviarParaDiagnostico(uri);
  }, [enviarParaDiagnostico]);

  function handleNovaFoto() {
    setImageUri(null);
    setResultado(null);
    setConsulta(null);
    setAppError(null);
  }

  // "Ver laudo" das plantas em cuidado: reabre o resultado salvo no historico
  const handleAbrirLaudo = useCallback(async (consultaId: string) => {
    const salvo = await carregarLaudo(consultaId);
    if (!salvo) {
      Alert.alert("Laudo não encontrado", "Esse laudo já saiu do histórico. Tire uma nova foto da planta.");
      return;
    }
    setAppError(null);
    setConsulta(salvo.consulta);
    setImageUri(salvo.consulta.imageUri);
    setResultado(salvo.resultado);
  }, []);

  const handleSettings = useCallback(() => {
    setConfigAberta(true);
  }, []);

  const handleJogar = useCallback(async () => {
    try {
      const nick = await obterOuCriarNickname();
      setGameNickname(nick);
    } catch (err) {
      console.log("[App] erro ao obter nickname do jogo:", err);
      setGameNickname(undefined);
    }
    setShowGame(true);
  }, []);

  function handleSairDoJogo() {
    setShowGame(false);
  }

  // Determina o conteudo da tela
  function renderContent() {
    // Boot / fonts
    if (!fontsLoaded || !bootDone) {
      return (
        <View style={[styles.container, styles.bootScreen]}>
          <StatusBar style="dark" />
          <ActivityIndicator size="large" color={COLORS.green} />
        </View>
      );
    }

    // Welcome
    if (showWelcome) {
      return (
        <View style={styles.container}>
          <StatusBar style="dark" />
          <WelcomeScreen onComecar={handleWelcomeDone} />
        </View>
      );
    }

    // Jogo (WebView fullscreen). Renderiza acima das outras telas pra
    // pausar o fluxo principal sem desmontar o NavigationContainer.
    if (showGame) {
      return <GameScreen onClose={handleSairDoJogo} nickname={gameNickname} />;
    }

    // Tutorial
    if (showTutorial) {
      return (
        <View style={styles.container}>
          <StatusBar style="dark" />
          <TutorialScreen onConcluir={handleTutorialDone} />
        </View>
      );
    }

    // Loading
    if (loading) {
      return (
        <View style={styles.container}>
          <StatusBar style="dark" />
          <LoadingScreen imageUri={imageUri} />
        </View>
      );
    }

    // Erro
    if (appError) {
      return (
        <View style={styles.container}>
          <StatusBar style="dark" />
          <ErrorScreen error={appError} onRetry={handleNovaFoto} onHome={handleNovaFoto} />
        </View>
      );
    }

    // Resultado (planta ou foto sem planta: a tela trata os dois estados)
    if (resultado && imageUri) {
      return (
        <View style={styles.container}>
          <StatusBar style="dark" />
          <DiagnosisScreen
            imageUri={imageUri}
            resultado={resultado}
            onVoltar={handleNovaFoto}
            onNovaConsulta={handleNovaFoto}
            consulta={consulta}
          />
        </View>
      );
    }

    // Main app com tabs
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <NavigationContainer ref={navigationRef}>
          <MainTabs
            onTirarFoto={handleTirarFoto}
            onEscolherGaleria={handleEscolherGaleria}
            onSettings={handleSettings}
            onJogar={handleJogar}
            onAbrirLaudo={handleAbrirLaudo}
          />
        </NavigationContainer>
        <ConfiguracoesModal
          visible={configAberta}
          onClose={() => setConfigAberta(false)}
          onLogout={() => setConfigAberta(false)}
          onLogin={() => { setConfigAberta(false); setLoginAberto(true); }}
          onVerTutorial={() => { setConfigAberta(false); setShowTutorial(true); }}
        />
        <LoginModal
          visible={loginAberto}
          onClose={() => setLoginAberto(false)}
          onLogin={() => { setLoginAberto(false); pedirPermissaoERegistrarPush(); }}
        />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NotifProvider>
        {renderContent()}
      </NotifProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  bootScreen: {
    justifyContent: "center",
    alignItems: "center",
  },
});
