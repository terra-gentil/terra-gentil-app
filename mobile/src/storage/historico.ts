import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { DiagnosticoResponse, EstadoSaude } from "../api/diagnostico";

const STORAGE_KEY = "@terragentil:historico";
const PREFIXO_LAUDO = "@terragentil:laudo:";
// Ultimas 30 consultas (e 30 fotos): o resto sai da lista e do disco
export const LIMITE_BUFFER = 30;
const PASTA_FOTOS = "historico-fotos/";

export interface ConsultaHistorico {
  id: string;
  timestamp: number;
  imageUri: string;
  nome_popular: string;
  especie_identificada: string;
  estado_saude: EstadoSaude;
  diagnostico_titulo: string;
}

function pastaFotos(): string | null {
  return FileSystem.documentDirectory ? FileSystem.documentDirectory + PASTA_FOTOS : null;
}

// A camera e a galeria devolvem URI do cache, que o Android limpa. Copia para a pasta do app.
async function guardarFoto(uri: string, id: string): Promise<string> {
  const pasta = pastaFotos();
  if (!pasta || !uri || uri.startsWith(pasta)) return uri;
  try {
    const info = await FileSystem.getInfoAsync(pasta);
    if (!info.exists) await FileSystem.makeDirectoryAsync(pasta, { intermediates: true });
    const destino = `${pasta}${id}.jpg`;
    await FileSystem.copyAsync({ from: uri, to: destino });
    return destino;
  } catch (err) {
    console.log("[historico] erro ao guardar foto:", err);
    return uri;
  }
}

async function apagarSobras(removidas: ConsultaHistorico[]): Promise<void> {
  const pasta = pastaFotos();
  for (const c of removidas) {
    try {
      await AsyncStorage.removeItem(PREFIXO_LAUDO + c.id);
      if (pasta && c.imageUri.startsWith(pasta)) await FileSystem.deleteAsync(c.imageUri, { idempotent: true });
    } catch (err) {
      console.log("[historico] erro ao apagar sobra:", err);
    }
  }
}

// Salva a consulta, a foto (copia persistente) e o laudo inteiro, para reabrir depois
export async function salvarConsulta(
  resultado: DiagnosticoResponse,
  imageUri: string,
): Promise<ConsultaHistorico | null> {
  if (!resultado.eh_planta) return null;

  try {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const nova: ConsultaHistorico = {
      id,
      timestamp: Date.now(),
      imageUri: await guardarFoto(imageUri, id),
      nome_popular: resultado.nome_popular,
      especie_identificada: resultado.especie_identificada,
      estado_saude: resultado.estado_saude,
      diagnostico_titulo: resultado.diagnostico_titulo,
    };

    const atual = await listarConsultas();
    const todas = [nova, ...atual];
    const novaLista = todas.slice(0, LIMITE_BUFFER);

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(novaLista));
    await AsyncStorage.setItem(PREFIXO_LAUDO + id, JSON.stringify(resultado));
    await apagarSobras(todas.slice(LIMITE_BUFFER));
    return nova;
  } catch (err) {
    console.log("[historico] erro ao salvar:", err);
    return null;
  }
}

export async function listarConsultas(
  limite?: number,
): Promise<ConsultaHistorico[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const lista = JSON.parse(raw) as ConsultaHistorico[];
    if (!Array.isArray(lista)) return [];
    return limite ? lista.slice(0, limite) : lista;
  } catch (err) {
    console.log("[historico] erro ao listar:", err);
    return [];
  }
}

// Laudo salvo + consulta, para reabrir o resultado (ex.: "Ver laudo" na Home)
export async function carregarLaudo(
  id: string,
): Promise<{ consulta: ConsultaHistorico; resultado: DiagnosticoResponse } | null> {
  try {
    const consulta = (await listarConsultas()).find((c) => c.id === id);
    if (!consulta) return null;
    const raw = await AsyncStorage.getItem(PREFIXO_LAUDO + id);
    if (!raw) return null;
    return { consulta, resultado: JSON.parse(raw) as DiagnosticoResponse };
  } catch (err) {
    console.log("[historico] erro ao carregar laudo:", err);
    return null;
  }
}

export async function limparHistorico(): Promise<void> {
  try {
    const lista = await listarConsultas();
    await AsyncStorage.removeItem(STORAGE_KEY);
    await apagarSobras(lista);
    console.log("[historico] historico limpo");
  } catch (err) {
    console.log("[historico] erro ao limpar:", err);
  }
}

// Nome normalizado: sem acento, minusculo, espacos unicos
export function normalizarNome(s: string | undefined | null): string {
  return (s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

const NOMES_VAGOS = new Set(["", "desconhecida", "desconhecido", "nao identificada", "nao_aplicavel", "planta"]);

export function mesmaPlanta(
  a: { especie_identificada: string; nome_popular: string },
  b: { especie_identificada: string; nome_popular: string },
): boolean {
  const ea = normalizarNome(a.especie_identificada);
  const eb = normalizarNome(b.especie_identificada);
  if (!NOMES_VAGOS.has(ea) && ea === eb) return true;
  const na = normalizarNome(a.nome_popular);
  const nb = normalizarNome(b.nome_popular);
  return !NOMES_VAGOS.has(na) && na === nb;
}

// Chave estavel da planta para a lista de cuidados
export function chavePlanta(r: { especie_identificada: string; nome_popular: string }): string {
  const e = normalizarNome(r.especie_identificada);
  return NOMES_VAGOS.has(e) ? normalizarNome(r.nome_popular) : e;
}

export const JANELA_ANTES_DEPOIS_DIAS = 120;
// Duas fotos no mesmo dia nao contam como "antes e depois"
const INTERVALO_MINIMO_MS = 12 * 3600000;

// Consulta anterior da mesma planta, pelo menos 12h antes e dentro de 120 dias
export function acharAnterior(
  historico: ConsultaHistorico[],
  atual: { id?: string; timestamp: number; especie_identificada: string; nome_popular: string },
): ConsultaHistorico | null {
  const limite = atual.timestamp - JANELA_ANTES_DEPOIS_DIAS * 86400000;
  const candidatas = historico
    .filter((c) => c.id !== atual.id && c.timestamp <= atual.timestamp - INTERVALO_MINIMO_MS && c.timestamp >= limite && !!c.imageUri)
    .filter((c) => mesmaPlanta(c, atual))
    .sort((x, y) => y.timestamp - x.timestamp);
  return candidatas[0] || null;
}
