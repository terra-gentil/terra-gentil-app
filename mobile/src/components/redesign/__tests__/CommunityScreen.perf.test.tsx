import React from "react";
import { TouchableOpacity } from "react-native";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Simula a troca de aba: o teste dispara o foco na mao com focar().
let callbackDeFoco: (() => void | (() => void)) | null = null;
jest.mock("@react-navigation/native", () => {
  const React = require("react");
  return {
    useNavigation: () => ({ navigate: jest.fn() }),
    useFocusEffect: (cb: () => void | (() => void)) => {
      callbackDeFoco = cb;
      React.useEffect(() => cb(), [cb]);
    },
  };
});
jest.mock("expo-file-system/legacy", () => ({ cacheDirectory: "file:///cache/", writeAsStringAsync: jest.fn() }));
jest.mock("expo-sharing", () => ({ shareAsync: jest.fn() }));
jest.mock("expo-clipboard", () => ({ setStringAsync: jest.fn() }));
jest.mock("../NovaPostagemModal", () => ({ __esModule: true, default: () => null }));
jest.mock("../ComentariosModal", () => ({ __esModule: true, default: () => null }));
jest.mock("../NotificacoesModal", () => ({ __esModule: true, default: () => null }));
jest.mock("../LoginModal", () => ({ __esModule: true, default: () => null }));

const mockRenderPostCard = jest.fn();
jest.mock("../PostCard", () => {
  const { Text } = require("react-native");
  return {
    __esModule: true,
    default: (props: any) => {
      mockRenderPostCard(props.post.id);
      return <Text onPress={() => props.onLikedChange?.(!props.liked)}>{`${props.post.title}${props.liked ? " [curtido]" : ""}`}</Text>;
    },
  };
});

const mockListarTopics = jest.fn();
jest.mock("../../../api/forum", () => ({
  listarTopics: (...args: any[]) => mockListarTopics(...args),
  deletarTopic: jest.fn(),
  reportarConteudo: jest.fn(),
}));

import CommunityScreen from "../CommunityScreen";

function topic(i: number) {
  return {
    id: `t${i}`,
    title: `Post ${i}`,
    body: `Texto do post ${i}`,
    category: "Meu jardim",
    site: "terra-gentil",
    user_id: `u-${i}`,
    display_name: `Autor ${i}`,
    avatar_url: null,
    is_admin: false,
    pinned: false,
    created_at: "2026-11-01T10:00:00Z",
    last_post_at: null,
    reply_count: i,
    reactions: { mata: 0, tava_la: 0, curtir: i },
    my_reactions: [],
  };
}

const pagina = (n: number) => ({
  items: Array.from({ length: n }, (_, i) => topic(i + 1)),
  total: n,
  page: 1,
  per_page: 8,
  site: "terra-gentil",
});

async function montar() {
  const tela = render(<CommunityScreen />);
  await waitFor(() => expect(tela.getByText("Post 1")).toBeTruthy());
  // deixa as leituras de storage do foco assentarem
  await act(async () => { await Promise.resolve(); });
  return tela;
}

// Referencia medida antes da otimizacao, com 8 posts na tela (este mesmo teste no codigo antigo:
// 24 renders de PostCard em 3 teclas, 8 renders em 1 curtida, 3 leituras de storage, 2 requisicoes em 2 focos):
// cada tecla na busca, cada curtida e cada modal aberto re-renderizava os 8 PostCards;
// a contagem de comentarios locais lia a mesma chave do AsyncStorage 3 vezes (1 por post);
// e cada volta pra aba refazia a requisicao da lista e zerava a paginacao.
describe("CommunityScreen, re-renders e chamadas", () => {
  beforeEach(async () => {
    mockRenderPostCard.mockClear();
    mockListarTopics.mockReset();
    mockListarTopics.mockResolvedValue(pagina(8));
    callbackDeFoco = null;
    await AsyncStorage.clear();
    (AsyncStorage.getItem as jest.Mock).mockClear();
  });

  it("digitar na busca nao re-renderiza os posts que continuam na lista", async () => {
    const tela = await montar();
    fireEvent.press(tela.getByText("Buscar plantas, dicas..."));
    const campo = tela.getByPlaceholderText("Buscar posts, autores, tags...");
    mockRenderPostCard.mockClear();
    fireEvent.changeText(campo, "P");
    fireEvent.changeText(campo, "Po");
    fireEvent.changeText(campo, "Pos");
    expect(mockRenderPostCard).toHaveBeenCalledTimes(0);
    expect(tela.getByText("Post 4")).toBeTruthy();
  });

  it("abrir as notificacoes nao re-renderiza nenhum post", async () => {
    const tela = await montar();
    mockRenderPostCard.mockClear();
    const sino = tela.UNSAFE_getAllByType(TouchableOpacity).find(
      (n) => n.props.style && n.props.style.width === 42 && n.props.style.height === 42,
    );
    expect(sino).toBeTruthy();
    fireEvent.press(sino!);
    expect(mockRenderPostCard).toHaveBeenCalledTimes(0);
  });

  it("curtir re-renderiza so o post curtido", async () => {
    const tela = await montar();
    mockRenderPostCard.mockClear();
    await act(async () => { fireEvent.press(tela.getByText("Post 3")); });
    expect(tela.getByText("Post 3 [curtido]")).toBeTruthy();
    expect(mockRenderPostCard.mock.calls.map((c) => c[0])).toEqual(["t3"]);
  });

  it("conta os comentarios locais com 1 leitura do storage, nao 1 por post", async () => {
    await montar();
    const leituras = (AsyncStorage.getItem as jest.Mock).mock.calls.filter(
      (c) => c[0] === "@terragentil:comunidade_comentarios",
    );
    expect(leituras).toHaveLength(1);
  });

  it("voltar pra aba em menos de 30 s reaproveita a lista, depois disso busca de novo", async () => {
    const agora = jest.spyOn(Date, "now");
    const t0 = 1_800_000_000_000;
    agora.mockReturnValue(t0);
    await montar();
    expect(mockListarTopics).toHaveBeenCalledTimes(1);

    agora.mockReturnValue(t0 + 10_000);
    await act(async () => { callbackDeFoco?.(); });
    expect(mockListarTopics).toHaveBeenCalledTimes(1);

    agora.mockReturnValue(t0 + 31_000);
    await act(async () => { callbackDeFoco?.(); });
    expect(mockListarTopics).toHaveBeenCalledTimes(2);
    agora.mockRestore();
  });
});
