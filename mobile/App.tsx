import React, { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useFonts, Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black } from "@expo-google-fonts/nunito";
import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold } from "@expo-google-fonts/plus-jakarta-sans";

import {
  DiagnosticoResponse,
  diagnosticarPlanta,
} from "./src/api/diagnostico";
import { ErrorScreen } from "./src/components/ErrorScreen";
import { LoadingScreen } from "./src/components/LoadingScreen";
import { SettingsScreen } from "./src/components/SettingsScreen";
import { TutorialScreen } from "./src/components/TutorialScreen";
import { WelcomeScreen } from "./src/components/WelcomeScreen";
import HomeScreen from "./src/components/redesign/HomeScreen";
import DiagnosisScreen from "./src/components/redesign/DiagnosisScreen";
import { salvarConsulta } from "./src/storage/historico";
import {
  resetarWelcome,
  tutorialJaVisto,
  welcomeJaVisto,
} from "./src/storage/preferencias";
import { AppError } from "./src/errors/AppError";
import { toAppError, logError } from "./src/errors/errorHandler";
import { COLORS, FONTS } from "./src/constants/theme";
import { MASCOT_POSES } from "./src/assets/mascot";
import { Home, Users, Tv, User, Camera } from "lucide-react-native";

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Placeholder pra telas futuras
function PlaceholderScreen({ title }: { title: string }) {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderEmoji}>🌱</Text>
      <Text style={styles.placeholderTitle}>{title}</Text>
      <Text style={styles.placeholderDesc}>Em breve!</Text>
    </View>
  );
}

function CommunityPlaceholder() { return <PlaceholderScreen title="Comunidade" />; }
function VideosPlaceholder() { return <PlaceholderScreen title="Videos" />; }
function ProfilePlaceholder() { return <PlaceholderScreen title="Perfil" />; }

// TabBar customizado com FAB central
const TAB_ICONS = {
  HomeTab: Home,
  CommunityTab: Users,
  VideosTab: Tv,
  ProfileTab: User,
} as const;

const TAB_LABELS = {
  HomeTab: "Inicio",
  CommunityTab: "Comunidade",
  VideosTab: "Videos",
  ProfileTab: "Eu",
} as const;

const TAB_ORDER = ["HomeTab", "CommunityTab", "fab", "VideosTab", "ProfileTab"] as const;

function CustomTabBar({ state, navigation, onFabPress }: any) {
  return (
    <View style={tabStyles.container}>
      {/* FAB central */}
      <TouchableOpacity onPress={onFabPress} style={tabStyles.fab} activeOpacity={0.8}>
        <Camera size={28} color="#fff" strokeWidth={2.2} />
      </TouchableOpacity>

      <View style={tabStyles.tabRow}>
        {TAB_ORDER.map((route) => {
          if (route === "fab") {
            return <View key="fab" style={{ flex: 1 }} />;
          }
          const routeIndex = state.routes.findIndex((r: any) => r.name === route);
          const isActive = state.index === routeIndex;
          const IconComponent = TAB_ICONS[route as keyof typeof TAB_ICONS];
          const label = TAB_LABELS[route as keyof typeof TAB_LABELS];
          const color = isActive ? COLORS.green : COLORS.inkMute;
          return (
            <TouchableOpacity
              key={route}
              onPress={() => navigation.navigate(route)}
              style={tabStyles.tab}
            >
              <IconComponent size={24} color={color} strokeWidth={2.2} />
              <Text style={[tabStyles.tabLabel, isActive && tabStyles.tabLabelActive]}>{label}</Text>
              {isActive && <View style={tabStyles.tabDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// Main tabs com FAB
function MainTabs({ onTirarFoto, onEscolherGaleria, onSettings }: {
  onTirarFoto: () => void;
  onEscolherGaleria: () => void;
  onSettings: () => void;
}) {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} onFabPress={onTirarFoto} />}
    >
      <Tab.Screen name="HomeTab">
        {() => (
          <HomeScreen
            onTirarFoto={onTirarFoto}
            onEscolherGaleria={onEscolherGaleria}
            onSettings={onSettings}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="CommunityTab" component={CommunityPlaceholder} />
      <Tab.Screen name="VideosTab" component={VideosPlaceholder} />
      <Tab.Screen name="ProfileTab" component={ProfilePlaceholder} />
    </Tab.Navigator>
  );
}

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
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<DiagnosticoResponse | null>(null);
  const [appError, setAppError] = useState<AppError | null>(null);

  useEffect(() => {
    (async () => {
      const welcomeOk = await welcomeJaVisto();
      if (!welcomeOk) {
        setShowWelcome(true);
        setBootDone(true);
        return;
      }
      const tutorialOk = await tutorialJaVisto();
      if (!tutorialOk) {
        setShowTutorial(true);
      }
      setBootDone(true);
    })();
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

  async function handleTirarFoto() {
    const permissao = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert("Permissao negada", "Precisamos da camera pra fotografar a planta.");
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
  }

  async function handleEscolherGaleria() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert("Permissao negada", "Precisamos acessar a galeria pra escolher a imagem.");
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

  function handleSettings() {
    // Navegado via navigation no futuro. Por ora placeholder
  }

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
        <LoadingScreen />
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
          <Text style={styles.naoPlantaTitle}>Hmm...</Text>
          <Text style={styles.naoPlantaMessage}>{resultado.plano_tratamento}</Text>
          <TouchableOpacity style={styles.naoPlantaBtn} onPress={handleNovaFoto}>
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
      <NavigationContainer>
        <MainTabs
          onTirarFoto={handleTirarFoto}
          onEscolherGaleria={handleEscolherGaleria}
          onSettings={handleSettings}
        />
      </NavigationContainer>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  container: {
    position: "relative",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingBottom: 6,
  },
  fab: {
    position: "absolute",
    left: "50%",
    top: -28,
    marginLeft: -32,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.green,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.greenDeep,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
    zIndex: 10,
  },
  fabIconWrap: {
    // placeholder se precisar de wrapper
  },
  tabRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 68,
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    gap: 4,
  },
  tabLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 11,
    color: COLORS.inkMute,
  },
  tabLabelActive: {
    fontFamily: FONTS.bodyExtraBold,
    color: COLORS.green,
  },
  tabDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.green,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  bootScreen: {
    justifyContent: "center",
    alignItems: "center",
  },
  placeholder: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  placeholderEmoji: {
    fontSize: 48,
  },
  placeholderTitle: {
    fontFamily: FONTS.displayBlack,
    fontSize: 22,
    color: COLORS.greenDark,
  },
  placeholderDesc: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.inkMute,
  },
  naoPlantaWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
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
