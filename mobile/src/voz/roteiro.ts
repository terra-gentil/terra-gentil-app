// Roteiro da voz do Doutor (docs/ROTEIRO-VOZ-DOUTOR.md, secoes 2 e 3). So funcoes puras:
// quem toca e o locutor, quem guarda o estado e storage/voz.
import type { DiagnosticoResponse } from "../api/diagnostico";
import { ErrorCode } from "../errors/AppError";
import { marcasDaLupa, toxicidadeDe, toxicidadeForte } from "../components/redesign/resultado/derivar";
import type { FalaId } from "./falas";

export type Trilha = "primeira" | "A" | "B" | "C";
export type CartaoVoz = "quem-somos" | "canal" | "ebooks";

export interface ItemFala {
  fala: FalaId;
  // Espera: ms desde a montagem da tela em que a fala fica pronta para tocar
  em?: number;
  // Silencio minimo antes desta fala (nunca menos que 1 s, regra 6)
  pausaAntesMs?: number;
  // Chamada do canal passa na frente de fala de exame (regra 7)
  prioridade?: "alta" | "normal";
  // Fala de exame: se atrasar mais que isso, cai (regra 7)
  toleranciaMs?: number;
  // Cartao do carrossel que a fala cita (regra 10)
  cartao?: CartaoVoz;
  // Durante a fala o botao Lembrar de ver o canal pulsa (regra 11)
  chamada?: boolean;
  // Convite do fim do laudo: dispensado se a pessoa ja chegou ao cartao do canal (regra 19)
  convite?: boolean;
}

export const GRUPOS = {
  folhas: ["espera_folhas_a", "espera_folhas_b"],
  canalA: ["espera_canal_b", "espera_canal_d"],
  demora: ["demora_a", "demora_b"],
  saudavel: ["laudo_saudavel_a", "laudo_saudavel_b", "laudo_saudavel_c"],
  problema: ["laudo_problema_a", "laudo_problema_b", "laudo_problema_c"],
  geral: ["laudo_geral_a", "laudo_geral_b"],
  toxica: ["laudo_toxica_a", "laudo_toxica_b"],
  convite: ["convite_a", "convite_b", "convite_c"],
  conviteCuidado: ["convite_cuidado_a", "convite_cuidado_b"],
  naoPlanta: ["nao_planta_a", "nao_planta_b"],
  fotoRuim: ["foto_ruim_a", "foto_ruim_b"],
  erroConexao: ["erro_conexao_a", "erro_conexao_b"],
} as const satisfies Record<string, readonly FalaId[]>;

export type Grupo = keyof typeof GRUPOS;

// Sorteia variacoes sem repetir a ultima de cada grupo (regra 21).
export class Sorteio {
  ultimas: Record<string, string>;
  constructor(ultimas: Record<string, string> = {}, private aleatorio: () => number = Math.random) {
    this.ultimas = { ...ultimas };
  }

  de(grupo: Grupo): FalaId {
    const opcoes = GRUPOS[grupo] as readonly FalaId[];
    const livres = opcoes.filter((f) => f !== this.ultimas[grupo]);
    const lista = livres.length > 0 ? livres : opcoes;
    const fala = lista[Math.min(lista.length - 1, Math.floor(this.aleatorio() * lista.length))];
    this.ultimas[grupo] = fala;
    return fala;
  }

  // Primeira consulta usa sempre a variacao mais explicada, e conta como a ultima tocada
  fixa(grupo: Grupo, fala: FalaId): FalaId {
    this.ultimas[grupo] = fala;
    return fala;
  }
}

const TOLERANCIA_EXAME_MS = 4000;
const TOLERANCIA_FINAL_MS = 6000;

export function proximaTrilha(anterior: string | null): Exclude<Trilha, "primeira"> {
  if (anterior === "A") return "B";
  if (anterior === "B") return "C";
  return "A";
}

