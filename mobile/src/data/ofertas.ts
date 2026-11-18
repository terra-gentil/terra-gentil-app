import { Alert } from "react-native";
import type { FlashDeal, RecommendedDeal } from "../components/redesign/DealCard";

// Ofertas da aba Promocoes. Ficam aqui para a tela de resultado do diagnostico
// usar as mesmas, casando pelo nome com os materiais do plano.

export type CategoriaOferta = "Todas" | "Vasos" | "Adubos" | "Sementes" | "Ferramentas";
export const CATEGORIAS_OFERTA: Exclude<CategoriaOferta, "Todas">[] = ["Vasos", "Adubos", "Sementes", "Ferramentas"];

export interface FlashDealComCat extends FlashDeal {
  categoria: CategoriaOferta;
}
export interface RecComCat extends RecommendedDeal {
  categoria: CategoriaOferta;
}

export const FLASH_DEALS: FlashDealComCat[] = [
  {
    id: "vaso-auto",
    nome: "Vaso autoirrigável 18cm",
    precoDe: "R$ 89",
    precoPor: "R$ 39",
    desconto: "-56%",
    vendido: 70,
    gradient: ["#bae6fd", "#0284c7"],
    categoria: "Vasos",
  },
  {
    id: "adubo-liq",
    nome: "Adubo líquido 500ml",
    precoDe: "R$ 45",
    precoPor: "R$ 22",
    desconto: "-51%",
    vendido: 58,
    gradient: ["#fde68a", "#b45309"],
    categoria: "Adubos",
  },
  {
    id: "kit-sementes",
    nome: "Kit sementes 12 ervas",
    precoDe: "R$ 65",
    precoPor: "R$ 29",
    desconto: "-55%",
    vendido: 82,
    gradient: ["#86efac", "#15803d"],
    categoria: "Sementes",
  },
  {
    id: "tesoura-poda",
    nome: "Tesoura de poda inox",
    precoDe: "R$ 78",
    precoPor: "R$ 49",
    desconto: "-37%",
    vendido: 35,
    gradient: ["#fbcfe8", "#be185d"],
    categoria: "Ferramentas",
  },
];

export const REC_DEALS: RecComCat[] = [
  {
    id: "npk-organico",
    nome: "Adubo NPK orgânico",
    descricao: "Pra folhagens. 1x por mês",
    preco: "R$ 24,90",
    tag: "Recomendado",
    gradient: ["#86efac", "#22c55e"],
    categoria: "Adubos",
  },
  {
    id: "vaso-terracota",
    nome: "Vaso decor terracota",
    descricao: "20cm. Drenagem perfeita",
    preco: "R$ 49,00",
    tag: "Mais comprado",
    gradient: ["#fde68a", "#f59e0b"],
    categoria: "Vasos",
  },
  {
    id: "regador-1l",
    nome: "Regador bico fino 1L",
    descricao: "Ideal pra mudas e suculentas",
    preco: "R$ 32,00",
    tag: "Novidade",
    gradient: ["#bae6fd", "#38bdf8"],
    categoria: "Ferramentas",
  },
];

export function avisoLojaEmBreve() {
  Alert.alert(
    "Loja chegando",
    "A loja oficial Terra Gentil está sendo preparada. Em breve você vai poder comprar tudo isso por aqui mesmo.",
    [{ text: "Combinado", style: "default" }]
  );
}

// Palavras que nao identificam produto
const PALAVRAS_VAZIAS = new Set(["para", "com", "sem", "de", "da", "do", "das", "dos", "uma", "um", "agua", "limpa", "limpo"]);

export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function palavras(texto: string): string[] {
  return normalizar(texto)
    .split(/[^a-z0-9]+/)
    .filter((p) => p.length >= 4 && !PALAVRAS_VAZIAS.has(p));
}

export interface OfertaCasada {
  id: string;
  nome: string;
  preco: string;
  gradient: [string, string];
  // Material do plano que puxou a oferta
  para: string;
}

const TODAS_OFERTAS = [
  ...FLASH_DEALS.map((d) => ({ id: d.id, nome: d.nome, preco: d.precoPor, gradient: d.gradient })),
  ...REC_DEALS.map((d) => ({ id: d.id, nome: d.nome, preco: d.preco, gradient: d.gradient })),
];

// Casamento simples por palavra: uma palavra do material (4 letras ou mais,
// sem acento) aparece no nome da oferta. Uma oferta por material, no maximo `limite`.
export function ofertasParaMateriais(materiais: string[], limite = 2): OfertaCasada[] {
  const escolhidas: OfertaCasada[] = [];
  const usadas = new Set<string>();
  for (const material of materiais) {
    if (escolhidas.length >= limite) break;
    const chaves = palavras(material);
    if (chaves.length === 0) continue;
    const oferta = TODAS_OFERTAS.find((o) => {
      if (usadas.has(o.id)) return false;
      const nomeOferta = palavras(o.nome);
      return chaves.some((c) => nomeOferta.includes(c));
    });
    if (oferta) {
      usadas.add(oferta.id);
      escolhidas.push({ ...oferta, para: material });
    }
  }
  return escolhidas;
}
