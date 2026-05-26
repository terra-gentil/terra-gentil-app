import { ImageSourcePropType } from "react-native";
import { COLORS } from "../constants/theme";
import { MASCOT_POSES } from "../assets/mascot";
import { MeuPost } from "../storage/comunidade";
import { TopicOut } from "../api/forum";

export interface PostBase {
  id: string | number;
  cat: string;
  author: string;
  avatarColor: string;
  avatarEmoji?: string;
  avatarSource?: ImageSourcePropType;
  pinned?: boolean;
  title: string;
  gradient: [string, string, string];
  likesBase: number;
  comentariosBase: number;
  accent: string;
  accentDeep: string;
  tags: string[];
  isMine?: boolean;
  isApiTopic?: boolean;
  imageUri?: string;
  comment?: {
    avatar: string;
    name: string;
    text: string;
  };
}

export interface PaletaCor {
  id: string;
  label: string;
  gradient: [string, string, string];
  accent: string;
  accentDeep: string;
}

export const PALETAS: PaletaCor[] = [
  {
    id: "verde",
    label: "Verde jardim",
    gradient: ["#86efac", "#22c55e", "#15803d"],
    accent: COLORS.green,
    accentDeep: COLORS.greenDeep,
  },
  {
    id: "rosa",
    label: "Rosa florido",
    gradient: ["#fbcfe8", "#fb6f92", "#be185d"],
    accent: COLORS.coral,
    accentDeep: "#be185d",
  },
  {
    id: "amber",
    label: "Pôr do sol",
    gradient: ["#fde68a", "#f59e0b", "#b45309"],
    accent: COLORS.amber,
    accentDeep: "#b45309",
  },
  {
    id: "lavanda",
    label: "Lavanda",
    gradient: ["#ddd6fe", "#a78bfa", "#6d28d9"],
    accent: COLORS.lavender,
    accentDeep: "#6d28d9",
  },
  {
    id: "ceu",
    label: "Céu de manhã",
    gradient: ["#bae6fd", "#38bdf8", "#0369a1"],
    accent: COLORS.sky,
    accentDeep: "#0369a1",
  },
];

export const CATEGORIAS = [
  "Meu jardim",
  "Pragas e doenças",
  "Plantas pet-friendly",
  "Suculentas",
  "Hortas",
  "Floração",
  "Antes e depois",
  "Dúvida",
];

export const TAGS_DISPONIVEIS = [
  "pragas",
  "suculentas",
  "interior",
  "pet-friendly",
  "antes-depois",
  "horta",
  "floração",
  "rega",
  "luz",
  "adubação",
];

export function paletaPorId(id: string): PaletaCor {
  return PALETAS.find((p) => p.id === id) ?? PALETAS[0];
}

export const POSTS_MOCK: PostBase[] = [
  {
    id: "mock-1",
    cat: "Pragas e doenças",
    author: "Mariana V.",
    avatarColor: "#fb6f92",
    avatarEmoji: "🦋",
    title:
      "Cochonilha apareceu na minha violeta. O que vocês fazem que funciona?",
    gradient: ["#fbcfe8", "#fb6f92", "#be185d"],
    likesBase: 4200,
    comentariosBase: 892,
    accent: COLORS.coral,
    accentDeep: "#be185d",
    tags: ["pragas"],
    comment: {
      avatar: "🌻",
      name: "Joana",
      text: "Eu uso álcool 70 com cotonete em cada bichinho, leva 2 semanas mas resolve. Importante revisar embaixo das folhas...",
    },
  },
  {
    id: "mock-2",
    cat: "Plantas pet-friendly",
    author: "Doutor Gentileza",
    avatarColor: COLORS.green,
    avatarSource: MASCOT_POSES[0],
    pinned: true,
    title:
      "7 plantas seguras pra quem tem gato em casa (com foto e dica de cuidado)",
    gradient: ["#86efac", "#22c55e", "#15803d"],
    likesBase: 12300,
    comentariosBase: 2100,
    accent: COLORS.green,
    accentDeep: COLORS.greenDeep,
    tags: ["pet-friendly", "interior"],
    comment: {
      avatar: "😺",
      name: "Ricardo",
      text: "Salvei o post! Minha gata destruía minha jiboia, agora vou trocar por essas opções...",
    },
  },
  {
    id: "mock-3",
    cat: "Antes e depois",
    author: "Lucas R.",
    avatarColor: COLORS.amber,
    avatarEmoji: "🌵",
    title:
      "Antes e depois da minha suculenta após 3 meses cuidando do jeito do Doutor",
    gradient: ["#fde68a", "#f59e0b", "#b45309"],
    likesBase: 7800,
    comentariosBase: 1500,
    accent: COLORS.amber,
    accentDeep: "#b45309",
    tags: ["suculentas", "antes-depois"],
    comment: {
      avatar: "🌵",
      name: "Camila",
      text: "Que progresso lindo! A folha embaixo brotou tudo de novo. Quanto tempo de luz por dia ela pega?",
    },
  },
];

