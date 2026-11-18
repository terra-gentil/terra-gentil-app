import React from "react";
import { act, fireEvent, render, within } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DiagnosticoResponse, ProblemaDetectado } from "../../../api/diagnostico";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("../../../storage/preferencias", () => ({ consumirLembrarCanal: async () => false }));
jest.mock("../../../storage/auth", () => ({ getToken: async () => "token" }));
jest.mock("../EbookViewerModal", () => () => null);
jest.mock("../NovaPostagemModal", () => () => null);
jest.mock("../LoginModal", () => () => null);

import DiagnosisScreen from "../DiagnosisScreen";
import MaisFotosScreen from "../../MaisFotosScreen";
import { caixaNaTela, limitarZoom, marcasDaLupa, zoomNaArea } from "../resultado/derivar";
import { Image } from "react-native";
import { diagnosticarPlanta } from "../../../api/diagnostico";

const base: DiagnosticoResponse = require("../../../../../docs/exemplos-relatorio-v2/04-oidio-abobrinha.jpg.json");
const WIKI = "https://upload.wikimedia.org/especie.jpg";

function prob(descricao: string, area: ProblemaDetectado["area_foto"]): ProblemaDetectado {
  return { descricao, gravidade: "alta", causa_provavel: "Fungo", categoria: "fungo_ou_bacteria", area_foto: area };
}

function laudo(extra: Partial<DiagnosticoResponse>): DiagnosticoResponse {
  return { ...base, foto_referencia: "", nota_estacao: "", ...extra };
}

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

async function tela(r: DiagnosticoResponse) {
  const t = render(<DiagnosisScreen imageUri="file:///agora.jpg" resultado={r} onVoltar={jest.fn()} onNovaConsulta={jest.fn()} />);
  await act(async () => {});
  // Caixa da foto na tela e tamanho real da imagem (paisagem, cortada pelo cover)
  fireEvent(t.getByTestId("foto-lupa"), "layout", { nativeEvent: { layout: { width: 300, height: 208 } } });
  fireEvent(t.getByTestId("foto-laudo"), "load", { nativeEvent: { source: { width: 1000, height: 750 } } });
  return t;
}

describe("lupa na foto", () => {
  it("escolhe ate 2 marcas pela ordem e ignora caixa >= 60% ou nula", () => {
    const marcas = marcasDaLupa([
      prob("grande", { x: 0, y: 0.15, largura: 1, altura: 0.85 }),
      prob("sem caixa", null),
      prob("pequena", { x: 0.2, y: 0.3, largura: 0.2, altura: 0.2 }),
      prob("outra", { x: 0.6, y: 0.1, largura: 0.3, altura: 0.3 }),
      prob("terceira", { x: 0.1, y: 0.1, largura: 0.1, altura: 0.1 }),
    ]);
    expect(marcas.map((m) => [m.indice, m.numero])).toEqual([[2, 1], [3, 2]]);
  });

  it("converte a caixa para a tela levando em conta o recorte do cover", () => {
    // Imagem 1000x500 numa caixa 300x200: escala 0,4, sobra 50 px de cada lado
    const r = caixaNaTela({ x: 0.5, y: 0.5, largura: 0.1, altura: 0.2 }, { largura: 300, altura: 200 }, { largura: 1000, altura: 500 });
    expect(r).toEqual({ left: 144, top: 94, width: 52, height: 52 });
    // Caixa toda na parte cortada: nao desenha
    expect(caixaNaTela({ x: 0, y: 0, largura: 0.02, altura: 0.5 }, { largura: 300, altura: 200 }, { largura: 1000, altura: 500 })).toBeNull();
  });

  it("desenha a marca numerada, a legenda e o numero no cartao com caixa pequena", async () => {
    const t = await tela(laudo({ problemas_detectados: [prob("Mancha", { x: 0.3, y: 0.3, largura: 0.2, altura: 0.2 })] }));
    expect(t.getByTestId("marca-lupa-1")).toBeTruthy();
    expect(t.getByText(/O círculo mostra onde o Doutor viu o problema/)).toBeTruthy();
    expect(t.getByTestId("numero-problema-1")).toBeTruthy();
    expect(t.getByTestId("etiqueta-marca-1")).toBeTruthy();
    const anel = () => [t.getByTestId("marca-lupa-1-anel").props.style].flat(Infinity).reduce((a: any, b: any) => ({ ...a, ...b }), {});
    expect(anel().borderWidth).toBe(4);
    expect(t.queryByTestId("escurecer-lupa")).toBeNull();
    // Tocar no numero do cartao destaca a marca (anel coral mais grosso e escurecimento em volta)
    fireEvent.press(t.getByTestId("numero-problema-1"));
    expect(anel().borderWidth).toBe(5);
    expect(t.getByTestId("escurecer-lupa")).toBeTruthy();
  });

  it("nao desenha nada com caixa da foto toda (oidio espalhado)", async () => {
    const t = await tela(laudo({ problemas_detectados: [prob("Oídio", { x: 0, y: 0.15, largura: 1, altura: 0.85 })] }));
    expect(t.queryByTestId("marca-lupa-1")).toBeNull();
    expect(t.queryByTestId("legenda-lupa")).toBeNull();
    expect(t.queryByTestId("numero-problema-1")).toBeNull();
  });
});

