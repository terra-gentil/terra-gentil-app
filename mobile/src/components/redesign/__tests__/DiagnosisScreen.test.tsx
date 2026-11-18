import React from "react";
import { Share } from "react-native";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import type { DiagnosticoResponse } from "../../../api/diagnostico";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockNotif = {
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
};
jest.mock("expo-notifications", () => ({
  getPermissionsAsync: (...a: unknown[]) => mockNotif.getPermissionsAsync(...a),
  requestPermissionsAsync: (...a: unknown[]) => mockNotif.requestPermissionsAsync(...a),
  setNotificationChannelAsync: (...a: unknown[]) => mockNotif.setNotificationChannelAsync(...a),
  scheduleNotificationAsync: (...a: unknown[]) => mockNotif.scheduleNotificationAsync(...a),
  cancelScheduledNotificationAsync: (...a: unknown[]) => mockNotif.cancelScheduledNotificationAsync(...a),
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: { DATE: "date" },
}));

const mockConsumirLembrarCanal = jest.fn();
jest.mock("../../../storage/preferencias", () => ({
  consumirLembrarCanal: () => mockConsumirLembrarCanal(),
}));

const mockGetToken = jest.fn();
jest.mock("../../../storage/auth", () => ({
  getToken: () => mockGetToken(),
}));

// Modais pesados viram marcadores simples
jest.mock("../EbookViewerModal", () => {
  const { Text, View } = require("react-native");
  return ({ visible, ebook }: { visible: boolean; ebook: { titulo: string; pdf: string } | null }) =>
    visible && ebook ? (
      <View testID="ebook-viewer-modal">
        <Text>{`leitor:${ebook.titulo}`}</Text>
        <Text>{`pdf:${ebook.pdf}`}</Text>
      </View>
    ) : null;
});
jest.mock("../NovaPostagemModal", () => {
  const { Text, View } = require("react-native");
  return ({ tituloInicial, imagemInicial }: { tituloInicial?: string; imagemInicial?: string }) => (
    <View testID="nova-postagem-modal">
      <Text>{`titulo:${tituloInicial}`}</Text>
      <Text>{`foto:${imagemInicial}`}</Text>
    </View>
  );
});
jest.mock("../LoginModal", () => {
  const { View } = require("react-native");
  return () => <View testID="login-modal" />;
});

import DiagnosisScreen from "../DiagnosisScreen";

const EXEMPLOS = "../../../../../docs/exemplos-relatorio-v2/";
const caso01: DiagnosticoResponse = require(EXEMPLOS + "01-jiboia-saudavel.jpg.json");
const caso04: DiagnosticoResponse = require(EXEMPLOS + "04-oidio-abobrinha.jpg.json");
const caso09: DiagnosticoResponse = require(EXEMPLOS + "09-lirio-paz-murcho.jpg.json");
const caso12: DiagnosticoResponse = require(EXEMPLOS + "12-nao-planta-gato.jpg.json");

// Relatorio v1 (Gemini reserva): so os 21 campos antigos, sem nada do v2
function comoV1(r: DiagnosticoResponse): DiagnosticoResponse {
  const v1: DiagnosticoResponse = {
    eh_planta: r.eh_planta,
    especie_identificada: r.especie_identificada,
    nome_popular: r.nome_popular,
    confianca: r.confianca,
    estado_saude: r.estado_saude,
    toxica_para_pets: true,
    toxicidade_detalhes: "Pode irritar a boca de cães e gatos.",
    nivel_luz: r.nivel_luz,
    rega_dias: r.rega_dias,
    rega_condicao: r.rega_condicao,
    temperatura_ideal: r.temperatura_ideal,
    nivel_dificuldade: r.nivel_dificuldade,
    luz_porcentagem: r.luz_porcentagem,
    luz_veredito: r.luz_veredito,
    diagnostico_titulo: r.diagnostico_titulo,
    diagnostico_explicacao: r.diagnostico_explicacao,
    problemas_detectados: r.problemas_detectados.map((p) => ({
      descricao: p.descricao,
      gravidade: p.gravidade,
      causa_provavel: p.causa_provavel,
    })),
    plano_tratamento: r.plano_tratamento,
    plano_timeline: r.plano_timeline.map((s) => ({ etapa: s.etapa, acao: s.acao })),
    precisa_retorno: true,
    mensagem_retorno: "Volte em 14 dias com uma nova foto.",
  };
  return v1;
}

