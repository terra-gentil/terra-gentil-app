import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_NICKNAME = "@terragentil:game_nickname";

const PREFIXES = ["JARDIM", "PLANTA", "VERDE", "FOLHA", "RAMO", "BROTO", "FLOR", "HORTA"];

const NICKNAME_REGEX = /^[A-Z0-9_]{3,12}$/;

export async function obterNickname(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEY_NICKNAME);
  } catch (err) {
    console.log("[nickname] erro ao ler:", err);
    return null;
  }
}

export async function obterOuCriarNickname(): Promise<string> {
  const existente = await obterNickname();
  if (existente && NICKNAME_REGEX.test(existente)) {
    return existente;
  }
  const novo = gerarNickname();
  try {
    await AsyncStorage.setItem(KEY_NICKNAME, novo);
    console.log("[nickname] gerado:", novo);
  } catch (err) {
    console.log("[nickname] erro ao salvar:", err);
  }
  return novo;
}

export async function definirNickname(nick: string): Promise<boolean> {
  const limpo = nick.trim().toUpperCase();
  if (!NICKNAME_REGEX.test(limpo)) return false;
  try {
    await AsyncStorage.setItem(KEY_NICKNAME, limpo);
    return true;
  } catch (err) {
    console.log("[nickname] erro ao definir:", err);
    return false;
  }
}

function gerarNickname(): string {
  const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${num}`;
}
