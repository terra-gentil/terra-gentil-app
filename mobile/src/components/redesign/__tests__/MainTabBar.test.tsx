import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

import MainTabBar, { ABAS_DIREITA, ABAS_ESQUERDA, larguraDoLado, reservaCentral } from "../MainTabBar";

const ROTAS = ["HomeTab", "CommunityTab", "PromosTab", "EbooksTab", "VideosTab", "ProfileTab"];
const ROTULOS = ["Início", "Comunidade", "Promoções", "Ebooks", "Vídeos", "Eu"];

function montar(rotaAtiva = "HomeTab") {
  const navigate = jest.fn();
  const onFabPress = jest.fn();
  const state: any = {
    index: ROTAS.indexOf(rotaAtiva),
    routes: ROTAS.map((name) => ({ key: name, name })),
  };
  const tela = render(<MainTabBar state={state} navigation={{ navigate } as any} onFabPress={onFabPress} />);
  return { tela, navigate, onFabPress };
}

describe("MainTabBar", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("mostra as 6 abas na ordem, com Promoções ao lado da Comunidade", () => {
    const { tela } = montar();
    const rotulos = tela.getAllByRole("tab").map((aba) => aba.props.accessibilityLabel);
    expect(rotulos).toEqual([
      "Início, aba 1 de 6",
      "Comunidade, aba 2 de 6",
      "Promoções, aba 3 de 6",
      "Ebooks, aba 4 de 6",
      "Vídeos, aba 5 de 6",
      "Eu, aba 6 de 6",
    ]);
    for (const texto of ROTULOS) {
      expect(tela.getByText(texto)).toBeTruthy();
    }
  });

  it("fica com 3 abas de cada lado da Camera", () => {
    expect(ABAS_ESQUERDA.map((a) => a.rota)).toEqual(["HomeTab", "CommunityTab", "PromosTab"]);
    expect(ABAS_DIREITA.map((a) => a.rota)).toEqual(["EbooksTab", "VideosTab", "ProfileTab"]);
  });

  it("os rotulos ficam em uma linha so e encolhem em vez de cortar", () => {
    const { tela } = montar();
    for (const texto of ROTULOS) {
      const rotulo = tela.getByText(texto);
      expect(rotulo.props.numberOfLines).toBe(1);
      expect(rotulo.props.adjustsFontSizeToFit).toBe(true);
    }
  });

  it("so a aba ativa fica marcada como selecionada", () => {
    const { tela } = montar("PromosTab");
    const selecionadas = tela
      .getAllByRole("tab")
      .filter((aba) => aba.props.accessibilityState?.selected)
      .map((aba) => aba.props.accessibilityLabel);
    expect(selecionadas).toEqual(["Promoções, aba 3 de 6"]);
  });

  it("tocar em Promoções navega pra aba de promoções", () => {
    const { tela, navigate } = montar();
    fireEvent.press(tela.getByLabelText(/^Promoções/));
    expect(navigate).toHaveBeenCalledWith("PromosTab");
  });

  it("tocar em Ebooks navega pra aba de ebooks", () => {
    const { tela, navigate } = montar();
    fireEvent.press(tela.getByLabelText(/^Ebooks/));
    expect(navigate).toHaveBeenCalledWith("EbooksTab");
  });

  it("a Camera central continua abrindo a foto, sem navegar", () => {
    const { tela, navigate, onFabPress } = montar();
    fireEvent.press(tela.getByLabelText("Tirar foto da planta"));
    expect(onFabPress).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();
  });

  it("a reserva da Camera encolhe em tela estreita e os dois lados somam a largura toda", () => {
    expect(reservaCentral(320)).toBe(48);
    expect(reservaCentral(360)).toBe(48);
    expect(reservaCentral(412)).toBe(56);
    expect(reservaCentral(480)).toBe(72);
    for (const largura of [320, 360, 412, 480]) {
      expect(2 * larguraDoLado(largura) + reservaCentral(largura) + 4).toBe(largura);
    }
  });

  it("na direita toda aba tem pelo menos 44 dp de largura ja em 320 dp", () => {
    const pesoTotal = ABAS_DIREITA.reduce((soma, a) => soma + a.peso, 0);
    for (const aba of ABAS_DIREITA) {
      expect((larguraDoLado(320) * aba.peso) / pesoTotal).toBeGreaterThanOrEqual(44);
    }
  });
});
