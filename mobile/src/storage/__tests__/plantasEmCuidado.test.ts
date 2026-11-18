import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import type { DiagnosticoResponse } from "../../api/diagnostico";
import {
  agendarRega,
  agendarRetorno,
  cancelarRega,
  cancelarRetorno,
  listarPlantasEmCuidado,
  pararCuidados,
  plantaEmCuidado,
  registrarLaudo,
  renovarRegas,
} from "../plantasEmCuidado";

const agendar = Notifications.scheduleNotificationAsync as jest.Mock;
const cancelar = Notifications.cancelScheduledNotificationAsync as jest.Mock;

const base: DiagnosticoResponse = {
  eh_planta: true,
  especie_identificada: "Cucurbita pepo",
  nome_popular: "Abobrinha",
  confianca: 0.9,
  estado_saude: "doente",
  toxica_para_pets: false,
  toxicidade_detalhes: "",
  nivel_luz: "sol_pleno",
  rega_dias: 3,
  rega_condicao: "",
  temperatura_ideal: "",
  nivel_dificuldade: "medio",
  luz_porcentagem: 80,
  luz_veredito: "",
  diagnostico_titulo: "Oídio",
  diagnostico_explicacao: "",
  problemas_detectados: [],
  plano_tratamento: "",
  plano_timeline: [],
  precisa_retorno: true,
  mensagem_retorno: "",
  acompanhamento: { retorno_em_dias: 10 },
};
const consulta = {
  id: "c1",
  timestamp: Date.now(),
  imageUri: "file:///docs/historico-fotos/c1.jpg",
  nome_popular: "Abobrinha",
  especie_identificada: "Cucurbita pepo",
  estado_saude: "doente" as const,
  diagnostico_titulo: "Oídio",
};
const ref = { chave: "cucurbita pepo", nome_popular: "Abobrinha", estado_saude: "doente" as const, consultaId: "c1" };

let n = 0;
beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  n = 0;
  agendar.mockImplementation(async () => `id-${++n}`);
});

describe("lista de plantas em cuidado", () => {
  it("planta doente entra com o proximo retorno; saudavel depois sai", async () => {
    await registrarLaudo(base, consulta);
    let lista = await listarPlantasEmCuidado();
    expect(lista).toHaveLength(1);
    expect(lista[0]).toMatchObject({ chave: "cucurbita pepo", consultaId: "c1", emTratamento: true, imageUri: consulta.imageUri });
    const dias = Math.round((lista[0].proximoRetorno! - Date.now()) / 86400000);
    expect(dias).toBeGreaterThanOrEqual(9);
    expect(dias).toBeLessThanOrEqual(10);

    await registrarLaudo({ ...base, estado_saude: "saudavel" }, { ...consulta, id: "c2" });
    lista = await listarPlantasEmCuidado();
    expect(lista).toHaveLength(0);
  });

  it("planta saudavel sem lembrete nao entra", async () => {
    await registrarLaudo({ ...base, estado_saude: "saudavel" }, consulta);
    expect(await listarPlantasEmCuidado()).toHaveLength(0);
  });

  it("pararCuidados cancela retorno e rega e tira da lista", async () => {
    await agendarRetorno(ref, 7);
    await agendarRega(ref, 3);
    await pararCuidados(ref.chave);
    expect(await listarPlantasEmCuidado()).toHaveLength(0);
    expect(cancelar).toHaveBeenCalledWith("id-1");
    expect(cancelar).toHaveBeenCalledWith("id-2");
  });
});

describe("Me avise em N dias persistido", () => {
  it("agenda as 10h, guarda o id e cancela pelo id", async () => {
    const data = await agendarRetorno(ref, 14);
    expect(data.getHours()).toBe(10);
    const p = await plantaEmCuidado(ref.chave);
    expect(p?.retornoNotifId).toBe("id-1");
    expect(p?.proximoRetorno).toBe(data.getTime());
    await cancelarRetorno(ref.chave);
    expect(cancelar).toHaveBeenCalledWith("id-1");
    expect((await plantaEmCuidado(ref.chave))?.retornoNotifId).toBeUndefined();
  });
});

describe("lembrete de rega recorrente", () => {
  it("a cada 3 dias: serie de avisos as 9h com nome e ml, canal criado antes", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    const primeiro = await agendarRega(ref, 3, 250);
    expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
      "lembretes-plantas",
      expect.objectContaining({ name: "Lembretes das plantas", importance: 4 }),
    );
    const chamadas = agendar.mock.calls.map((c) => c[0]);
    expect(chamadas.length).toBeGreaterThanOrEqual(4);
    expect(chamadas[0].content.title).toBe("Hora de regar: Abobrinha");
    expect(chamadas[0].content.body).toContain("250 ml");
    const datas = chamadas.map((c) => new Date(c.trigger.date));
    datas.forEach((d) => expect(d.getHours()).toBe(9));
    expect(Math.round((datas[1].getTime() - datas[0].getTime()) / 86400000)).toBe(3);
    expect(primeiro.getTime()).toBe(datas[0].getTime());
    const p = await plantaEmCuidado(ref.chave);
    expect(p?.rega?.ids).toHaveLength(chamadas.length);
    jest.restoreAllMocks();
  });

  it("todo dia: um aviso diario repetido as 9h", async () => {
    await agendarRega(ref, 1);
    expect(agendar).toHaveBeenCalledTimes(1);
    expect(agendar.mock.calls[0][0].trigger).toMatchObject({ type: "daily", hour: 9, minute: 0 });
  });

  it("cancelar desmarca todos os avisos da serie", async () => {
    await agendarRega(ref, 5);
    const ids = (await plantaEmCuidado(ref.chave))!.rega!.ids;
    await cancelarRega(ref.chave);
    ids.forEach((id) => expect(cancelar).toHaveBeenCalledWith(id));
    // Sem tratamento nem rega, sai da lista
    expect(await plantaEmCuidado(ref.chave)).toBeNull();
  });

  it("renovarRegas completa a serie quando restam poucos avisos", async () => {
    await agendarRega(ref, 10);
    const antes = (await plantaEmCuidado(ref.chave))!.rega!;
    // Daqui a 50 dias, so restam 1 ou 2 avisos
    const futuro = antes.datas[antes.datas.length - 2] - 1000;
    agendar.mockClear();
    await renovarRegas(futuro);
    expect(agendar).toHaveBeenCalled();
    const depois = (await plantaEmCuidado(ref.chave))!.rega!;
    expect(depois.datas.filter((d) => d > futuro).length).toBeGreaterThanOrEqual(3);
  });
});
