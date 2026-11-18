// Estado da voz do Doutor guardado no aparelho (regras 2, 21 e 22 do roteiro).
import AsyncStorage from "@react-native-async-storage/async-storage";
import { proximaTrilha, Trilha } from "../voz/roteiro";

const K_LIGADA = "@terragentil:voz_ligada";
const K_CONSULTAS = "@terragentil:voz_consultas";
const K_TRILHA = "@terragentil:voz_trilha";
const K_ULTIMAS = "@terragentil:voz_ultimas";
const K_FOTO_MARCADA = "@terragentil:voz_foto_marcada";
const K_ERRO = "@terragentil:voz_ultimo_erro";

export const ERRO_REPETIDO_MS = 2 * 60 * 1000;

async function lerNumero(chave: string): Promise<number> {
  try {
    const v = parseInt((await AsyncStorage.getItem(chave)) || "0", 10);
    return Number.isFinite(v) ? v : 0;
  } catch {
    return 0;
  }
}

async function gravar(chave: string, valor: string): Promise<void> {
  try {
    await AsyncStorage.setItem(chave, valor);
  } catch (err) {
    console.log("[voz] falha ao gravar", chave, err);
  }
}

// Alto-falante ligado por padrao
export async function vozLigada(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(K_LIGADA)) !== "0";
  } catch {
    return true;
  }
}

export function salvarVozLigada(ligada: boolean): Promise<void> {
  return gravar(K_LIGADA, ligada ? "1" : "0");
}

export function consultasComVoz(): Promise<number> {
  return lerNumero(K_CONSULTAS);
}

// Conta mais uma espera e devolve a trilha dela: a primeira da vida e a de apresentacao, depois A, B, C.
export async function iniciarConsultaVoz(): Promise<{ numero: number; trilha: Trilha }> {
  const numero = (await lerNumero(K_CONSULTAS)) + 1;
  await gravar(K_CONSULTAS, String(numero));
  if (numero === 1) return { numero, trilha: "primeira" };
  let anterior: string | null = null;
  try {
    anterior = await AsyncStorage.getItem(K_TRILHA);
  } catch {
    anterior = null;
  }
  const trilha = proximaTrilha(anterior);
  await gravar(K_TRILHA, trilha);
  return { numero, trilha };
}

export async function lerUltimas(): Promise<Record<string, string>> {
  try {
    const bruto = await AsyncStorage.getItem(K_ULTIMAS);
    const v = bruto ? JSON.parse(bruto) : {};
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

export function salvarUltimas(ultimas: Record<string, string>): Promise<void> {
  return gravar(K_ULTIMAS, JSON.stringify(ultimas));
}

export function fotoMarcadaVezes(): Promise<number> {
  return lerNumero(K_FOTO_MARCADA);
}

export async function registrarFotoMarcada(): Promise<void> {
  await gravar(K_FOTO_MARCADA, String((await lerNumero(K_FOTO_MARCADA)) + 1));
}

// Mesmo erro em menos de 2 minutos fica so no texto (regra 22). Ja registra a vez atual.
export async function podeFalarErro(chave: string, agora = Date.now()): Promise<boolean> {
  let anterior: { chave?: string; em?: number } = {};
  try {
    anterior = JSON.parse((await AsyncStorage.getItem(K_ERRO)) || "{}") || {};
  } catch {
    anterior = {};
  }
  await gravar(K_ERRO, JSON.stringify({ chave, em: agora }));
  return !(anterior.chave === chave && typeof anterior.em === "number" && agora - anterior.em < ERRO_REPETIDO_MS);
}
