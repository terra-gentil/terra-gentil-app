import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_WELCOME = "@terragentil:welcome_visto";
const KEY_TUTORIAL = "@terragentil:tutorial_visto";

export async function welcomeJaVisto(): Promise<boolean> {
  try {
    const valor = await AsyncStorage.getItem(KEY_WELCOME);
    return valor === "true";
  } catch (err) {
    console.log("[preferencias] erro ao ler welcome:", err);
    return false;
  }
}

export async function marcarWelcomeVisto(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY_WELCOME, "true");
    console.log("[preferencias] welcome marcado como visto");
  } catch (err) {
    console.log("[preferencias] erro ao marcar welcome:", err);
  }
}

export async function resetarWelcome(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY_WELCOME);
    console.log("[preferencias] welcome resetado");
  } catch (err) {
    console.log("[preferencias] erro ao resetar welcome:", err);
  }
}

export async function tutorialJaVisto(): Promise<boolean> {
  try {
    const valor = await AsyncStorage.getItem(KEY_TUTORIAL);
    return valor === "true";
  } catch (err) {
    console.log("[preferencias] erro ao ler tutorial:", err);
    return false;
  }
}

export async function marcarTutorialVisto(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY_TUTORIAL, "true");
    console.log("[preferencias] tutorial marcado como visto");
  } catch (err) {
    console.log("[preferencias] erro ao marcar tutorial:", err);
  }
}

export async function resetarTutorial(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY_TUTORIAL);
    console.log("[preferencias] tutorial resetado");
  } catch (err) {
    console.log("[preferencias] erro ao resetar tutorial:", err);
  }
}
