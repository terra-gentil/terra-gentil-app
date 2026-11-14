import React from "react";
import { AccessibilityInfo } from "react-native";
import { act, fireEvent, render } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

jest.mock("expo-linear-gradient", () => {
  const { View } = require("react-native");
  return { LinearGradient: (props: any) => <View {...props} /> };
});

import {
  BARRA_OUTPUT,
  DEMORA_MS,
  DICAS,
  DICA_INTERVALO_MS,
  ETAPAS,
  INICIO_ETAPAS_MS,
  LoadingScreen,
} from "../LoadingScreen";

const METRICAS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 40, left: 0, right: 0, bottom: 20 },
};

function montar(props: { imageUri?: string | null } = {}) {
  return render(
    <SafeAreaProvider initialMetrics={METRICAS}>
      <LoadingScreen {...props} />
    </SafeAreaProvider>,
  );
}

// Resolve a promessa de isReduceMotionEnabled dentro do act.
async function esperarAcessibilidade() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe("LoadingScreen", () => {
  let reduzirSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    reduzirSpy = jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(false);
  });

  afterEach(() => {
    reduzirSpy.mockRestore();
    jest.useRealTimers();
  });

  it("renderiza titulo, foto da planta, primeira etapa e primeira dica", async () => {
    const tela = montar({ imageUri: "file:///planta.jpg" });
    await esperarAcessibilidade();
    expect(tela.getByText("Analisando a sua planta")).toBeTruthy();
    expect(tela.getByLabelText("Foto da sua planta")).toBeTruthy();
    expect(tela.getByTestId("etapa-atual").props.children.join("")).toBe(`${ETAPAS[0].texto}...`);
    expect(tela.getByText(DICAS[0])).toBeTruthy();
    expect(tela.getByTestId("laser")).toBeTruthy();
    const raiz = tela.getByTestId("loading-diagnostico");
    expect(raiz.props.accessibilityRole).toBe("progressbar");
    expect(raiz.props.accessibilityState).toEqual({ busy: true });
    expect(tela.getByTestId("etapa-atual").props.accessibilityLiveRegion).toBe("polite");
  });

  it("sem foto mostra o Doutor analisando", async () => {
    const tela = montar();
    await esperarAcessibilidade();
    expect(tela.getByLabelText("Doutor Gentileza analisando")).toBeTruthy();
  });

  it("etapas avancam com o tempo e marcam as anteriores como concluidas", async () => {
    const tela = montar();
    await esperarAcessibilidade();
    act(() => { jest.advanceTimersByTime(INICIO_ETAPAS_MS[1] + 10); });
    expect(tela.getByTestId("etapa-atual").props.children.join("")).toBe(`${ETAPAS[1].texto}...`);
    expect(tela.getByLabelText(`${ETAPAS[0].texto}, concluído`)).toBeTruthy();
    expect(tela.getByLabelText(`${ETAPAS[1].texto}, em andamento`)).toBeTruthy();

    act(() => { jest.advanceTimersByTime(INICIO_ETAPAS_MS[4]); });
    const ultima = ETAPAS.length - 1;
    expect(tela.getByTestId("etapa-atual").props.children.join("")).toBe(`${ETAPAS[ultima].texto}...`);

    // A ultima etapa fica ativa ate a resposta chegar.
    act(() => { jest.advanceTimersByTime(60000); });
    expect(tela.getByLabelText(`${ETAPAS[ultima].texto}, em andamento`)).toBeTruthy();
  });

  it("dicas trocam a cada intervalo", async () => {
    const tela = montar();
    await esperarAcessibilidade();
    act(() => { jest.advanceTimersByTime(DICA_INTERVALO_MS + 10); });
    expect(tela.getByText(DICAS[1])).toBeTruthy();
    expect(tela.queryByText(DICAS[0])).toBeNull();
  });

  it("mostra a mensagem de demora so depois de 45 segundos", async () => {
    const tela = montar();
    await esperarAcessibilidade();
    const aviso = /demorando um pouquinho mais que o normal/;
    act(() => { jest.advanceTimersByTime(DEMORA_MS - 1000); });
    expect(tela.queryByText(aviso)).toBeNull();
    act(() => { jest.advanceTimersByTime(1500); });
    expect(tela.getByText(aviso)).toBeTruthy();
    expect(tela.getByText("Ainda cuidando da sua planta com carinho.")).toBeTruthy();
  });

  it("nao deixa timer pendurado ao desmontar", async () => {
    const tela = montar({ imageUri: "file:///planta.jpg" });
    await esperarAcessibilidade();
    act(() => { jest.advanceTimersByTime(12000); });
    // Com a tela montada ha etapas, dica e aviso de demora agendados.
    expect(jest.getTimerCount()).toBeGreaterThan(0);
    tela.unmount();
    act(() => { jest.advanceTimersByTime(120000); });
    expect(jest.getTimerCount()).toBe(0);
  });

  it("com reduzir movimento desliga as animacoes decorativas e mantem o conteudo", async () => {
    reduzirSpy.mockResolvedValue(true);
    const tela = montar({ imageUri: "file:///planta.jpg" });
    await esperarAcessibilidade();
    expect(tela.queryByTestId("laser")).toBeNull();
    expect(tela.getByText(DICAS[0])).toBeTruthy();
    act(() => { jest.advanceTimersByTime(INICIO_ETAPAS_MS[2] + 10); });
    expect(tela.getByTestId("etapa-atual").props.children.join("")).toBe(`${ETAPAS[2].texto}...`);
    tela.unmount();
    act(() => { jest.advanceTimersByTime(60000); });
    expect(jest.getTimerCount()).toBe(0);
  });
});

describe("LoadingScreen, barra de progresso", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(false);
  });
  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it("so desenha o preenchimento depois de medir o trilho", async () => {
    const tela = montar();
    await esperarAcessibilidade();
    expect(tela.queryByTestId("barra-preenchimento")).toBeNull();
    fireEvent(tela.getByTestId("barra-trilho"), "layout", {
      nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 16 } },
    });
    expect(tela.getByTestId("barra-preenchimento")).toBeTruthy();
    expect(tela.getByTestId("barra-brilho")).toBeTruthy();
  });

  it("curva sempre crescente, rapida no comeco e abaixo de 100%", () => {
    for (let i = 1; i < BARRA_OUTPUT.length; i++) {
      expect(BARRA_OUTPUT[i]).toBeGreaterThan(BARRA_OUTPUT[i - 1]);
    }
    expect(BARRA_OUTPUT[0]).toBe(0);
    expect(Math.max(...BARRA_OUTPUT)).toBeLessThan(0.96);
  });
});
