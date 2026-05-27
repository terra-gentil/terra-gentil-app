import AsyncStorage from "@react-native-async-storage/async-storage";
import { salvarConsulta, listarConsultas, limparHistorico } from "../historico";
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
    expect(lista[0].imageUri).toBe("file://foto.jpg");
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

  it("mais de 20 consultas fica limitado a 20", async () => {
    for (let i = 0; i < 25; i++) {
      await salvarConsulta(mockDiag, `file://foto-${i}.jpg`);
    }
    const lista = await listarConsultas();
    expect(lista).toHaveLength(20);
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
