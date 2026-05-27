import AsyncStorage from "@react-native-async-storage/async-storage";
import { ConsultaHistorico } from "./historico";

const KEY = "@terragentil:conquistas_stats";

export interface ConquistaComunidadeStats {
  totalPosts: number;
  totalRespostas: number;
  totalReacoesEnviadas: number;
}

export interface ConquistaHistoricoStats {
  total: number;
  especiesUnicas: number;
  diasUnicos: number;
  diasConsecutivos: number;
  criticalDiag: number;
  allHealthStates: boolean;
  noturnoDiag: number;
}

export type ConquistaStats = ConquistaHistoricoStats & ConquistaComunidadeStats;

const DEFAULT_COMUNIDADE: ConquistaComunidadeStats = {
  totalPosts: 0,
  totalRespostas: 0,
  totalReacoesEnviadas: 0,
};

export async function getComunidadeStats(): Promise<ConquistaComunidadeStats> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_COMUNIDADE };
    return { ...DEFAULT_COMUNIDADE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_COMUNIDADE };
  }
}

export async function incrementarStat(
  key: keyof ConquistaComunidadeStats,
  delta = 1,
): Promise<void> {
  try {
    const curr = await getComunidadeStats();
    curr[key] = (curr[key] ?? 0) + delta;
    await AsyncStorage.setItem(KEY, JSON.stringify(curr));
  } catch {}
}

export function calcularHistoricoStats(historico: ConsultaHistorico[]): ConquistaHistoricoStats {
  const total = historico.length;
  const especiesUnicas = new Set(historico.map((h) => h.especie_identificada)).size;

  const dayKeys = historico.map((h) => {
    const d = new Date(h.timestamp);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const diasUnicos = new Set(dayKeys).size;

  const diasConsecutivos = calcularMaxConsecutivos([...new Set(dayKeys)].sort());

  const criticalDiag = historico.filter(
    (h) => h.estado_saude === "doente" || h.estado_saude === "critico",
  ).length;

  const estados = new Set(historico.map((h) => h.estado_saude));
  const allHealthStates =
    estados.has("saudavel") &&
    estados.has("atencao") &&
    estados.has("doente") &&
    estados.has("critico");

  const noturnoDiag = historico.filter((h) => {
    const hora = new Date(h.timestamp).getHours();
    return hora < 6 || hora >= 22;
  }).length;

  return { total, especiesUnicas, diasUnicos, diasConsecutivos, criticalDiag, allHealthStates, noturnoDiag };
}

function calcularMaxConsecutivos(sortedDays: string[]): number {
  if (sortedDays.length === 0) return 0;
  let max = 1;
  let curr = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const prev = new Date(sortedDays[i - 1]).getTime();
    const next = new Date(sortedDays[i]).getTime();
    const diffDias = Math.round((next - prev) / 86400000);
    if (diffDias === 1) {
      curr++;
      if (curr > max) max = curr;
    } else {
      curr = 1;
    }
  }
  return max;
}

export type SeloCategoria = "Botanico" | "Cuidador" | "Dedicacao" | "Comunidade";

export interface Selo {
  id: string;
  emoji: string;
  nome: string;
  categoria: SeloCategoria;
  desc: string;
  check: (s: ConquistaStats) => boolean;
}

export const SELOS: Selo[] = [
  // BOTANICO
  {
    id: "primeira_foto",
    emoji: "🌱",
    nome: "Primeira foto",
    categoria: "Botanico",
    desc: "1 diagnostico",
    check: (s) => s.total >= 1,
  },
  {
    id: "dedicado",
    emoji: "🔬",
    nome: "Dedicado",
    categoria: "Botanico",
    desc: "10 diagnosticos",
    check: (s) => s.total >= 10,
  },
  {
    id: "mao_verde",
    emoji: "🌿",
    nome: "Mao Verde",
    categoria: "Botanico",
    desc: "10 especies diferentes",
    check: (s) => s.especiesUnicas >= 10,
  },
  {
    id: "explorador",
    emoji: "🗺️",
    nome: "Explorador",
    categoria: "Botanico",
    desc: "25 especies diferentes",
    check: (s) => s.especiesUnicas >= 25,
  },
  // CUIDADOR
  {
    id: "socorrista",
    emoji: "💊",
    nome: "Socorrista",
    categoria: "Cuidador",
    desc: "Diagnosticar planta doente ou critica",
    check: (s) => s.criticalDiag >= 1,
  },
  {
    id: "conhecedor",
    emoji: "🌈",
    nome: "Conhecedor",
    categoria: "Cuidador",
    desc: "Todos os 4 estados de saude diagnosticados",
    check: (s) => s.allHealthStates,
  },
  {
    id: "plantao",
    emoji: "🌙",
    nome: "Plantao",
    categoria: "Cuidador",
    desc: "Diagnostico apos 22h ou antes das 6h",
    check: (s) => s.noturnoDiag >= 1,
  },
  // DEDICACAO
  {
    id: "7_dias",
    emoji: "🔥",
    nome: "7 Dias",
    categoria: "Dedicacao",
    desc: "7 dias diferentes de uso",
    check: (s) => s.diasUnicos >= 7,
  },
  {
    id: "sequencia",
    emoji: "⚡",
    nome: "Sequencia",
    categoria: "Dedicacao",
    desc: "5 dias consecutivos",
    check: (s) => s.diasConsecutivos >= 5,
  },
  {
    id: "mes_verde",
    emoji: "📅",
    nome: "Mes Verde",
    categoria: "Dedicacao",
    desc: "30 dias diferentes de uso",
    check: (s) => s.diasUnicos >= 30,
  },
  // COMUNIDADE
  {
    id: "voz_ativa",
    emoji: "💬",
    nome: "Voz Ativa",
    categoria: "Comunidade",
    desc: "Criar 1 post na comunidade",
    check: (s) => s.totalPosts >= 1,
  },
  {
    id: "solidario",
    emoji: "🤝",
    nome: "Solidario",
    categoria: "Comunidade",
    desc: "Responder 5 posts da comunidade",
    check: (s) => s.totalRespostas >= 5,
  },
  {
    id: "popular",
    emoji: "❤️",
    nome: "Popular",
    categoria: "Comunidade",
    desc: "Dar 20 reacoes na comunidade",
    check: (s) => s.totalReacoesEnviadas >= 20,
  },
];

export const CATEGORIAS_SELOS: SeloCategoria[] = ["Botanico", "Cuidador", "Dedicacao", "Comunidade"];
