import { getToken } from "../storage/auth";
import { FORUM_API_URL } from "../config/api";

export interface Notificacao {
  id: string;
  title: string;
  body: string;
  type: string;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

async function headers(): Promise<Record<string, string>> {
  const token = await getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function registrarPushToken(token: string, platform: string): Promise<void> {
  const h = await headers();
  await fetch(`${FORUM_API_URL}/push-tokens`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({ token, platform }),
  });
}

export async function listarNotificacoes(limit = 50, offset = 0): Promise<Notificacao[]> {
  const h = await headers();
  const r = await fetch(`${FORUM_API_URL}/notifications?limit=${limit}&offset=${offset}`, { headers: h });
  if (!r.ok) return [];
  return r.json();
}

export async function marcarLida(id: string): Promise<void> {
  const h = await headers();
  await fetch(`${FORUM_API_URL}/notifications/${id}/read`, { method: "POST", headers: h });
}

export async function enviarBroadcast(titulo: string, corpo: string): Promise<{ enviados: number }> {
  const h = await headers();
  const r = await fetch(`${FORUM_API_URL}/admin/notifications/broadcast`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({ titulo, corpo }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function buscarStats(): Promise<{
  usuarios: number;
  posts: number;
  respostas: number;
  usuarios_com_push: number;
}> {
  const h = await headers();
  const r = await fetch(`${FORUM_API_URL}/admin/stats`, { headers: h });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
