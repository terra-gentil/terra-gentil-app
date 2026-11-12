export const API_BASE_URL = "https://terra-gentil-app-production.up.railway.app";
export const FORUM_API_URL = "https://perpetual-energy-production-1a69.up.railway.app";
export const API_TIMEOUT_MS = 60000;
// Limite das leituras (GET) do forum e das notificacoes. Sem ele uma conexao
// travada deixava a lista da Comunidade presa em "carregando" pra sempre.
export const LEITURA_TIMEOUT_MS = 25000;

// fetch de leitura com timeout. Rejeita (AbortError) se estourar o limite.
export async function fetchComTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs: number = LEITURA_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
