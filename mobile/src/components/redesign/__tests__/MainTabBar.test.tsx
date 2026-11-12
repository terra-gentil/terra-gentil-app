import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

import MainTabBar from "../MainTabBar";

const ROTAS = ["HomeTab", "CommunityTab", "EbooksTab", "VideosTab", "ProfileTab"];

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

  it("mostra as 5 abas na ordem, com Ebooks logo depois da Camera", () => {
    const { tela } = montar();
    const rotulos = tela.getAllByRole("tab").map((aba) => aba.props.accessibilityLabel);
    expect(rotulos).toEqual([
      "Início, aba 1 de 5",
      "Comunidade, aba 2 de 5",
      "Ebooks, aba 3 de 5",
      "Vídeos, aba 4 de 5",
      "Eu, aba 5 de 5",
    ]);
    for (const texto of ["Início", "Comunidade", "Ebooks", "Vídeos", "Eu"]) {
      expect(tela.getByText(texto)).toBeTruthy();
    }
  });

  it("os rotulos ficam em uma linha so e encolhem em vez de cortar", () => {
    const { tela } = montar();
    for (const texto of ["Início", "Comunidade", "Ebooks", "Vídeos", "Eu"]) {
      const rotulo = tela.getByText(texto);
      expect(rotulo.props.numberOfLines).toBe(1);
      expect(rotulo.props.adjustsFontSizeToFit).toBe(true);
    }
  });

  it("so a aba ativa fica marcada como selecionada", () => {
    const { tela } = montar("EbooksTab");
    const selecionadas = tela
      .getAllByRole("tab")
      .filter((aba) => aba.props.accessibilityState?.selected)
      .map((aba) => aba.props.accessibilityLabel);
    expect(selecionadas).toEqual(["Ebooks, aba 3 de 5"]);
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
});
