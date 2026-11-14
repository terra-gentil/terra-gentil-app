import React, { memo, useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
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
import { salvarConsulta } from "./src/storage/historico";
import {
  tutorialJaVisto,
  welcomeJaVisto,
} from "./src/storage/preferencias";
import { obterOuCriarNickname } from "./src/storage/nickname";
import { AppError } from "./src/errors/AppError";
import { toAppError, logError } from "./src/errors/errorHandler";
import { COLORS, FONTS } from "./src/constants/theme";
import { MASCOT_POSES } from "./src/assets/mascot";
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
const MainTabs = memo(function MainTabs({ onTirarFoto, onEscolherGaleria, onSettings, onJogar }: {
  onTirarFoto: () => void;
  onEscolherGaleria: () => void;
  onSettings: () => void;
  onJogar: () => void;
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
    setAppError(null);
  }

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

    // Resultado nao-planta
    if (resultado && !resultado.eh_planta) {
      return (
        <View style={styles.container}>
          <StatusBar style="dark" />
          <View style={styles.naoPlantaWrap}>
            <View style={styles.naoPlantaMascotWrap}>
              <Image source={MASCOT_POSES[1]} style={styles.naoPlantaMascot} resizeMode="cover" />
            </View>
            <Text style={styles.naoPlantaTitle}>Hmm...</Text>
            <Text style={styles.naoPlantaMessage}>{resultado.plano_tratamento}</Text>
            <TouchableOpacity style={styles.naoPlantaBtn} onPress={handleNovaFoto} activeOpacity={0.85}>
              <Text style={styles.naoPlantaBtnText}>Tentar outra foto</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Resultado planta
    if (resultado && resultado.eh_planta && imageUri) {
      return (
        <View style={styles.container}>
          <StatusBar style="dark" />
          <DiagnosisScreen
            imageUri={imageUri}
            resultado={resultado}
            onVoltar={handleNovaFoto}
            onNovaConsulta={handleNovaFoto}
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
  naoPlantaWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  naoPlantaMascotWrap: {
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: "hidden",
    borderWidth: 5,
    borderColor: "#fff",
    backgroundColor: COLORS.greenLeaf,
    marginBottom: 22,
    shadowColor: COLORS.greenDeep,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 0,
    elevation: 6,
  },
  naoPlantaMascot: {
    width: "100%",
    height: "100%",
  },
  naoPlantaTitle: {
    fontFamily: FONTS.displayBlack,
    fontSize: 28,
    color: COLORS.greenDark,
    marginBottom: 12,
  },
  naoPlantaMessage: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.inkSoft,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  naoPlantaBtn: {
    backgroundColor: COLORS.green,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    shadowColor: COLORS.greenDeep,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  naoPlantaBtnText: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: 16,
    color: "#fff",
  },
});