// Agenda da tela de espera por trilha (tabela "Como as falas da espera se organizam").
export function planoEspera(trilha: Trilha, s: Sorteio): ItemFala[] {
  const exame = (fala: FalaId, em: number, cartao?: CartaoVoz): ItemFala => ({ fala, em, toleranciaMs: TOLERANCIA_EXAME_MS, cartao });
  const final = (fala: FalaId, em: number): ItemFala => ({ fala, em, toleranciaMs: TOLERANCIA_FINAL_MS });
  const canal = (fala: FalaId, em: number, chamada = true): ItemFala => ({ fala, em, prioridade: "alta", cartao: "canal", chamada });
  const demora: ItemFala[] = [
    { fala: s.de("demora"), em: 60000 },
    { fala: "demora_longa", em: 82000 },
  ];

  if (trilha === "primeira") {
    return [
      { fala: "espera_primeira_vez", em: 500 },
      { fala: "primeira_quem_somos", em: 10500, prioridade: "alta", cartao: "quem-somos" },
      canal("primeira_canal", 23000),
      { fala: "primeira_guias", em: 36000, cartao: "ebooks" },
      final("espera_plano_a", 45000),
      ...demora,
    ];
  }

  const detalhes = final("espera_detalhes", 42000);
  if (trilha === "A") {
    return [
      { fala: "espera_inicio_a", em: 500 },
      exame(s.de("folhas"), 9500),
      canal(s.de("canalA"), 15500),
      exame("espera_pets_a", 26500),
      final("espera_plano_a", 33000),
      detalhes,
      ...demora,
    ];
  }
  if (trilha === "B") {
    return [
      { fala: "espera_inicio_b", em: 500 },
      canal("espera_canal_c", 10500),
      exame("espera_rega_a", 24000),
      final("espera_plano_b", 32000),
      detalhes,
      ...demora,
    ];
  }
  return [
    { fala: "espera_inicio_c", em: 500 },
    canal("espera_canal_a", 9000, false),
    exame("espera_pragas_a", 16500),
    canal("espera_botao", 21500),
    final("espera_plano_c", 32000),
    detalhes,
    ...demora,
  ];
}

export type SituacaoLaudo = "nao_planta" | "foto_ruim" | "serio" | "problema" | "saudavel" | "geral";

export function situacaoDoLaudo(r: DiagnosticoResponse): SituacaoLaudo {
  if (r.eh_planta === false) return "nao_planta";
  if (r.foto?.qualidade === "ruim") return "foto_ruim";
  if (r.estado_saude === "critico" || r.ajuda_profissional?.recomendada) return "serio";
  if (r.estado_saude === "atencao" || r.estado_saude === "doente" || (r.problemas_detectados || []).length > 0) {
    return "problema";
  }
  if (r.estado_saude === "saudavel") return "saudavel";
  return "geral";
}

export const FOTO_MARCADA_MAX = 3;

export interface FalasLaudo {
  itens: ItemFala[];
  usouFotoMarcada: boolean;
}

// Sequencia do laudo recem-chegado (tabela "No laudo" e regras 15 a 17).
export function escolherFalasLaudo(
  r: DiagnosticoResponse,
  ctx: { primeira: boolean; fotoMarcadaVezes: number },
  s: Sorteio,
): FalasLaudo {
  const situacao = situacaoDoLaudo(r);
  if (situacao === "nao_planta") return { itens: [{ fala: s.de("naoPlanta") }], usouFotoMarcada: false };
  if (situacao === "foto_ruim") return { itens: [{ fala: s.de("fotoRuim") }], usouFotoMarcada: false };

  const cuidado = situacao === "serio" || situacao === "problema";
  const principal: FalaId =
    situacao === "serio"
      ? "laudo_serio"
      : situacao === "problema"
        ? s.de("problema")
        : situacao === "saudavel"
          ? s.de("saudavel")
          : s.de("geral");
  const itens: ItemFala[] = [{ fala: principal }];

  // No maximo uma complementar: toxica tem prioridade sobre foto marcada
  const toxica = toxicidadeForte(toxicidadeDe(r));
  let usouFotoMarcada = false;
  if (toxica) {
    itens.push({ fala: s.de("toxica") });
  } else if (cuidado && ctx.fotoMarcadaVezes < FOTO_MARCADA_MAX && marcasDaLupa(r.problemas_detectados).length > 0) {
    itens.push({ fala: "laudo_foto_marcada" });
    usouFotoMarcada = true;
  }

  let convite: FalaId;
  if (toxica) convite = "convite_curto";
  else if (cuidado) convite = ctx.primeira ? s.fixa("conviteCuidado", "convite_cuidado_a") : s.de("conviteCuidado");
  else convite = ctx.primeira ? s.fixa("convite", "convite_a") : s.de("convite");
  itens.push({ fala: convite, convite: true, pausaAntesMs: situacao === "serio" ? 1500 : 1000 });

  return { itens, usouFotoMarcada };
}

// Fala da tela de erro. O tempo limite de 100 s e o 504 viram NETWORK_TIMEOUT: o roteiro manda erro_geral.
export function falaDeErro(code: ErrorCode, s: Sorteio): { chave: string; fala: FalaId } | null {
  switch (code) {
    case ErrorCode.NETWORK_OFFLINE:
      return { chave: "conexao", fala: s.de("erroConexao") };
    case ErrorCode.IMAGE_INVALID:
    case ErrorCode.IMAGE_TOO_LARGE:
      return { chave: "foto", fala: s.de("fotoRuim") };
    case ErrorCode.PERMISSION_DENIED:
      return null;
    default:
      return { chave: "geral", fala: "erro_geral" };
  }
}
