import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { DiagnosticoResponse, EstadoSaude } from "../api/diagnostico";
import { CANAL_PLANTAS, garantirCanal } from "../notificacoes/avisos";
import { ConsultaHistorico, chavePlanta } from "./historico";

// "Plantas em cuidado": plantas com tratamento em andamento ou lembrete de rega ligado.
// Os avisos sao locais (expo-notifications); aqui ficam os ids para desfazer depois.
const STORAGE_KEY = "@terragentil:plantas-em-cuidado";
const DIA_MS = 86400000;
export const HORA_REGA = 9;
export const HORA_RETORNO = 10;
// Para rega a cada N dias (N >= 2) o Android nao tem "repetir a cada N dias as 9h":
// agenda uma serie de avisos com data e renova quando restam poucos.
const JANELA_SERIE_DIAS = 60;
const MIN_RESTANTES = 3;

export interface RegaAgendada {
  dias: number;
  ml?: number;
  ids: string[];
  // Datas da serie (vazio quando e o aviso diario repetido)
  datas: number[];
}

export interface PlantaEmCuidado {
  chave: string;
  consultaId?: string;
  nome_popular: string;
  estado_saude: EstadoSaude;
  imageUri?: string;
  emTratamento: boolean;
  proximoRetorno?: number;
  retornoNotifId?: string;
  rega?: RegaAgendada;
  atualizadoEm: number;
}

export interface PlantaRef {
  chave: string;
  nome_popular: string;
  estado_saude: EstadoSaude;
  consultaId?: string;
  imageUri?: string;
}

const DOENTE: EstadoSaude[] = ["atencao", "doente", "critico"];
export const RETORNO_PADRAO_DIAS = 7;

export function precisaCuidado(estado: EstadoSaude): boolean {
  return DOENTE.includes(estado);
}

export function refDoLaudo(r: DiagnosticoResponse, consulta?: ConsultaHistorico | null): PlantaRef {
  return {
    chave: chavePlanta(r),
    nome_popular: r.nome_popular,
    estado_saude: r.estado_saude,
    consultaId: consulta?.id,
    imageUri: consulta?.imageUri,
  };
}

export function dataAs(dias: number, horaDoDia: number, agora: Date = new Date()): Date {
  const d = new Date(agora.getTime());
  d.setDate(d.getDate() + dias);
  d.setHours(horaDoDia, 0, 0, 0);
  return d;
}

async function ler(): Promise<PlantaEmCuidado[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const lista = raw ? (JSON.parse(raw) as PlantaEmCuidado[]) : [];
    return Array.isArray(lista) ? lista : [];
  } catch (err) {
    console.log("[cuidado] erro ao ler:", err);
    return [];
  }
}

