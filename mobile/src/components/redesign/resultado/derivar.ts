import type {
  AfetadoToxicidade,
  DiagnosticoResponse,
  EbookRecomendado,
  LeituraFoto,
  PassoTratamento,
  Toxicidade,
} from "../../../api/diagnostico";
import type { Ebook } from "../../../data/ebooks";

// Rotulos e derivacoes da tela de resultado. Tudo puro, sem React, para testar facil.

export const LINK_PLAY = "https://play.google.com/store/apps/details?id=br.com.terragentil.app";

export const CATEGORIA_LABEL: Record<string, string> = {
  rega_excesso: "Água demais",
  rega_falta: "Falta de água",
  luz_excesso: "Sol demais",
  luz_falta: "Pouca luz",
  praga: "Praga",
  fungo_ou_bacteria: "Fungo",
  nutricao: "Falta de nutrientes",
  raiz_ou_vaso: "Raiz ou vaso",
  clima: "Clima",
  dano_fisico: "Dano físico",
  envelhecimento_natural: "Folha velha",
  outro: "Outro",
};

export const ASPECTO_LABEL: Record<string, string> = {
  folhas: "Folhas",
  caule_e_ramos: "Caule e ramos",
  flores_e_frutos: "Flores e frutos",
  solo: "Solo",
  vaso: "Vaso",
  ambiente_e_luz: "Ambiente e luz",
};

// Nome curto da luz e posicao (0 a 100) do que a planta precisa na regua
export const LUZ: Record<string, [string, number]> = {
  sombra: ["Sombra", 12],
  indireta_media: ["Luz indireta", 35],
  indireta_brilhante: ["Luz clara indireta", 55],
  meia_sombra: ["Meia-sombra", 75],
  sol_parcial: ["Meia-sombra", 75],
  sol_pleno: ["Sol pleno", 92],
};

// [rotulo, fundo, texto]
export const ESTADO: Record<string, [string, string, string]> = {
  saudavel: ["Saudável", "#dcfce7", "#14532d"],
  atencao: ["Pede atenção", "#fef3c7", "#92400e"],
  doente: ["Precisa de cuidado", "#ffe1ec", "#9f1d47"],
  critico: ["Cuidado urgente", "#ffe1ec", "#9f1d47"],
};

export const GRAVIDADE: Record<string, [string, string, string]> = {
  alta: ["Gravidade alta", "#ffe1ec", "#9f1d47"],
  media: ["Gravidade média", "#fef3c7", "#92400e"],
  baixa: ["Gravidade baixa", "#efeae0", "#44403c"],
};

export const TIPO_LABEL: Record<string, string> = {
  manejo: "Manejo",
  caseiro: "Receita caseira",
  organico: "Orgânico",
};

export const SELO: Record<string, string> = {
  alta: "Reconheci com segurança",
  media: "Reconheci, mas confira",
  baixa: "Não tenho certeza da espécie",
};

export const AFETA: Record<AfetadoToxicidade, [string, "cao" | "gato" | "pessoa"]> = {
  caes: ["Cães", "cao"],
  gatos: ["Gatos", "gato"],
  criancas: ["Crianças", "pessoa"],
  adultos: ["Adultos", "pessoa"],
};

// [rotulo, bolinha, texto]
export const SINAL: Record<LeituraFoto["sinal"], [string, string, string]> = {
  bom: ["bom sinal", "#22c55e", "#15803d"],
  neutro: ["normal", "#a8a29e", "#57534e"],
  atencao: ["atenção", "#f59e0b", "#92400e"],
  ruim: ["problema", "#fb6f92", "#9f1d47"],
};

export const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export function juntar(itens: string[]): string {
  if (itens.length <= 1) return itens[0] || "";
  return itens.slice(0, -1).join(", ") + " e " + itens[itens.length - 1];
}

export function estadoDe(r: DiagnosticoResponse): [string, string, string] {
  return ESTADO[r.estado_saude] || ESTADO.atencao;
}

// v2 traz o bloco toxicidade; v1 so tem toxica_para_pets e um texto livre.
export function toxicidadeDe(r: DiagnosticoResponse): Toxicidade {
  if (r.toxicidade) return r.toxicidade;
  if (r.toxica_para_pets) {
    return { nivel: "moderada", afeta: ["caes", "gatos"], sintomas: r.toxicidade_detalhes || "" };
  }
  return { nivel: "nao_toxica", afeta: [] };
}

export function toxicidadeForte(t: Toxicidade): boolean {
  return t.nivel === "moderada" || t.nivel === "grave";
}

export interface InfoPet {
  valor: string;
  sub: string;
  fg: string;
  iconBg: string;
  cardBg: string;
  // Linha discreta no fim da tela, quando nao ha destaque
  linhaTexto: string;
}

export function infoPet(t: Toxicidade): InfoPet {
  const afetaNomes = (t.afeta || []).map((a) => (AFETA[a]?.[0] || a).toLowerCase());
  if (toxicidadeForte(t)) {
    return {
      valor: t.nivel === "grave" ? "Muito tóxica" : "Tóxica",
      sub: (t.afeta || []).includes("criancas") ? "pets e crianças" : "para pets",
      fg: "#9f1d47", iconBg: "#fff", cardBg: "#ffe1ec", linhaTexto: "",
    };
  }
  if (t.nivel === "leve") {
    return {
      valor: "Pouco tóxica", sub: "evite mastigar", fg: "#92400e", iconBg: "#fef3c7", cardBg: "#fff",
      linhaTexto: afetaNomes.length ? "Levemente tóxica para " + juntar(afetaNomes) : "Levemente tóxica",
    };
  }
  if (t.nivel === "nao_toxica") {
    return {
      valor: "Segura", sub: "para pets", fg: "#15803d", iconBg: "#dcfce7", cardBg: "#fff",
      linhaTexto: "Não é tóxica para pets nem pessoas",
    };
  }
  return {
    valor: "Sem dados", sub: "sobre pets", fg: "#57534e", iconBg: "#efeae0", cardBg: "#fff",
    linhaTexto: "Não encontrei dados de toxicidade",
  };
}

