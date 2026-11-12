import React, { Profiler } from "react";
import { act, render } from "@testing-library/react-native";

jest.mock("expo-linear-gradient", () => {
  const { View } = require("react-native");
  return { LinearGradient: (props: any) => <View {...props} /> };
});

import DoctorScanner from "../DoctorScanner";

function montar(props: { pausado?: boolean } = {}) {
  let commits = 0;
  const tela = render(
    <Profiler id="scanner" onRender={() => { commits += 1; }}>
      <DoctorScanner {...props} />
    </Profiler>,
  );
  return { tela, commits: () => commits };
}

// Referencia medida antes da otimizacao (loop requestAnimationFrame + setState a 30 fps):
// 229 commits do React por ciclo de 11 s neste mesmo teste (um act por quadro de 16 ms), na thread JS,
// pra sempre, mesmo com a Home fora de foco. No aparelho eram cerca de 30 por segundo.
describe("DoctorScanner, custo da animacao", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("um ciclo inteiro de 11 s gera no maximo 8 commits do React", () => {
    const { commits } = montar();
    const inicial = commits();
    // Um act por quadro: dentro de um unico act o React junta tudo num commit so.
    for (let ms = 0; ms < 11000; ms += 16) act(() => { jest.advanceTimersByTime(16); });
    const doCiclo = commits() - inicial;
    expect(doCiclo).toBeGreaterThanOrEqual(5);
    expect(doCiclo).toBeLessThanOrEqual(8);
  });

  it("troca o rotulo do HUD nas fronteiras das fases", () => {
    const { tela } = montar();
    expect(tela.getByText("CÂMERA INICIANDO")).toBeTruthy();
    act(() => { jest.advanceTimersByTime(1700); });
    expect(tela.getByText("ESCANEANDO PLANTA")).toBeTruthy();
    act(() => { jest.advanceTimersByTime(2000); });
    expect(tela.getByText("IA ANALISANDO")).toBeTruthy();
    expect(tela.getByText("Analisando padrões na folha")).toBeTruthy();
    act(() => { jest.advanceTimersByTime(1600); });
    expect(tela.getByText("DIAGNÓSTICO PRONTO")).toBeTruthy();
    expect(tela.getByText("Tomateiro")).toBeTruthy();
    act(() => { jest.advanceTimersByTime(2200); });
    expect(tela.getByText("PLANO DE AÇÃO")).toBeTruthy();
    act(() => { jest.advanceTimersByTime(2000); });
    expect(tela.getByText("EBOOK ENVIADO")).toBeTruthy();
  });

  it("no ciclo seguinte mostra o proximo exemplo", () => {
    const { tela } = montar();
    act(() => { jest.advanceTimersByTime(11000 + 5400); });
    expect(tela.getByText("Pothos")).toBeTruthy();
  });

  it("pausado nao agenda nada e nao re-renderiza", () => {
    const { commits } = montar({ pausado: true });
    const inicial = commits();
    act(() => { jest.advanceTimersByTime(22000); });
    expect(commits() - inicial).toBe(0);
    expect(jest.getTimerCount()).toBe(0);
  });

  it("ao desmontar nao deixa timer pendurado", () => {
    const { tela } = montar();
    act(() => { jest.advanceTimersByTime(3000); });
    tela.unmount();
    // Sobram so timers avulsos do proprio Animated; o ciclo nao pode se reagendar.
    act(() => { jest.advanceTimersByTime(22000); });
    expect(jest.getTimerCount()).toBe(0);
  });
});