function renderizar(resultado: DiagnosticoResponse, extra: Partial<React.ComponentProps<typeof DiagnosisScreen>> = {}) {
  const onNovaConsulta = jest.fn();
  const tela = render(
    <DiagnosisScreen
      imageUri="file:///foto.jpg"
      resultado={resultado}
      onVoltar={jest.fn()}
      onNovaConsulta={onNovaConsulta}
      {...extra}
    />,
  );
  return { tela, onNovaConsulta };
}

// Todo texto visivel da arvore, para conferir que nao ha porcentagem
function textos(tela: ReturnType<typeof render>): string {
  const partes: string[] = [];
  const andar = (n: unknown) => {
    if (n === null || n === undefined) return;
    if (typeof n === "string") {
      partes.push(n);
      return;
    }
    if (Array.isArray(n)) {
      n.forEach(andar);
      return;
    }
    const no = n as { children?: unknown };
    if (no.children) andar(no.children);
  };
  andar(tela.toJSON());
  return partes.join(" | ");
}

beforeEach(() => {
  jest.clearAllMocks();
  mockConsumirLembrarCanal.mockResolvedValue(false);
  mockGetToken.mockResolvedValue("token");
  mockNotif.getPermissionsAsync.mockResolvedValue({ status: "granted" });
  mockNotif.requestPermissionsAsync.mockResolvedValue({ status: "granted" });
  mockNotif.scheduleNotificationAsync.mockResolvedValue("notif-1");
});

describe("DiagnosisScreen v2 com os JSON reais", () => {
  it.each([
    ["01", caso01],
    ["04", caso04],
    ["09", caso09],
    ["12", caso12],
  ])("caso %s renderiza sem porcentagem de confianca", async (_nome, caso) => {
    const { tela } = renderizar(caso);
    await waitFor(() => expect(mockConsumirLembrarCanal).toHaveBeenCalledTimes(caso.eh_planta ? 1 : 0));
    expect(tela.getByTestId("diagnosis-screen")).toBeTruthy();
    expect(tela.getByTestId("aviso-ia")).toBeTruthy();
    expect(textos(tela)).not.toMatch(/\d\s*%/);
    expect(textos(tela)).not.toMatch(/certeza/i);
  });

  it("01 jiboia saudavel: veredito, destaque de toxicidade, O que o Doutor viu aberto e ebooks", async () => {
    const { tela } = renderizar(caso01);
    await waitFor(() => expect(mockConsumirLembrarCanal).toHaveBeenCalled());
    expect(tela.getByTestId("cartao-veredito")).toBeTruthy();
    expect(tela.getByText("Saudável")).toBeTruthy();
    expect(tela.getByTestId("toxicidade-destaque")).toBeTruthy();
    expect(tela.getByText("Tóxica para cães, gatos e crianças")).toBeTruthy();
    expect(tela.getByText("Luz")).toBeTruthy();
    expect(tela.getByTestId("leia-de-graca")).toBeTruthy();
    expect(tela.getByTestId("barra-fixa")).toBeTruthy();
    expect(tela.getByText("Me avise em 30 dias")).toBeTruthy();
  });

  it("04 abobrinha: quimico sempre recolhido, em bloco proprio, sem link", async () => {
    const { tela } = renderizar(caso04);
    await waitFor(() => expect(mockConsumirLembrarCanal).toHaveBeenCalled());
    expect(tela.getByTestId("plano-quimico")).toBeTruthy();
    expect(tela.queryByTestId("plano-quimico-aberto")).toBeNull();
    expect(tela.queryByText(/Enxofre ou bicarbonato de potássio$/)).toBeNull();
    // O passo quimico nao entra na lista caseira (3 passos, nao 4)
    expect(tela.queryByText("4")).toBeNull();
    fireEvent.press(tela.getByTestId("botao-quimico"));
    expect(tela.getByTestId("plano-quimico-aberto")).toBeTruthy();
    expect(tela.getByText("Princípio ativo")).toBeTruthy();
    expect(tela.getByText("Enxofre ou bicarbonato de potássio")).toBeTruthy();
    // Confianca media abre "Tambem pode ser" sozinho
    expect(tela.getByText("Cucurbita moschata")).toBeTruthy();
  });

  it("04 abobrinha: ofertas casam com materiais nao quimicos, no maximo 2, com o rotulo", async () => {
    const { tela } = renderizar(caso04);
    await waitFor(() => expect(mockConsumirLembrarCanal).toHaveBeenCalled());
    expect(tela.getByTestId("onde-encontrar")).toBeTruthy();
    expect(tela.getByText("Ofertas parceiras. O diagnóstico não depende delas.")).toBeTruthy();
    expect(tela.getByTestId("oferta-tesoura-poda")).toBeTruthy();
    expect(tela.getByTestId("oferta-regador-1l")).toBeTruthy();
    expect(tela.queryAllByTestId(/^oferta-/)).toHaveLength(2);
  });

  it("sem material que case, o bloco de ofertas some", async () => {
    const semCasamento: DiagnosticoResponse = {
      ...caso04,
      plano_timeline: caso04.plano_timeline.map((s) => ({ ...s, materiais: s.tipo === "quimico" ? ["Regador", "Vaso"] : ["Leite"] })),
    };
    const { tela } = renderizar(semCasamento);
    await waitFor(() => expect(mockConsumirLembrarCanal).toHaveBeenCalled());
    expect(tela.queryByTestId("onde-encontrar")).toBeNull();
  });

  it("09 lirio: aviso de foto aceitavel e toxicidade em destaque", async () => {
    const { tela } = renderizar(caso09);
    await waitFor(() => expect(mockConsumirLembrarCanal).toHaveBeenCalled());
    expect(tela.getByTestId("aviso-foto")).toBeTruthy();
    expect(tela.getByTestId("toxicidade-destaque")).toBeTruthy();
    expect(tela.queryByTestId("plano-quimico")).toBeNull();
  });

  it("12 nao e planta: estado proprio, sem barra fixa, botao de nova foto", async () => {
    const { tela, onNovaConsulta } = renderizar(caso12);
    // Foto sem planta nao gasta o lembrete do canal
    expect(mockConsumirLembrarCanal).not.toHaveBeenCalled();
    expect(tela.getByTestId("estado-nao-planta")).toBeTruthy();
    expect(tela.queryByTestId("barra-fixa")).toBeNull();
    expect(tela.queryByTestId("cartao-veredito")).toBeNull();
    expect(tela.getByText(/gatinho laranja/)).toBeTruthy();
    fireEvent.press(tela.getByTestId("botao-nova-foto-nao-planta"));
    expect(onNovaConsulta).toHaveBeenCalled();
  });
});

