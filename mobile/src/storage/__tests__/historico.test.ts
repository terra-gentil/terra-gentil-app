import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import {
  ConsultaHistorico,
  acharAnterior,
  carregarLaudo,
  chavePlanta,
  limparHistorico,
  listarConsultas,
  mesmaPlanta,
  salvarConsulta,
} from "../historico";
import { DiagnosticoResponse } from "../../api/diagnostico";

const mockDiag: DiagnosticoResponse = {
  eh_planta: true,
  especie_identificada: "Nephrolepis exaltata",
  nome_popular: "Samambaia",
  confianca: 0.95,
  estado_saude: "saudavel",
  toxica_para_pets: false,
  toxicidade_detalhes: "",
  nivel_luz: "indireta_brilhante",
  rega_dias: 3,
  rega_condicao: "Solo seco",
  temperatura_ideal: "18-25C",
  nivel_dificuldade: "facil",
  luz_porcentagem: 60,
  luz_veredito: "Bom",
  diagnostico_titulo: "Planta saudavel",
  diagnostico_explicacao: "Planta em otimas condicoes.",
  problemas_detectados: [],
  plano_tratamento: "",
  plano_timeline: [],
  precisa_retorno: false,
  mensagem_retorno: "",
};

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

describe("listarConsultas", () => {
  it("retorna array vazio sem dados", async () => {
    const lista = await listarConsultas();
    expect(lista).toEqual([]);
  });
});

describe("salvarConsulta", () => {
  it("salva e lista retorna a consulta com dados corretos", async () => {
    await salvarConsulta(mockDiag, "file://foto.jpg");
    const lista = await listarConsultas();
    expect(lista).toHaveLength(1);
    expect(lista[0].especie_identificada).toBe("Nephrolepis exaltata");
    expect(lista[0].nome_popular).toBe("Samambaia");
    // A foto do cache vira copia persistente na pasta do app
    expect(lista[0].imageUri).toMatch(/^file:\/\/\/docs\/historico-fotos\/.+\.jpg$/);
    expect(FileSystem.copyAsync).toHaveBeenCalledWith({ from: "file://foto.jpg", to: lista[0].imageUri });
    expect(lista[0].estado_saude).toBe("saudavel");
  });

  it("nao salva quando eh_planta=false", async () => {
    await salvarConsulta({ ...mockDiag, eh_planta: false }, "file://nao-planta.jpg");
    const lista = await listarConsultas();
    expect(lista).toHaveLength(0);
  });

  it("lista mais recente aparece primeiro", async () => {
    await salvarConsulta({ ...mockDiag, especie_identificada: "Especie A" }, "file://a.jpg");
    await salvarConsulta({ ...mockDiag, especie_identificada: "Especie B" }, "file://b.jpg");
    const lista = await listarConsultas();
    expect(lista[0].especie_identificada).toBe("Especie B");
    expect(lista[1].especie_identificada).toBe("Especie A");
  });

  it("mais de 30 consultas fica limitado a 30 e apaga foto e laudo das antigas", async () => {
    const primeira = await salvarConsulta(mockDiag, "file://foto-0.jpg");
    for (let i = 1; i < 32; i++) {
      await salvarConsulta(mockDiag, `file://foto-${i}.jpg`);
    }
    const lista = await listarConsultas();
    expect(lista).toHaveLength(30);
    expect(FileSystem.deleteAsync).toHaveBeenCalledWith(primeira!.imageUri, { idempotent: true });
    expect(await carregarLaudo(primeira!.id)).toBeNull();
  });

  it("guarda o laudo inteiro para reabrir depois", async () => {
    const c = await salvarConsulta(mockDiag, "file://foto.jpg");
    const salvo = await carregarLaudo(c!.id);
    expect(salvo?.resultado.diagnostico_titulo).toBe("Planta saudavel");
    expect(salvo?.consulta.id).toBe(c!.id);
  });

  it("se a copia falhar, mantem a URI original", async () => {
    (FileSystem.copyAsync as jest.Mock).mockRejectedValueOnce(new Error("sem espaco"));
    const c = await salvarConsulta(mockDiag, "file://cache/x.jpg");
    expect(c?.imageUri).toBe("file://cache/x.jpg");
  });
});

describe("listarConsultas com limite", () => {
  it("limite=1 com 3 consultas retorna so 1", async () => {
    await salvarConsulta(mockDiag, "file://foto1.jpg");
    await salvarConsulta(mockDiag, "file://foto2.jpg");
    await salvarConsulta(mockDiag, "file://foto3.jpg");
    const lista = await listarConsultas(1);
    expect(lista).toHaveLength(1);
  });
});

describe("limparHistorico", () => {
  it("limpar esvazia a lista", async () => {
    await salvarConsulta(mockDiag, "file://foto.jpg");
    await limparHistorico();
    const lista = await listarConsultas();
    expect(lista).toHaveLength(0);
  });
});

describe("antes e depois: consulta anterior da mesma planta", () => {
  const DIA = 86400000;
  const agora = Date.UTC(2026, 10, 17, 12);
  function c(over: Partial<ConsultaHistorico>): ConsultaHistorico {
    return {
      id: Math.random().toString(36),
      timestamp: agora - 10 * DIA,
      imageUri: "file:///docs/historico-fotos/a.jpg",
      nome_popular: "Jiboia",
      especie_identificada: "Epipremnum aureum",
      estado_saude: "doente",
      diagnostico_titulo: "",
      ...over,
    };
  }
  const atual = { id: "atual", timestamp: agora, especie_identificada: "Epipremnum  Aureum", nome_popular: "Jibóia" };

  it("normaliza acento, caixa e espacos", () => {
    expect(mesmaPlanta({ especie_identificada: "", nome_popular: "Jibóia" }, { especie_identificada: "x", nome_popular: "jiboia " })).toBe(true);
    expect(chavePlanta({ especie_identificada: "Epipremnum Aureum", nome_popular: "Jiboia" })).toBe("epipremnum aureum");
    expect(chavePlanta({ especie_identificada: "Desconhecida", nome_popular: "Jibóia" })).toBe("jiboia");
  });

  it("acha a mais recente dentro de 120 dias", () => {
    const antiga = c({ id: "a", timestamp: agora - 100 * DIA });
    const recente = c({ id: "b", timestamp: agora - 20 * DIA });
    expect(acharAnterior([antiga, recente], atual)?.id).toBe("b");
  });

  it("ignora outra planta, a propria consulta, mais de 120 dias e fotos do mesmo dia", () => {
    const outra = c({ especie_identificada: "Ficus lyrata", nome_popular: "Figueira" });
    const propria = c({ id: "atual", timestamp: agora - 5 * DIA });
    const velha = c({ timestamp: agora - 121 * DIA });
    const mesmoDia = c({ timestamp: agora - 2 * 3600000 });
    expect(acharAnterior([outra, propria, velha, mesmoDia], atual)).toBeNull();
  });
});
