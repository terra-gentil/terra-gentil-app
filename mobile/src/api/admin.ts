import { getToken } from "../storage/auth";
import { FORUM_API_URL } from "../config/api";

export interface Report {
  id: string;
  target_type: "topic" | "post";
  target_id: string;
  reason: string | null;
  reporter_id: string | null;
  created_at: string;
  conteudo_preview: string;
  autor_id: string | null;
}

export interface UsuarioAdmin {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bloqueado: boolean;
  created_at: string | null;
  total_posts: number;
}

async function headers(): Promise<Record<string, string>> {
  const token = await getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function buscarReports(
  limit = 20,
  offset = 0,
): Promise<{ total: number; reports: Report[] }> {
  const h = await headers();
  const r = await fetch(
    `${FORUM_API_URL}/admin/reports?limit=${limit}&offset=${offset}`,
    { headers: h },
  );
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function resolverReport(
  id: string,
  deletarConteudo: boolean,
): Promise<void> {
  const h = await headers();
  const r = await fetch(`${FORUM_API_URL}/admin/reports/${id}/resolver`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({ deletar_conteudo: deletarConteudo }),
  });
  if (!r.ok) throw new Error(await r.text());
}

export async function buscarUsuarios(q: string): Promise<UsuarioAdmin[]> {
  const h = await headers();
  const r = await fetch(
    `${FORUM_API_URL}/admin/users/buscar?q=${encodeURIComponent(q)}`,
    { headers: h },
  );
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function bloquearUsuario(id: string): Promise<void> {
  const h = await headers();
  const r = await fetch(`${FORUM_API_URL}/admin/users/${id}/bloquear`, {
    method: "POST",
    headers: h,
  });
  if (!r.ok) throw new Error(await r.text());
}

export async function desbloquearUsuario(id: string): Promise<void> {
  const h = await headers();
  const r = await fetch(`${FORUM_API_URL}/admin/users/${id}/desbloquear`, {
    method: "POST",
    headers: h,
  });
  if (!r.ok) throw new Error(await r.text());
}