async function gravar(lista: PlantaEmCuidado[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
}

async function cancelarIds(ids: (string | undefined)[]): Promise<void> {
  for (const id of ids) {
    if (!id) continue;
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (err) {
      console.log("[cuidado] erro ao cancelar aviso:", err);
    }
  }
}

// Atualiza (ou cria) a planta com os dados basicos; devolve a lista nova e o item
async function mesclar(ref: PlantaRef, mudar: (p: PlantaEmCuidado) => PlantaEmCuidado | null): Promise<PlantaEmCuidado | null> {
  const lista = await ler();
  const i = lista.findIndex((p) => p.chave === ref.chave);
  const base: PlantaEmCuidado =
    i >= 0
      ? { ...lista[i] }
      : { chave: ref.chave, nome_popular: ref.nome_popular, estado_saude: ref.estado_saude, emTratamento: false, atualizadoEm: Date.now() };
  base.nome_popular = ref.nome_popular || base.nome_popular;
  base.estado_saude = ref.estado_saude || base.estado_saude;
  if (ref.consultaId) base.consultaId = ref.consultaId;
  if (ref.imageUri) base.imageUri = ref.imageUri;
  base.atualizadoEm = Date.now();
  const novo = mudar(base);
  const resto = lista.filter((p) => p.chave !== ref.chave);
  const final = novo && (novo.emTratamento || novo.rega || novo.retornoNotifId) ? [novo, ...resto] : resto;
  await gravar(final);
  return novo;
}

export async function listarPlantasEmCuidado(): Promise<PlantaEmCuidado[]> {
  const lista = await ler();
  // Retorno mais proximo primeiro; quem so tem rega vai para o fim
  return [...lista].sort((a, b) => (a.proximoRetorno ?? Infinity) - (b.proximoRetorno ?? Infinity));
}

export async function plantaEmCuidado(chave: string): Promise<PlantaEmCuidado | null> {
  return (await ler()).find((p) => p.chave === chave) || null;
}

// Chamado ao salvar um laudo novo: doente/atencao entra (ou continua) na lista; saudavel sai do tratamento
export async function registrarLaudo(r: DiagnosticoResponse, consulta: ConsultaHistorico | null): Promise<void> {
  if (!r.eh_planta) return;
  try {
    const ref = refDoLaudo(r, consulta);
    const anterior = await plantaEmCuidado(ref.chave);
    // A foto nova ja e o retorno: o aviso antigo nao faz mais sentido
    if (anterior?.retornoNotifId) await cancelarIds([anterior.retornoNotifId]);
    if (!anterior && !precisaCuidado(r.estado_saude)) return;
    await mesclar(ref, (p) => {
      const dias = r.acompanhamento?.retorno_em_dias || RETORNO_PADRAO_DIAS;
      if (precisaCuidado(r.estado_saude)) {
        return { ...p, emTratamento: true, proximoRetorno: dataAs(dias, HORA_RETORNO).getTime(), retornoNotifId: undefined };
      }
      return { ...p, emTratamento: false, proximoRetorno: undefined, retornoNotifId: undefined };
    });
  } catch (err) {
    console.log("[cuidado] erro ao registrar laudo:", err);
  }
}

// "Me avise em N dias": a permissao ja deve ter sido conferida por quem chama
export async function agendarRetorno(ref: PlantaRef, dias: number): Promise<Date> {
  await garantirCanal();
  const data = dataAs(dias, HORA_RETORNO);
  const anterior = await plantaEmCuidado(ref.chave);
  if (anterior?.retornoNotifId) await cancelarIds([anterior.retornoNotifId]);
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `Hora de rever: ${ref.nome_popular}`,
      body: "Tire uma nova foto para o Doutor comparar com o laudo de hoje.",
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: data, channelId: CANAL_PLANTAS },
  });
  await mesclar(ref, (p) => ({
    ...p,
    emTratamento: p.emTratamento || precisaCuidado(ref.estado_saude),
    proximoRetorno: data.getTime(),
    retornoNotifId: id,
  }));
  return data;
}

export async function cancelarRetorno(chave: string): Promise<void> {
  const p = await plantaEmCuidado(chave);
  if (!p) return;
  await cancelarIds([p.retornoNotifId]);
  await mesclar(p, (x) => ({ ...x, retornoNotifId: undefined }));
}

function conteudoRega(nome: string, ml?: number): Notifications.NotificationContentInput {
  return {
    title: `Hora de regar: ${nome}`,
    body: ml && ml > 0
      ? `Dê cerca de ${ml} ml de água, se a terra estiver seca ao toque.`
      : "Toque na terra: se estiver seca, é hora de dar água.",
  };
}

// Datas da serie de rega a partir de `inicio` (exclusivo), a cada `dias`, as 9h
export function datasDaSerie(dias: number, inicio: Date, quantidade: number): Date[] {
  const lista: Date[] = [];
  for (let k = 1; k <= quantidade; k++) {
    const d = new Date(inicio.getTime());
    d.setDate(d.getDate() + dias * k);
    d.setHours(HORA_REGA, 0, 0, 0);
    lista.push(d);
  }
  return lista;
}