describe("foto de referencia e estacao", () => {
  it("some quando vem vazia", async () => {
    const t = await tela(laudo({ foto_referencia: "" }));
    expect(t.queryByTestId("foto-referencia")).toBeNull();
    expect(t.queryByTestId("nota-estacao")).toBeNull();
  });

  it("mostra a miniatura com credito e some se a imagem falhar", async () => {
    const t = await tela(laudo({ foto_referencia: WIKI }));
    expect(t.getByTestId("foto-referencia")).toBeTruthy();
    expect(t.getByText("Foto de referência")).toBeTruthy();
    expect(t.getAllByText("Foto: Wikipedia").length).toBeGreaterThan(0);
    fireEvent(t.getByTestId("foto-referencia-imagem"), "error");
    expect(t.queryByTestId("foto-referencia")).toBeNull();
  });

  it("alternativas ganham miniatura so quando ha URL", async () => {
    const t = await tela(
      laudo({
        identificacao: {
          nivel_confianca: "media",
          alternativas: [
            { nome_popular: "Abóbora", especie: "Cucurbita moschata", como_diferenciar: "Ramas longas.", foto_referencia: WIKI },
            { nome_popular: "Pepino", especie: "Cucumis sativus", como_diferenciar: "Folhas menores.", foto_referencia: "" },
          ],
        },
      }),
    );
    expect(t.getByTestId("foto-referencia-alt-0")).toBeTruthy();
    expect(t.queryByTestId("foto-referencia-alt-1")).toBeNull();
  });

  it("mostra a nota da estacao", async () => {
    const t = await tela(laudo({ nota_estacao: "Na primavera o oídio avança mais rápido." }));
    expect(t.getByTestId("nota-estacao")).toBeTruthy();
    expect(t.getByText(/Nesta estação:/)).toBeTruthy();
  });
});

describe("diagnosticarPlanta com varias fotos", () => {
  const fetchOriginal = global.fetch;
  const formDataOriginal = global.FormData;
  // FormData simples como o do React Native: guarda as partes na ordem
  class FormDataFalso {
    _parts: [string, any][] = [];
    append(k: string, v: any) {
      this._parts.push([k, v]);
    }
  }
  beforeEach(() => {
    global.FormData = FormDataFalso as any;
  });
  afterEach(() => {
    global.fetch = fetchOriginal;
    global.FormData = formDataOriginal;
  });

  function campos(body: any): string[] {
    return (body._parts as [string, unknown][]).map(([k]) => k);
  }

  it("envia file, file2 e file3", async () => {
    const fetchMock = jest.fn(async () => ({ ok: true, status: 200, json: async () => ({ eh_planta: true }) }));
    global.fetch = fetchMock as any;
    await diagnosticarPlanta(["file:///a.jpg", "file:///b.jpg", "file:///c.jpg"]);
    const body = (fetchMock.mock.calls[0] as any)[1].body;
    expect(campos(body)).toEqual(["file", "file2", "file3"]);
    expect(body._parts[1][1]).toMatchObject({ uri: "file:///b.jpg", type: "image/jpeg" });
  });

  it("com uma foto so manda file (e aceita string)", async () => {
    const fetchMock = jest.fn(async () => ({ ok: true, status: 200, json: async () => ({ eh_planta: true }) }));
    global.fetch = fetchMock as any;
    await diagnosticarPlanta("file:///a.jpg");
    expect(campos((fetchMock.mock.calls[0] as any)[1].body)).toEqual(["file"]);
  });
});

