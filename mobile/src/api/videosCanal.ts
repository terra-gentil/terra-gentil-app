// Videos do canal Terra Gentil, lidos do feed publico do YouTube (sem chave de API, ate 15 mais recentes).
// Usado pela aba Videos e pelo cartao do canal no fim do laudo. Guarda em memoria por 1 hora;
// se a rede falhar, usa a lista de reserva abaixo.

export const CANAL_ID = "UCfZn0uytIhsk30SMQtoKeLA";
export const CANAL_URL = "https://www.youtube.com/@TerraGentil";
// Abre o canal ja com a caixa de confirmacao de inscricao
export const CANAL_INSCREVER_URL = `${CANAL_URL}?sub_confirmation=1`;
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CANAL_ID}`;
const UMA_HORA = 60 * 60 * 1000;

export interface VideoCanal {
  id: string;
  titulo: string;
  url: string;
  thumb: string;
  data: string; // "14 nov 2026"
  short: boolean;
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

// "2026-11-14T12:00:10+00:00" -> "14 nov 2026"
export function dataCurta(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return "";
  return `${Number(m[3])} ${MESES[Number(m[2]) - 1]} ${m[1]}`;
}

export function videoDoId(id: string, titulo: string, publicado: string, short = false): VideoCanal {
  return {
    id,
    titulo,
    url: short ? `https://www.youtube.com/shorts/${id}` : `https://www.youtube.com/watch?v=${id}`,
    thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    data: dataCurta(publicado),
    short,
  };
}

// Reserva sem internet: conferida no feed em 18/11/2026. Atualizar de vez em quando.
export const VIDEOS_RESERVA: VideoCanal[] = [
  videoDoId("FY1BRO30YyY", "Ele PERDEU O EMPREGO e o Jardim ficou ABANDONADO. Limpei de GRAÇA", "2026-11-14"),
  videoDoId("Q9FzrwE7nBA", "JARDIM ABANDONADO da Senhora de 90 anos Invadiu a Calçada: Limpei Tudo de GRAÇA!", "2026-11-07"),
  videoDoId("ykCh1KKHcvg", "17 HORAS Limpando de GRAÇA o JARDIM ABANDONADO dessa Senhora!", "2026-10-31"),
  videoDoId("5xIySYrszC4", "Viúvo aos 87, não dá mais conta do JARDIM ABANDONADO. Limpei tudo de GRAÇA!", "2026-10-24"),
  videoDoId("BuM4y6FvX10", "Aos 78 anos, ela me ABENÇOOU por limpar o Jardim Abandonado de GRAÇA!", "2026-10-17"),
];

const ENTIDADES: Record<string, string> = { "&amp;": "&", "&quot;": '"', "&#39;": "'", "&apos;": "'", "&lt;": "<", "&gt;": ">" };
const decodificar = (t: string) => t.replace(/&[a-z#0-9]+;/g, (e) => ENTIDADES[e] ?? e);

// Todos os <entry> do feed, do mais recente para o mais antigo
export function lerFeed(xml: string): VideoCanal[] {
  return xml
    .split("<entry>")
    .slice(1)
    .map((e) => {
      const id = e.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1]?.trim();
      const titulo = e.match(/<title>([^<]*)<\/title>/)?.[1]?.trim();
      const publicado = e.match(/<published>([^<]+)<\/published>/)?.[1] ?? "";
      const link = e.match(/<link rel="alternate" href="([^"]+)"/)?.[1] ?? "";
      if (!id || !titulo) return null;
      return videoDoId(id, decodificar(titulo), publicado, link.includes("/shorts/"));
    })
    .filter((v): v is VideoCanal => v !== null);
}

let cache: { videos: VideoCanal[]; quando: number } | null = null;

export async function buscarVideosCanal(): Promise<VideoCanal[]> {
  if (cache && Date.now() - cache.quando < UMA_HORA) return cache.videos;
  try {
    const resp = await fetch(FEED_URL);
    if (!resp.ok) throw new Error(`feed ${resp.status}`);
    const videos = lerFeed(await resp.text());
    if (videos.length === 0) throw new Error("feed sem video");
    cache = { videos, quando: Date.now() };
    return videos;
  } catch {
    return VIDEOS_RESERVA;
  }
}

// Ultimo video normal (nao short), para o cartao do laudo
export async function buscarUltimoVideo(): Promise<VideoCanal> {
  const videos = await buscarVideosCanal();
  return videos.find((v) => !v.short) ?? videos[0] ?? VIDEOS_RESERVA[0];
}
