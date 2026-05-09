import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_LIKES = "@terragentil:comunidade_likes";
const KEY_SAVES = "@terragentil:comunidade_saves";
const KEY_SEGUINDO = "@terragentil:comunidade_seguindo";
const KEY_MEUS_POSTS = "@terragentil:comunidade_meus_posts";
const KEY_COMENTARIOS = "@terragentil:comunidade_comentarios";
const KEY_BUSCA_RECENTE = "@terragentil:comunidade_busca_recente";

const LIMITE_BUSCA_RECENTE = 8;

export interface MeuPost {
  id: string;
  timestamp: number;
  cat: string;
  title: string;
  paletaId: string;
  tags: string[];
  comentariosBase: number;
  likesBase: number;
  imageUri?: string;
}

export interface Comentario {
  id: string;
  timestamp: number;
  postId: string | number;
  autor: string;
  emoji: string;
  texto: string;
}

async function lerObj<T extends Record<string, unknown>>(key: string): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return {} as T;
    const obj = JSON.parse(raw);
    return (obj && typeof obj === "object" ? obj : {}) as T;
  } catch (err) {
    console.log("[comunidade]", key, "erro ao ler:", err);
    return {} as T;
  }
}

async function salvarObj(key: string, obj: Record<string, unknown>) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(obj));
  } catch (err) {
    console.log("[comunidade]", key, "erro ao salvar:", err);
  }
}

async function lerLista<T>(key: string): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    const lista = JSON.parse(raw);
    return Array.isArray(lista) ? (lista as T[]) : [];
  } catch (err) {
    console.log("[comunidade]", key, "erro ao ler lista:", err);
    return [];
  }
}

async function salvarLista<T>(key: string, lista: T[]) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(lista));
  } catch (err) {
    console.log("[comunidade]", key, "erro ao salvar lista:", err);
  }
}

// ============ LIKES ============

export async function obterLikes(): Promise<Record<string, true>> {
  return lerObj<Record<string, true>>(KEY_LIKES);
}

export async function alternarLike(postId: string | number): Promise<boolean> {
  const id = String(postId);
  const likes = await obterLikes();
  if (likes[id]) {
    delete likes[id];
  } else {
    likes[id] = true;
  }
  await salvarObj(KEY_LIKES, likes);
  return Boolean(likes[id]);
}

// ============ SAVES ============

export async function obterSaves(): Promise<Record<string, true>> {
  return lerObj<Record<string, true>>(KEY_SAVES);
}

export async function alternarSave(postId: string | number): Promise<boolean> {
  const id = String(postId);
  const saves = await obterSaves();
  if (saves[id]) {
    delete saves[id];
  } else {
    saves[id] = true;
  }
  await salvarObj(KEY_SAVES, saves);
  return Boolean(saves[id]);
}

// ============ SEGUINDO ============

export async function obterSeguindo(): Promise<Record<string, true>> {
  return lerObj<Record<string, true>>(KEY_SEGUINDO);
}

export async function alternarSeguir(autor: string): Promise<boolean> {
  const seguindo = await obterSeguindo();
  if (seguindo[autor]) {
    delete seguindo[autor];
  } else {
    seguindo[autor] = true;
  }
  await salvarObj(KEY_SEGUINDO, seguindo);
  return Boolean(seguindo[autor]);
}

// ============ MEUS POSTS ============

export async function listarMeusPosts(): Promise<MeuPost[]> {
  const lista = await lerLista<MeuPost>(KEY_MEUS_POSTS);
  return lista.sort((a, b) => b.timestamp - a.timestamp);
}

export async function adicionarMeuPost(
  dados: Omit<MeuPost, "id" | "timestamp" | "likesBase" | "comentariosBase">,
): Promise<MeuPost> {
  const novo: MeuPost = {
    ...dados,
    id: `meu-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
    likesBase: 0,
    comentariosBase: 0,
  };
  const lista = await lerLista<MeuPost>(KEY_MEUS_POSTS);
  lista.unshift(novo);
  await salvarLista(KEY_MEUS_POSTS, lista);
  return novo;
}

export async function removerMeuPost(id: string): Promise<void> {
  const lista = await lerLista<MeuPost>(KEY_MEUS_POSTS);
  const filtrada = lista.filter((p) => p.id !== id);
  await salvarLista(KEY_MEUS_POSTS, filtrada);
}

// ============ COMENTARIOS ============

export async function listarComentarios(
  postId: string | number,
): Promise<Comentario[]> {
  const todos = await lerObj<Record<string, Comentario[]>>(KEY_COMENTARIOS);
  const id = String(postId);
  const lista = todos[id];
  return Array.isArray(lista) ? lista : [];
}

export async function adicionarComentario(
  postId: string | number,
  autor: string,
  texto: string,
  emoji: string = "🌱",
): Promise<Comentario> {
  const id = String(postId);
  const todos = await lerObj<Record<string, Comentario[]>>(KEY_COMENTARIOS);
  const novo: Comentario = {
    id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
    postId: id,
    autor,
    emoji,
    texto,
  };
  const lista = Array.isArray(todos[id]) ? todos[id] : [];
  lista.push(novo);
  todos[id] = lista;
  await salvarObj(KEY_COMENTARIOS, todos as unknown as Record<string, unknown>);
  return novo;
}

export async function contarComentarios(
  postId: string | number,
): Promise<number> {
  const lista = await listarComentarios(postId);
  return lista.length;
}

// ============ BUSCA RECENTE ============

export async function obterBuscasRecentes(): Promise<string[]> {
  return lerLista<string>(KEY_BUSCA_RECENTE);
}

export async function registrarBusca(termo: string): Promise<void> {
  const limpo = termo.trim();
  if (limpo.length < 2) return;
  const atual = await obterBuscasRecentes();
  const sem = atual.filter((t) => t.toLowerCase() !== limpo.toLowerCase());
  const nova = [limpo, ...sem].slice(0, LIMITE_BUSCA_RECENTE);
  await salvarLista(KEY_BUSCA_RECENTE, nova);
}

// ============ HELPERS ============

export function formatarK(num: number): string {
  if (num >= 1000) {
    const k = num / 1000;
    return k >= 10
      ? `${Math.round(k)}K`
      : `${k.toFixed(1).replace(".", ",")}K`;
  }
  return String(num);
}