describe("DiagnosisScreen com relatorio v1", () => {
  it("renderiza escondendo os blocos v2", async () => {
    const { tela } = renderizar(comoV1(caso04));
    await waitFor(() => expect(mockConsumirLembrarCanal).toHaveBeenCalled());
    expect(tela.getByTestId("cartao-veredito")).toBeTruthy();
    expect(tela.getByTestId("barra-fixa")).toBeTruthy();
    expect(tela.getByText("Oídio forte nas folhas da abobrinha")).toBeTruthy();
    expect(tela.getByText("Volte em 14 dias com uma nova foto.")).toBeTruthy();
    expect(tela.queryByTestId("selo-confianca")).toBeNull();
    expect(tela.queryByTestId("tambem-pode-ser")).toBeNull();
    expect(tela.queryByTestId("leia-de-graca")).toBeNull();
    expect(tela.queryByTestId("plano-quimico")).toBeNull();
    expect(tela.queryByTestId("botao-me-avise")).toBeNull();
    expect(tela.queryByTestId("onde-encontrar")).toBeNull();
    expect(tela.getByTestId("toxicidade-destaque")).toBeTruthy();
    expect(textos(tela)).not.toMatch(/\d\s*%/);
  });
});

describe("DiagnosisScreen, interacoes", () => {
  it("cartao-lembrete-canal aparece quando consumirLembrarCanal devolve true", async () => {
    mockConsumirLembrarCanal.mockResolvedValue(true);
    const { tela } = renderizar(caso01);
    expect(await tela.findByTestId("cartao-lembrete-canal")).toBeTruthy();
  });

  it("cartao-lembrete-canal nao aparece quando consumirLembrarCanal devolve false", async () => {
    const { tela } = renderizar(caso01);
    await waitFor(() => expect(mockConsumirLembrarCanal).toHaveBeenCalled());
    expect(tela.queryByTestId("cartao-lembrete-canal")).toBeNull();
  });

  it("tocar no ebook abre o leitor direto, sem e-mail", async () => {
    const { tela } = renderizar(caso04);
    await waitFor(() => expect(mockConsumirLembrarCanal).toHaveBeenCalled());
    expect(tela.queryByTestId("ebook-viewer-modal")).toBeNull();
    fireEvent.press(tela.getByTestId("ebook-TG063"));
    expect(tela.getByTestId("ebook-viewer-modal")).toBeTruthy();
    expect(tela.getByText("leitor:Abóbora e Abobrinha")).toBeTruthy();
    expect(tela.getByText("pdf:https://terra-gentil-pdfs.canalterragentil.workers.dev/TG063.pdf")).toBeTruthy();
  });

  it("Me avise agenda a notificacao e mostra o combinado; desfazer cancela", async () => {
    const { tela } = renderizar(caso04);
    await act(async () => {
      fireEvent.press(tela.getByTestId("botao-me-avise"));
    });
    expect(mockNotif.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
    const pedido = mockNotif.scheduleNotificationAsync.mock.calls[0][0];
    const esperado = new Date();
    esperado.setDate(esperado.getDate() + 14);
    expect(new Date(pedido.trigger.date).getDate()).toBe(esperado.getDate());
    expect(tela.getByTestId("lembrete-combinado")).toBeTruthy();
    expect(tela.getByText(/^Combinado, aviso dia \d+ de /)).toBeTruthy();
    await act(async () => {
      fireEvent.press(tela.getByText("Desfazer"));
    });
    expect(mockNotif.cancelScheduledNotificationAsync).toHaveBeenCalledWith("notif-1");
    expect(tela.getByTestId("botao-me-avise")).toBeTruthy();
  });

  it("permissao negada mostra mensagem gentil e nao agenda", async () => {
    mockNotif.getPermissionsAsync.mockResolvedValue({ status: "undetermined" });
    mockNotif.requestPermissionsAsync.mockResolvedValue({ status: "denied" });
    const { tela } = renderizar(caso04);
    await act(async () => {
      fireEvent.press(tela.getByTestId("botao-me-avise"));
    });
    expect(mockNotif.scheduleNotificationAsync).not.toHaveBeenCalled();
    expect(tela.getByTestId("aviso-lembrete")).toBeTruthy();
    expect(tela.getByText(/Sem permissão de aviso, tudo bem/)).toBeTruthy();
  });

  it("sem retorno_em_dias o botao Me avise nao aparece", async () => {
    const semRetorno = { ...caso04, acompanhamento: { ...caso04.acompanhamento, retorno_em_dias: 0 } };
    const { tela } = renderizar(semRetorno);
    await waitFor(() => expect(mockConsumirLembrarCanal).toHaveBeenCalled());
    expect(tela.getByTestId("acompanhamento")).toBeTruthy();
    expect(tela.queryByTestId("botao-me-avise")).toBeNull();
  });

  it("Compartilhar manda o veredito, o selo gratis e o link da Play", async () => {
    const share = jest.spyOn(Share, "share").mockResolvedValue({ action: "sharedAction" } as never);
    const { tela } = renderizar(caso04);
    await act(async () => {
      fireEvent.press(tela.getByTestId("botao-compartilhar"));
    });
    const msg = share.mock.calls[0][0] as { message: string };
    expect(msg.message).toContain("Oídio forte nas folhas da abobrinha");
    expect(msg.message).toContain("Grátis, sem assinatura, em português");
    expect(msg.message).toContain("play.google.com/store/apps/details?id=br.com.terragentil.app");
    share.mockRestore();
  });

  it("Perguntar abre a nova postagem com foto e titulo preenchidos", async () => {
    const { tela } = renderizar(caso04);
    await act(async () => {
      fireEvent.press(tela.getByTestId("botao-perguntar-comunidade"));
    });
    expect(tela.getByTestId("nova-postagem-modal")).toBeTruthy();
    expect(tela.getByText("titulo:Abobrinha: Oídio forte nas folhas da abobrinha")).toBeTruthy();
    expect(tela.getByText("foto:file:///foto.jpg")).toBeTruthy();
  });

  it("Perguntar sem login abre o login antes", async () => {
    mockGetToken.mockResolvedValue(null);
    const { tela } = renderizar(caso04);
    await act(async () => {
      fireEvent.press(tela.getByTestId("botao-perguntar-comunidade"));
    });
    expect(tela.getByTestId("login-modal")).toBeTruthy();
    expect(tela.queryByTestId("nova-postagem-modal")).toBeNull();
  });

  it("onPerguntarComunidade, quando passada, substitui o fluxo interno", async () => {
    const onPerguntar = jest.fn();
    const { tela } = renderizar(caso04, { onPerguntarComunidade: onPerguntar });
    await act(async () => {
      fireEvent.press(tela.getByTestId("botao-perguntar-comunidade"));
    });
    expect(onPerguntar).toHaveBeenCalledWith(
      expect.objectContaining({ imageUri: "file:///foto.jpg", categoria: "Pragas e doenças" }),
    );
    expect(tela.queryByTestId("nova-postagem-modal")).toBeNull();
  });
});
