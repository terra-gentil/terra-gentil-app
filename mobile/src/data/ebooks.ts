export interface Ebook {
  id: string;
  numero: number;
  titulo: string;
  subtitulo: string;
  capa: string;
  pdf: string;
  paletaId: "verde" | "amber" | "rosa" | "lavanda" | "ceu";
  emoji: string;
  keywords: string[];
}

const BASE_PDF = "https://terragentil.com.br/wp-content/uploads/2025/12";
const BASE_IMG = "https://terragentil.com.br/wp-content/uploads/2025/12";

export const EBOOK_DESTAQUE: Ebook = {
  id: "ebook-01",
  numero: 1,
  titulo: "O Código Secreto das Plantas",
  subtitulo: "Pare de matar suas plantas — o guia base do Doutor",
  emoji: "📘",
  paletaId: "verde",
  capa: `${BASE_IMG}/O-Codigo-Secreto-das-Plantas.jpeg`,
  pdf: `${BASE_PDF}/1-O-Codigo-Secreto-das-Plantas.pdf`,
  keywords: ["geral", "iniciante", "basico"],
};

export const EBOOKS: Ebook[] = [
  {
    id: "ebook-02",
    numero: 2,
    titulo: "O Esquadrão Imortal",
    subtitulo: "6 plantas indestrutíveis pra começar bem",
    emoji: "🛡️",
    paletaId: "verde",
    capa: `${BASE_IMG}/esquadraoimortal.jpeg`,
    pdf: `${BASE_PDF}/2-O-Esquadrao-Imortal.pdf`,
    keywords: ["espada", "são jorge", "sansevieria", "zamioculca", "zz plant", "lírio da paz"],
  },
  {
    id: "ebook-03",
    numero: 3,
    titulo: "Plantas da Gratidão",
    subtitulo: "Proteção e energia boa para o lar",
    emoji: "✨",
    paletaId: "lavanda",
    capa: `${BASE_IMG}/plantasdegratidao.jpeg`,
    pdf: `${BASE_PDF}/3-Plantas-da-Gratidao.pdf`,
    keywords: ["arruda", "pimenteira", "comigo-ninguém-pode", "guiné", "energia", "proteção"],
  },
  {
    id: "ebook-04",
    numero: 4,
    titulo: "Jardim Lindo com Pouco Dinheiro",
    subtitulo: "Receitas caseiras de adubo, vasos e mais",
    emoji: "💰",
    paletaId: "amber",
    capa: `${BASE_IMG}/jardimbonitoebarato.jpeg`,
    pdf: `${BASE_PDF}/4-Jardim-Lindo-com-Pouco-Dinheiro.pdf`,
    keywords: ["adubo caseiro", "economizar", "barato", "reciclagem", "garrafa pet"],
  },
  {
    id: "ebook-05",
    numero: 5,
    titulo: "Jardim Vertical na Parede",
    subtitulo: "Seu novo quintal mesmo sem espaço",
    emoji: "🧗",
    paletaId: "verde",
    capa: `${BASE_IMG}/jardimvertical.jpeg`,
    pdf: `${BASE_PDF}/5-O-Seu-Novo-Quintal-e-na-Parede.pdf`,
    keywords: ["samambaia", "parede", "vertical", "treliça", "pendente", "véu de noiva"],
  },
  {
    id: "ebook-06",
    numero: 6,
    titulo: "Jardim Terapêutico",
    subtitulo: "Plantas que acalmam e curam",
    emoji: "🧘",
    paletaId: "lavanda",
    capa: `${BASE_IMG}/jardimterapeutico.jpeg`,
    pdf: `${BASE_PDF}/6-Jardim-Terapeutico.pdf`,
    keywords: ["lavanda", "camomila", "jasmim", "ansiedade", "calma", "terapia", "melissa"],
  },
  {
    id: "ebook-07",
    numero: 7,
    titulo: "Jardim Pequeno, Amor Gigante",
    subtitulo: "Apartamento ou sacada também viram jardim",
    emoji: "🏢",
    paletaId: "rosa",
    capa: `${BASE_IMG}/pequenojardimgiganteamor.jpeg`,
    pdf: `${BASE_PDF}/7-Jardim-Pequeno-Amor-Gigante.pdf`,
    keywords: ["apartamento", "pequeno", "sacada", "antúrio", "begônia", "violeta", "kalanchoe"],
  },
  {
    id: "ebook-08",
    numero: 8,
    titulo: "Horta na Varanda",
    subtitulo: "Tempero fresco saindo da sua janela",
    emoji: "🥗",
    paletaId: "verde",
    capa: `${BASE_IMG}/hortanavaranda.jpeg`,
    pdf: `${BASE_PDF}/8-Horta-na-Varanda.pdf`,
    keywords: ["salsinha", "coentro", "orégano", "manjericão", "tomilho", "sálvia", "alecrim"],
  },
  {
    id: "ebook-09",
    numero: 9,
    titulo: "Guia Gentil de Luz",
    subtitulo: "Sol, sombra ou meia-sombra? Descomplica aqui",
    emoji: "☀️",
    paletaId: "amber",
    capa: `${BASE_IMG}/guiadeluzesombra.jpeg`,
    pdf: `${BASE_PDF}/9-Plantas-para-Varanda-Pequena-o-guia-gentil-de-sol-meia-sombra-e-sombra.pdf`,
    keywords: ["sombra", "meia-sombra", "sol pleno", "luz", "varanda"],
  },
  {
    id: "ebook-10",
    numero: 10,
    titulo: "Pets e Plantas",
    subtitulo: "Guia de segurança pra quem tem cão e gato",
    emoji: "🐶",
    paletaId: "rosa",
    capa: `${BASE_IMG}/plantascaesegatos.jpeg`,
    pdf: `${BASE_PDF}/10-Guia-Gentil-Plantas-Caes-e-Gatos.pdf`,
    keywords: ["gato", "cachorro", "cão", "pet", "tóxica", "venenosa", "segura", "azaleia"],
  },
  {
    id: "ebook-11",
    numero: 11,
    titulo: "Suculentas sem Mistério",
    subtitulo: "O guia para não matar afogada",
    emoji: "🌵",
    paletaId: "amber",
    capa: `${BASE_IMG}/comoplantarsuculentas.jpeg`,
    pdf: `${BASE_PDF}/11-Como-Plantar-Suculentas.pdf`,
    keywords: ["suculenta", "echeveria", "sedum", "cacto", "gordinha"],
  },
  {
    id: "ebook-12",
    numero: 12,
    titulo: "Rosa do Deserto",
    subtitulo: "Os segredos do caudex que ninguém conta",
    emoji: "🌸",
    paletaId: "rosa",
    capa: `${BASE_IMG}/comoplantarroadodeserto-2.jpeg`,
    pdf: `${BASE_PDF}/12-Como-Plantar-Rosa-do-Deserto.pdf`,
    keywords: ["rosa do deserto", "adenium", "caudex", "batata da planta"],
  },
  {
    id: "ebook-13",
    numero: 13,
    titulo: "Morangos do Coração",
    subtitulo: "Colha doçura na sua varanda",
    emoji: "🍓",
    paletaId: "rosa",
    capa: `${BASE_IMG}/comoplantarmorangos.jpeg`,
    pdf: `${BASE_PDF}/13-Morangos-do-Coracao.pdf`,
    keywords: ["morango", "morangueiro", "fruta", "fruto vermelho"],
  },
  {
    id: "ebook-14",
    numero: 14,
    titulo: "Hortelã: O Aroma da Infância",
    subtitulo: "Chá fresquinho saindo do vaso",
    emoji: "🍃",
    paletaId: "verde",
    capa: `${BASE_IMG}/aromadamemoria.jpeg`,
    pdf: `${BASE_PDF}/14-O-Cheirinho-que-Mora-na-Memoria.pdf`,
    keywords: ["hortelã", "menta", "chá"],
  },
  {
    id: "ebook-15",
    numero: 15,
    titulo: "Cebolinha Infinita",
    subtitulo: "Adeus mercado — corta, ela cresce de novo",
    emoji: "🥣",
    paletaId: "verde",
    capa: `${BASE_IMG}/complantarcebolinha.jpeg`,
    pdf: `${BASE_PDF}/15-Como-Plantar-Cebolinha-em-Casa.pdf`,
    keywords: ["cebolinha", "cheiro verde", "cebolinho"],
  },
  {
    id: "ebook-16",
    numero: 16,
    titulo: "Jiboia na Sala",
    subtitulo: "A planta que perdoa qualquer descuido",
    emoji: "🌿",
    paletaId: "verde",
    capa: `${BASE_IMG}/jibioianasala.jpeg`,
    pdf: `${BASE_PDF}/16-Jiboia-na-Sala.pdf`,
    keywords: ["jiboia", "epipremnum", "jibóia"],
  },
  {
    id: "ebook-17",
    numero: 17,
    titulo: "Alface em Casa",
    subtitulo: "Salada crocante todo dia, do vaso pra mesa",
    emoji: "🥬",
    paletaId: "verde",
    capa: `${BASE_IMG}/comoplantaralface.jpeg`,
    pdf: `${BASE_PDF}/17-Alface-em-Casa.pdf`,
    keywords: ["alface", "salada", "lactuca"],
  },
  {
    id: "ebook-18",
    numero: 18,
    titulo: "Tapete Verde da Bondade",
    subtitulo: "O segredo de um gramado bonito e fofo",
    emoji: "🏡",
    paletaId: "ceu",
    capa: `${BASE_IMG}/comocantargrama.jpeg`,
    pdf: `${BASE_PDF}/18-O-TAPETE-VERDE-DA-BONDADE.pdf`,
    keywords: ["grama", "gramado", "relva", "esmeralda", "são carlos", "batatais"],
  },
  {
    id: "ebook-19",
    numero: 19,
    titulo: "Tomate em Vaso",
    subtitulo: "Colheita farta mesmo em apartamento",
    emoji: "🍅",
    paletaId: "rosa",
    capa: `${BASE_IMG}/comoplantartomate.jpeg`,
    pdf: `${BASE_PDF}/19-Tomate-em-Vaso.pdf`,
    keywords: ["tomate", "tomateiro", "cereja", "legume"],
  },
];

export const TODOS_EBOOKS: Ebook[] = [EBOOK_DESTAQUE, ...EBOOKS];

export function ebookPorPlanta(nomePlanta: string): Ebook {
  const lower = nomePlanta.toLowerCase();
  for (const ebook of EBOOKS) {
    if (ebook.keywords.some((k) => lower.includes(k.toLowerCase()))) {
      return ebook;
    }
  }
  return EBOOK_DESTAQUE;
}