export const EMOJIS_MEU = ["🌱", "🍀", "🌿", "🌳", "🌷", "🌻", "🌼", "🌺", "🌸"];

const IMG_RE = /\[IMG\]([\s\S]*?)\[\/IMG\]/;

export function topicToPost(topic: TopicOut, currentUserId?: string | null): PostBase {
  const seed = topic.user_id
    ? topic.user_id.replace(/-/g, "").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
    : 0;
  const paleta = PALETAS[seed % PALETAS.length];
  const emojiIdx = seed % EMOJIS_MEU.length;
  const likeCount =
    (topic.reactions?.curtir ?? 0) +
    (topic.reactions?.tava_la ?? 0);

  const body = topic.body ?? "";
  const imgMatch = body.match(IMG_RE);
  const imageUri = imgMatch ? imgMatch[1] : undefined;
  const bodyText = body.replace(IMG_RE, "").trim();

  return {
    id: topic.id,
    cat: topic.category || "Geral",
    author: topic.display_name || "Usuário",
    avatarColor: paleta.accent,
    avatarEmoji: EMOJIS_MEU[emojiIdx],
    avatarSource: topic.avatar_url ? { uri: topic.avatar_url } : undefined,
    pinned: topic.pinned,
    title: topic.title,
    gradient: paleta.gradient,
    likesBase: likeCount,
    comentariosBase: topic.reply_count,
    accent: paleta.accent,
    accentDeep: paleta.accentDeep,
    tags: [],
    isMine: currentUserId ? topic.user_id === currentUserId : false,
    isApiTopic: true,
    imageUri,
    comment:
      bodyText
        ? {
            avatar: EMOJIS_MEU[emojiIdx],
            name: topic.display_name || "Autor",
            text: bodyText.length > 120 ? bodyText.substring(0, 117) + "..." : bodyText,
          }
        : undefined,
  };
}

export function postBaseFromMeu(meu: MeuPost, nickname: string): PostBase {
  const paleta = paletaPorId(meu.paletaId);
  const seed = meu.id.split("-").pop() ?? "0";
  const emojiIdx =
    seed
      .split("")
      .reduce((acc, c) => acc + c.charCodeAt(0), 0) % EMOJIS_MEU.length;
  return {
    id: meu.id,
    cat: meu.cat,
    author: nickname,
    avatarColor: paleta.accent,
    avatarEmoji: EMOJIS_MEU[emojiIdx],
    title: meu.title,
    gradient: paleta.gradient,
    likesBase: meu.likesBase,
    comentariosBase: meu.comentariosBase,
    accent: paleta.accent,
    accentDeep: paleta.accentDeep,
    tags: meu.tags,
    isMine: true,
    imageUri: meu.imageUri,
  };
}