async function agendarSerie(nome: string, dias: number, ml: number | undefined, inicio: Date): Promise<{ ids: string[]; datas: number[] }> {
  const qtd = Math.max(4, Math.min(12, Math.ceil(JANELA_SERIE_DIAS / dias)));
  const datas = datasDaSerie(dias, inicio, qtd);
  const ids: string[] = [];
  for (const d of datas) {
    ids.push(
      await Notifications.scheduleNotificationAsync({
        content: conteudoRega(nome, ml),
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: d, channelId: CANAL_PLANTAS },
      }),
    );
  }
  return { ids, datas: datas.map((d) => d.getTime()) };
}

// "Lembrar de regar": a cada `dias` dias, as 9h. Devolve a data do primeiro aviso.
export async function agendarRega(ref: PlantaRef, dias: number, ml?: number): Promise<Date> {
  await garantirCanal();
  const anterior = await plantaEmCuidado(ref.chave);
  if (anterior?.rega) await cancelarIds(anterior.rega.ids);
  let rega: RegaAgendada;
  let primeiro: Date;
  if (dias <= 1) {
    const id = await Notifications.scheduleNotificationAsync({
      content: conteudoRega(ref.nome_popular, ml),
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: HORA_REGA, minute: 0, channelId: CANAL_PLANTAS },
    });
    const agora = new Date();
    primeiro = dataAs(agora.getHours() < HORA_REGA ? 0 : 1, HORA_REGA, agora);
    rega = { dias: 1, ml, ids: [id], datas: [] };
  } else {
    const serie = await agendarSerie(ref.nome_popular, dias, ml, new Date());
    primeiro = new Date(serie.datas[0]);
    rega = { dias, ml, ...serie };
  }
  await mesclar(ref, (p) => ({ ...p, rega }));
  return primeiro;
}

export async function cancelarRega(chave: string): Promise<void> {
  const p = await plantaEmCuidado(chave);
  if (!p?.rega) return;
  await cancelarIds(p.rega.ids);
  await mesclar(p, (x) => ({ ...x, rega: undefined }));
}

// Para tudo da planta e tira da lista
export async function pararCuidados(chave: string): Promise<void> {
  const p = await plantaEmCuidado(chave);
  if (!p) return;
  await cancelarIds([p.retornoNotifId, ...(p.rega?.ids || [])]);
  await gravar((await ler()).filter((x) => x.chave !== chave));
}

// Chamado ao abrir a Home: completa as series de rega que estao acabando
export async function renovarRegas(agora: number = Date.now()): Promise<void> {
  try {
    const lista = await ler();
    let mudou = false;
    for (const p of lista) {
      const rega = p.rega;
      if (!rega || rega.datas.length === 0) continue;
      const futuras = rega.datas.filter((d) => d > agora);
      if (futuras.length >= MIN_RESTANTES) continue;
      const ultima = new Date(Math.max(agora, ...rega.datas));
      const serie = await agendarSerie(p.nome_popular, rega.dias, rega.ml, ultima);
      const manter = rega.datas.map((d, i) => ({ d, id: rega.ids[i] })).filter((x) => x.d > agora);
      p.rega = { ...rega, ids: [...manter.map((x) => x.id), ...serie.ids], datas: [...manter.map((x) => x.d), ...serie.datas] };
      mudou = true;
    }
    if (mudou) await gravar(lista);
  } catch (err) {
    console.log("[cuidado] erro ao renovar regas:", err);
  }
}

// Proximo aviso de rega, para mostrar na tela
export function proximaRega(rega: RegaAgendada, agora: number = Date.now()): Date {
  if (rega.datas.length === 0) {
    const a = new Date(agora);
    return dataAs(a.getHours() < HORA_REGA ? 0 : 1, HORA_REGA, a);
  }
  const prox = rega.datas.find((d) => d > agora);
  return new Date(prox ?? rega.datas[rega.datas.length - 1]);
}
