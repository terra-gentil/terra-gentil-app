import React from "react";
import { Image } from "react-native";
import { act, fireEvent, render } from "@testing-library/react-native";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));
jest.mock("react-native-webview", () => {
  const { View } = require("react-native");
  return { WebView: (props: any) => <View testID="webview-pdf" {...props} /> };
});
jest.mock("expo-file-system/legacy", () => ({ cacheDirectory: "file:///cache/", downloadAsync: jest.fn() }));
jest.mock("expo-sharing", () => ({ isAvailableAsync: jest.fn(), shareAsync: jest.fn() }));

import EbooksScreen from "../EbooksScreen";
import { capaOtimizada, larguraDaMiniatura } from "../../../data/ebooks";

type Tela = ReturnType<typeof render>;

function imagensRemotas(tela: Tela) {
  return tela.UNSAFE_getAllByType(Image).filter((img) => {
    const uri = img.props.source && typeof img.props.source === "object" ? img.props.source.uri : undefined;
    return typeof uri === "string" && uri.startsWith("http");
  });
}

const capas = (tela: Tela): string[] => imagensRemotas(tela).map((img) => img.props.source.uri);
const cards = (tela: Tela) => tela.queryAllByLabelText(/^Abrir guia /);

// Referencia medida antes da otimizacao (ScrollView com 7 FlatLists):
// Colecao montava 21 capas (7 prateleiras x 3) e Classicos montava as 8 capas de uma vez,
// todas em tamanho cheio (520x924, media de 67 KB na Colecao e 200 KB nos Classicos).
describe("EbooksScreen, custo da primeira renderizacao", () => {
  it("Colecao monta so as 2 primeiras prateleiras, com 4 cartoes cada", () => {
    const tela = render(<EbooksScreen visible onClose={jest.fn()} />);
    expect(cards(tela)).toHaveLength(8);
    expect(capas(tela)).toHaveLength(8);
    expect(tela.queryByText("Orquídeas")).toBeTruthy();
    expect(tela.queryByText("Roseiras")).toBeNull();
    expect(tela.queryByText("Cuidados do dia a dia")).toBeNull();
  });

  it("as capas pedem a miniatura do site, nao a imagem cheia", () => {
    const tela = render(<EbooksScreen visible onClose={jest.fn()} />);
    for (const uri of capas(tela)) {
      expect(uri).toMatch(/^https:\/\/terragentil\.com\.br\/_next\/image\?url=%2Fguias%2F.+%2Fcapa\.webp&w=(128|256|384)&q=75$/);
    }
  });

  it("Classicos monta so as 2 primeiras prateleiras, com o destaque do ebook 1", () => {
    const tela = render(<EbooksScreen visible onClose={jest.fn()} />);
    fireEvent.press(tela.getByText(/Clássicos/));
    expect(tela.getByText("+ POPULAR")).toBeTruthy();
    expect(tela.getByText("O Código Secreto das Plantas")).toBeTruthy();
    // 1 capa do destaque + 3 cartoes (ebook 2, 5 e 7)
    expect(cards(tela)).toHaveLength(3);
    expect(capas(tela)).toHaveLength(4);
    expect(tela.queryByText("Jardim que cabe no bolso")).toBeNull();
  });

  it("nao renderiza nada com o modal fechado", () => {
    const tela = render(<EbooksScreen visible={false} onClose={jest.fn()} />);
    expect(tela.UNSAFE_queryAllByType(Image)).toHaveLength(0);
  });

  it("o leitor de PDF so e montado quando um guia e aberto", () => {
    const tela = render(<EbooksScreen visible onClose={jest.fn()} />);
    expect(tela.queryAllByTestId("webview-pdf")).toHaveLength(0);
    expect(tela.queryByText("Baixar PDF grátis")).toBeNull();
    fireEvent.press(cards(tela)[0]);
    expect(tela.queryAllByTestId("webview-pdf")).toHaveLength(1);
    expect(tela.getByText("Baixar PDF grátis")).toBeTruthy();
  });

  it("abrir um guia nao troca as imagens ja montadas", () => {
    const tela = render(<EbooksScreen visible onClose={jest.fn()} />);
    const antes = imagensRemotas(tela).map((img) => img.props.source);
    fireEvent.press(cards(tela)[1]);
    const depois = imagensRemotas(tela).map((img) => img.props.source);
    expect(depois).toHaveLength(antes.length);
    depois.forEach((source, i) => expect(source).toBe(antes[i]));
  });

  it("se a miniatura falhar, usa a capa original", () => {
    const tela = render(<EbooksScreen visible onClose={jest.fn()} />);
    fireEvent(imagensRemotas(tela)[0], "error", { nativeEvent: { error: "400" } });
    expect(capas(tela)[0]).toBe("https://terragentil.com.br/guias/orquidea-florir-de-novo/capa.webp");
  });
});

describe("EbooksScreen, abas e chips", () => {
  it("mostra as duas abas e um chip por prateleira", () => {
    const tela = render(<EbooksScreen visible onClose={jest.fn()} />);
    expect(tela.getByText(/Coleção \(105\)/)).toBeTruthy();
    expect(tela.getByText(/Clássicos \(8\)/)).toBeTruthy();
    expect(tela.getByText("113 GUIAS · DE GRAÇA")).toBeTruthy();
    expect(tela.getAllByLabelText(/^Ir para /)).toHaveLength(7);
    fireEvent.press(tela.getByText(/Clássicos \(8\)/));
    expect(tela.getAllByLabelText(/^Ir para /)).toHaveLength(4);
  });

  it("tocar no chip de uma prateleira ainda nao montada nao quebra", () => {
    jest.useFakeTimers();
    try {
      const tela = render(<EbooksScreen visible onClose={jest.fn()} />);
      fireEvent.press(tela.getByLabelText(/^Ir para Cuidados do dia a dia/));
      act(() => {
        jest.runAllTimers();
      });
      expect(tela.getByText(/Coleção \(105\)/)).toBeTruthy();
      tela.unmount();
    } finally {
      jest.useRealTimers();
    }
  });
});

describe("miniaturas das capas", () => {
  it("escolhe a menor largura aceita pelo site que cobre a tela", () => {
    expect(larguraDaMiniatura(110)).toBe(128);
    expect(larguraDaMiniatura(220)).toBe(256);
    expect(larguraDaMiniatura(289)).toBe(256);
    expect(larguraDaMiniatura(330)).toBe(384);
    expect(larguraDaMiniatura(600)).toBe(384);
  });

  it("so reescreve capas hospedadas no site", () => {
    expect(capaOtimizada("https://terragentil.com.br/guias/anturio/capa.webp", 220)).toBe(
      "https://terragentil.com.br/_next/image?url=%2Fguias%2Fanturio%2Fcapa.webp&w=256&q=75",
    );
    expect(capaOtimizada("https://outro.site/capa.webp", 220)).toBe("https://outro.site/capa.webp");
  });
});