export function tituloToxicidade(t: Toxicidade): string {
  const nomes = (t.afeta || []).map((a) => (AFETA[a]?.[0] || a).toLowerCase());
  return nomes.length ? "Tóxica para " + juntar(nomes) : "Tóxica para pets";
}

export function regaFrase(r: DiagnosticoResponse): string {
  const ml = (r.rega_ml || 0) > 0;
  const cm = (r.vaso_estimado_cm || 0) > 0;
  const intervalo = r.rega_dias <= 1 ? "todo dia" : `a cada ${r.rega_dias} dias`;
  const base = ml ? `≈ ${r.rega_ml} ml ${intervalo}` : intervalo.charAt(0).toUpperCase() + intervalo.slice(1);
  return base + (cm ? `, vaso de uns ${r.vaso_estimado_cm} cm` : "");
}

export function regaResumo(r: DiagnosticoResponse): { valor: string; sub: string } {
  const ml = (r.rega_ml || 0) > 0;
  const sub = r.rega_dias <= 1 ? "todo dia" : `a cada ${r.rega_dias} dias`;
  return { valor: ml ? `≈ ${r.rega_ml} ml` : "Regar", sub };
}

export interface ItemFicha {
  label: string;
  texto: string;
}

export function fichaCuidados(r: DiagnosticoResponse): ItemFicha[] {
  const cu = r.cuidados || {};
  const itens: (ItemFicha | null)[] = [
    r.rega_dias > 0 ? { label: "Rega", texto: (regaFrase(r) + ". " + (r.rega_condicao || "")).trim() } : null,
    r.temperatura_ideal ? { label: "Temperatura", texto: r.temperatura_ideal } : null,
    cu.solo_e_vaso ? { label: "Solo e vaso", texto: cu.solo_e_vaso } : null,
    cu.adubacao ? { label: "Adubação", texto: cu.adubacao } : null,
    cu.poda_e_limpeza ? { label: "Poda e limpeza", texto: cu.poda_e_limpeza } : null,
    cu.erros_comuns && cu.erros_comuns[0] ? { label: "Erro comum", texto: cu.erros_comuns[0] } : null,
  ];
  return itens.filter((i): i is ItemFicha => i !== null);
}

// Plano em dois degraus: quimico vai sempre para o bloco ambar recolhido
export function separarPlano(r: DiagnosticoResponse): { caseiros: PassoTratamento[]; quimicos: PassoTratamento[] } {
  const tl = r.plano_timeline || [];
  return {
    caseiros: tl.filter((s) => s.tipo !== "quimico"),
    quimicos: tl.filter((s) => s.tipo === "quimico"),
  };
}

export function materiaisNaoQuimicos(r: DiagnosticoResponse): string[] {
  const vistos = new Set<string>();
  const lista: string[] = [];
  for (const s of separarPlano(r).caseiros) {
    for (const m of s.materiais || []) {
      if (!vistos.has(m)) {
        vistos.add(m);
        lista.push(m);
      }
    }
  }
  return lista;
}

// Data do aviso: daqui a N dias, as 10h da manha
export function dataDoRetorno(dias: number, agora: Date = new Date()): Date {
  const d = new Date(agora.getTime());
  d.setDate(d.getDate() + dias);
  d.setHours(10, 0, 0, 0);
  return d;
}

export function textoCombinado(data: Date): string {
  return `Combinado, aviso dia ${data.getDate()} de ${MESES[data.getMonth()]}`;
}

export function textoCompartilhar(r: DiagnosticoResponse): string {
  const estado = estadoDe(r)[0];
  const partes = [
    `${r.nome_popular}: ${estado.toLowerCase()}.`,
    r.diagnostico_titulo,
    "Laudo do Doutor Gentileza, no app Terra Gentil. Grátis, sem assinatura, em português.",
    LINK_PLAY,
  ].filter(Boolean);
  return partes.join("\n\n");
}

// Titulo da pergunta para a comunidade (o modal exige 10 a 140 caracteres)
export function tituloPergunta(r: DiagnosticoResponse): string {
  const base = r.diagnostico_titulo ? `${r.nome_popular}: ${r.diagnostico_titulo}` : `Dúvida sobre minha ${r.nome_popular}`;
  const texto = base.length < 10 ? `Dúvida sobre minha planta: ${r.nome_popular}` : base;
  return texto.slice(0, 140);
}

// Ebook do relatorio vira o Ebook que o leitor de PDF espera
export function ebookDoRelatorio(e: EbookRecomendado): Ebook | null {
  if (!e.pdf || !e.titulo) return null;
  return {
    id: e.id,
    numero: parseInt(e.id.replace(/\D/g, ""), 10) || 0,
    titulo: e.titulo,
    subtitulo: "",
    capa: e.capa || "",
    pdf: e.pdf,
    paletaId: "verde",
    emoji: e.emoji || "📗",
    keywords: [],
  };
}