describe("tela Quer mandar mais fotos?", () => {
  function montar(fotos: string[]) {
    const fns = { onAdicionar: jest.fn(), onRemover: jest.fn(), onAnalisar: jest.fn(), onCancelar: jest.fn() };
    const t = render(<MaisFotosScreen fotos={fotos} {...fns} />);
    return { t, ...fns };
  }

  it("analisar com 1 foto e 1 toque", () => {
    const { t, onAnalisar } = montar(["file:///a.jpg"]);
    expect(t.getByText("Quer mandar mais fotos?")).toBeTruthy();
    expect(t.getByText(/Fotos de outros ângulos ajudam o Doutor/)).toBeTruthy();
    expect(t.getAllByText("Adicionar foto")).toHaveLength(2);
    fireEvent.press(t.getByTestId("analisar-agora"));
    expect(onAnalisar).toHaveBeenCalledTimes(1);
  });

  it("adicionar pergunta camera ou galeria", () => {
    const { t, onAdicionar } = montar(["file:///a.jpg"]);
    expect(t.queryByTestId("escolher-origem")).toBeNull();
    fireEvent.press(t.getByTestId("adicionar-foto-0"));
    fireEvent.press(t.getByTestId("origem-galeria"));
    expect(onAdicionar).toHaveBeenCalledWith("galeria");
    fireEvent.press(t.getByTestId("adicionar-foto-0"));
    fireEvent.press(t.getByTestId("origem-camera"));
    expect(onAdicionar).toHaveBeenLastCalledWith("camera");
  });

  it("com 3 fotos nao tem vaga e da para remover uma extra", () => {
    const { t, onRemover } = montar(["file:///a.jpg", "file:///b.jpg", "file:///c.jpg"]);
    expect(t.queryByText("Adicionar foto")).toBeNull();
    expect(t.getByText("3 fotos")).toBeTruthy();
    fireEvent.press(t.getByTestId("remover-foto-2"));
    expect(onRemover).toHaveBeenCalledWith(2);
  });
});

describe("foto ampliada", () => {
  it("zoom centraliza a area do problema e nao deixa a borda entrar", () => {
    const tela = { largura: 400, altura: 600 };
    const imagem = { largura: 1000, altura: 1000 }; // exibida 400x400
    // Area pequena no centro: aproxima ate o maximo, sem deslocar
    expect(zoomNaArea({ x: 0.45, y: 0.45, largura: 0.1, altura: 0.1 }, tela, imagem)).toEqual({ escala: 5, x: 0, y: 0 });
    // Area no canto: desloca, mas so ate a borda da foto
    const z = zoomNaArea({ x: 0, y: 0, largura: 0.2, altura: 0.2 }, tela, imagem);
    expect(z.escala).toBe(3);
    expect(z.x).toBe(400); // (400*3 - 400) / 2
    expect(z.y).toBe(300); // (400*3 - 600) / 2
    // Sem zoom, a foto menor que a tela fica centralizada
    expect(limitarZoom({ escala: 0.5, x: 80, y: -80 }, tela, { largura: 400, altura: 400 })).toEqual({ escala: 1, x: 0, y: 0 });
  });

  it("toque na foto abre em tela cheia com botao por problema, foto inteira e fechar", async () => {
    jest.spyOn(Image, "getSize").mockImplementation((_u: string, ok: any) => ok(1000, 750));
    const t = await tela(laudo({ problemas_detectados: [prob("Cochonilha", { x: 0.3, y: 0.3, largura: 0.2, altura: 0.2 })] }));
    expect(t.getByTestId("botao-ampliar")).toBeTruthy();
    expect(t.queryByTestId("foto-ampliada")).toBeNull();

    fireEvent.press(t.getByTestId("foto-lupa"));
    expect(t.getByTestId("foto-ampliada")).toBeTruthy();
    expect(within(t.getByTestId("ver-problema-1")).getByText("Cochonilha")).toBeTruthy();
    // Abre focada no problema 1
    expect(t.getByTestId("ver-problema-1").props.accessibilityState).toEqual({ selected: true });

    fireEvent.press(t.getByTestId("ver-foto-inteira"));
    expect(t.getByTestId("ver-foto-inteira").props.accessibilityState).toEqual({ selected: true });

    fireEvent.press(t.getByTestId("fechar-foto-ampliada"));
    expect(t.queryByTestId("foto-ampliada")).toBeNull();
  });
});
