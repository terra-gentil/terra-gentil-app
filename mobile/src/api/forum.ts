import { API_BASE_URL } from "../config/api";

const SITE = "terra-gentil";

// Tipos espelho dos schemas do backend

export interface TopicOut {
  id: string;
  title: string;
  body: string;
  category: string;
  site: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  pinned: boolean;
  created_at: string;
  last_post_at: string | null;
  reply_count: number;
  reactions: { mata: number; tava_la: number; curtir?: number };
  my_reactions: string[];
}

export interface TopicsPageOut {
  items: TopicOut[];
  total: number;
  page: number;
  per_page: number;
  site: string;
}

export interface PostOut {
  id: string;
  topic_id: string;
  body: string;
  site: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  reactions: Record<string, number>;
  my_reactions: string[];
}

export interface TopicDetailOut {
  topic: TopicOut;
  posts: PostOut[];
}

type RequisicaoOpts = {
  method?: string;
  body?: unknown;
  token?: string | null;
};

async function requisicao<T>(caminho: string, opts: RequisicaoOpts = {}): Promise<T> {
  const { method = "GET", body, token } = opts;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Site": SITE,
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const resp = await fetch(`${API_BASE_URL}${caminho}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!resp.ok) {
    const texto = await resp.text().catch(() => String(resp.status));
    throw new Error(`${resp.status}: ${texto}`);
  }
  return resp.json() as Promise<T>;
}

export async function listarTopics(opts: {
  page?: number;
  perPage?: number;
  category?: string;
  sort?: "activity" | "newest" | "noreply";
  token?: string | null;
}): Promise<TopicsPageOut> {
  const { page = 1, perPage = 20, category = "", sort = "activity", token } = opts;
  const params = new URLSearchParams({ page: String(page), per_page: String(perPage), sort });
  if (category) params.set("category", category);
  return requisicao<TopicsPageOut>(`/forum/topics?${params}`, { token });
}

export async function buscarTopicComPosts(
  topicId: string,
  token?: string | null,
): Promise<TopicDetailOut> {
  return requisicao<TopicDetailOut>(`/forum/topics/${topicId}`, { token });
}

export async function criarTopic(
  data: { title: string; body: string; category: string },
  token: string,
): Promise<TopicOut> {
  return requisicao<TopicOut>("/forum/topics", { method: "POST", body: data, token });
}

export async function criarResposta(
  topicId: string,
  body: string,
  token: string,
): Promise<PostOut> {
  return requisicao<PostOut>(`/forum/topics/${topicId}/posts`, {
    method: "POST",
    body: { body },
    token,
  });
}

export async function toggleReacao(
  data: {
    target_id: string;
    target_type: "topic" | "post";
    type: "tava_la" | "mata" | "curtir" | "salvar";
  },
  token: string,
): Promise<{ active: boolean; count: number; type: string }> {
  return requisicao("/forum/reactions", { method: "POST", body: data, token });
}
