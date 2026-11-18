import React from "react";
import { AppState, Image, Linking, Platform, Share } from "react-native";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import * as Sharing from "expo-sharing";
import { captureRef } from "react-native-view-shot";
import { LightSensor } from "expo-sensors";
import type { DiagnosticoResponse } from "../../../api/diagnostico";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("../../../storage/preferencias", () => ({ consumirLembrarCanal: async () => false }));
jest.mock("../../../storage/auth", () => ({ getToken: async () => "token" }));
jest.mock("../EbookViewerModal", () => () => null);
jest.mock("../NovaPostagemModal", () => () => null);
jest.mock("../LoginModal", () => () => null);

import DiagnosisScreen from "../DiagnosisScreen";
import CartaoCompartilhar, { passosDoCartao } from "../resultado/CartaoCompartilhar";
import LembreteRega from "../resultado/LembreteRega";
import OQueODoutorViu from "../resultado/OQueODoutorViu";
import PlantasEmCuidado from "../PlantasEmCuidado";
import { faixaDoLux, comparaLuz, faixaDaPlanta } from "../resultado/derivar";
import { agendarRega, registrarLaudo } from "../../../storage/plantasEmCuidado";

const EXEMPLOS = "../../../../../docs/exemplos-relatorio-v2/";
const caso04: DiagnosticoResponse = require(EXEMPLOS + "04-oidio-abobrinha.jpg.json");
const caso01: DiagnosticoResponse = require(EXEMPLOS + "01-jiboia-saudavel.jpg.json");

const N = {
  get: Notifications.getPermissionsAsync as jest.Mock,
  req: Notifications.requestPermissionsAsync as jest.Mock,
  agendar: Notifications.scheduleNotificationAsync as jest.Mock,
  cancelar: Notifications.cancelScheduledNotificationAsync as jest.Mock,
};
const DIA = 86400000;

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  N.get.mockResolvedValue({ status: "granted", canAskAgain: true });
  N.req.mockResolvedValue({ status: "granted", canAskAgain: true });
  let n = 0;
  N.agendar.mockImplementation(async () => `id-${++n}`);
  (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(false);
  (LightSensor.isAvailableAsync as jest.Mock).mockResolvedValue(false);
});

afterEach(() => {
  jest.restoreAllMocks();
});

function tela(r: DiagnosticoResponse, extra: Partial<React.ComponentProps<typeof DiagnosisScreen>> = {}) {
  return render(<DiagnosisScreen imageUri="file:///agora.jpg" resultado={r} onVoltar={jest.fn()} onNovaConsulta={jest.fn()} {...extra} />);
}

describe("cartao de compartilhar", () => {
  it("renderiza foto, nome, estado, veredito, ate 3 passos, selo e link da Play", () => {
    const t = render(<CartaoCompartilhar imageUri="file:///foto.jpg" resultado={caso04} />);
    expect(t.getByTestId("cartao-compartilhar")).toBeTruthy();
    expect(t.getByText(caso04.nome_popular)).toBeTruthy();
    expect(t.getByText("Precisa de cuidado")).toBeTruthy();
    expect(t.getByText(caso04.diagnostico_titulo)).toBeTruthy();
    const passos = passosDoCartao(caso04);
    expect(passos.length).toBeGreaterThan(0);
    expect(passos.length).toBeLessThanOrEqual(3);
    passos.forEach((p) => expect(t.getByText(p)).toBeTruthy());
    expect(t.getByText("Grátis, sem assinatura, em português")).toBeTruthy();
    expect(t.getByText("Terra Gentil")).toBeTruthy();
    expect(t.getByText("play.google.com/store/apps/details?id=br.com.terragentil.app")).toBeTruthy();
  });

  it("Compartilhar captura o cartao e manda a imagem", async () => {
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    const share = jest.spyOn(Share, "share");
    const t = tela(caso04);
    await act(async () => {
      fireEvent.press(t.getByTestId("botao-compartilhar"));
    });
    const cartao = await t.findByTestId("cartao-compartilhar");
    // A foto carregou: libera a captura
    await act(async () => {
      fireEvent(cartao.findByType(Image), "loadEnd");
    });
    await waitFor(() => expect(Sharing.shareAsync).toHaveBeenCalledWith("file:///tmp/cartao-laudo.png", expect.objectContaining({ mimeType: "image/png" })));
    expect(captureRef).toHaveBeenCalled();
    expect(share).not.toHaveBeenCalled();
    await waitFor(() => expect(t.queryByTestId("cartao-compartilhar")).toBeNull());
  });

  it("se a captura falhar, cai no texto de sempre", async () => {
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    (captureRef as jest.Mock).mockRejectedValueOnce(new Error("falhou"));
    const share = jest.spyOn(Share, "share").mockResolvedValue({ action: "sharedAction" } as never);
    const t = tela(caso04);
    await act(async () => {
      fireEvent.press(t.getByTestId("botao-compartilhar"));
    });
    await act(async () => {
      fireEvent((await t.findByTestId("cartao-compartilhar")).findByType(Image), "loadEnd");
    });
    await waitFor(() => expect(share).toHaveBeenCalled());
    expect((share.mock.calls[0][0] as { message: string }).message).toContain("play.google.com");
  });
});

describe("antes e depois", () => {
  function gravarHistorico(itens: object[]) {
    return AsyncStorage.setItem("@terragentil:historico", JSON.stringify(itens));
  }
  const anterior = {
    id: "velha",
    timestamp: Date.now() - 20 * DIA,
    imageUri: "file:///docs/historico-fotos/velha.jpg",
    nome_popular: "Abobrinha",
    especie_identificada: caso04.especie_identificada,
    estado_saude: "critico",
    diagnostico_titulo: "",
  };

  it("aparece com foto anterior da mesma planta, com as duas fotos e os estados", async () => {
    await gravarHistorico([anterior]);
    const t = tela(caso04);
    expect(await t.findByTestId("antes-depois")).toBeTruthy();
    expect(t.getByText("Como estava e como está")).toBeTruthy();
    expect(t.getByLabelText("Foto antes").props.source.uri).toBe(anterior.imageUri);
    expect(t.getByLabelText("Foto agora").props.source.uri).toBe("file:///agora.jpg");
    expect(t.getByText("Cuidado urgente")).toBeTruthy();
    expect(t.getByText(/Melhorou desde a última foto/)).toBeTruthy();
  });

  it("nao aparece sem historico, com outra planta ou com foto de mais de 120 dias", async () => {
    await gravarHistorico([
      { ...anterior, especie_identificada: "Ficus lyrata", nome_popular: "Figueira" },
      { ...anterior, id: "muito-velha", timestamp: Date.now() - 130 * DIA },
    ]);
    const t = tela(caso04);
    await waitFor(() => expect(t.getByTestId("lembrete-rega")).toBeTruthy());
    expect(t.queryByTestId("antes-depois")).toBeNull();
  });
});

describe("permissao de aviso conduzida passo a passo", () => {
  const planta = { chave: "cucurbita pepo", nome_popular: "Abobrinha", estado_saude: "doente" as const, consultaId: "c1" };

  it("permitido: agenda direto e mostra o combinado; cancelar desmarca", async () => {
    const t = render(<LembreteRega planta={planta} regaDias={3} regaMl={250} />);
    await act(async () => {
      fireEvent.press(t.getByTestId("botao-lembrar-regar"));
    });
    expect(t.queryByTestId("folha-permissao-explicar")).toBeNull();
    expect(N.agendar).toHaveBeenCalled();
    expect(N.agendar.mock.calls[0][0].content.body).toContain("250 ml");
    expect(t.getByText(/^Pronto! Vou te lembrar de regar a cada 3 dias, às 9h/)).toBeTruthy();
    await act(async () => {
      fireEvent.press(t.getByTestId("botao-cancelar-rega"));
    });
    expect(N.cancelar).toHaveBeenCalledWith("id-1");
    expect(t.getByTestId("botao-lembrar-regar")).toBeTruthy();
  });

  it("negado podendo perguntar de novo: folha explica, sistema nega, nada agendado", async () => {
    N.get.mockResolvedValue({ status: "undetermined", canAskAgain: true });
    N.req.mockResolvedValue({ status: "denied", canAskAgain: true });
    const t = render(<LembreteRega planta={planta} regaDias={3} />);
    await act(async () => {
      fireEvent.press(t.getByTestId("botao-lembrar-regar"));
    });
    expect(t.getByTestId("folha-permissao-explicar")).toBeTruthy();
    expect(t.getByText(/o celular vai perguntar se pode mandar notificações/)).toBeTruthy();
    expect(N.req).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.press(t.getByTestId("botao-permissao-continuar"));
    });
    expect(N.req).toHaveBeenCalledTimes(1);
    expect(N.agendar).not.toHaveBeenCalled();
    expect(t.getByTestId("aviso-rega")).toBeTruthy();
    expect(t.queryByTestId("folha-permissao-configuracoes")).toBeNull();
  });

  it("negado definitivo: passos numerados, abre configuracoes e agenda sozinho ao voltar liberado", async () => {
    let aoMudar: ((s: string) => void) | null = null;
    jest.spyOn(AppState, "addEventListener").mockImplementation(((_: string, fn: (s: string) => void) => {
      aoMudar = fn;
      return { remove: jest.fn() };
    }) as never);
    const abrir = jest.spyOn(Linking, "openSettings").mockResolvedValue(undefined);
    N.get.mockResolvedValue({ status: "undetermined", canAskAgain: true });
    N.req.mockResolvedValue({ status: "denied", canAskAgain: false });
    const t = render(<LembreteRega planta={planta} regaDias={3} />);
    await act(async () => {
      fireEvent.press(t.getByTestId("botao-lembrar-regar"));
    });
    await act(async () => {
      fireEvent.press(t.getByTestId("botao-permissao-continuar"));
    });
    expect(t.getByTestId("folha-permissao-configuracoes")).toBeTruthy();
    expect(t.getByText("Toque em Notificações.")).toBeTruthy();
    expect(t.getByText("Ligue a chave Permitir notificações.")).toBeTruthy();
    fireEvent.press(t.getByTestId("botao-abrir-configuracoes"));
    expect(abrir).toHaveBeenCalled();
    // Voltou para o app com a chave ligada
    N.get.mockResolvedValue({ status: "granted", canAskAgain: true });
    await act(async () => {
      aoMudar?.("active");
    });
    await waitFor(() => expect(N.agendar).toHaveBeenCalled());
    expect(t.queryByTestId("folha-permissao-configuracoes")).toBeNull();
    expect(t.getByTestId("rega-combinada")).toBeTruthy();
  });

  it("ja bloqueado antes: vai direto para os passos das configuracoes; Agora nao fecha", async () => {
    N.get.mockResolvedValue({ status: "denied", canAskAgain: false });
    const t = render(<LembreteRega planta={planta} regaDias={3} />);
    await act(async () => {
      fireEvent.press(t.getByTestId("botao-lembrar-regar"));
    });
    expect(t.getByTestId("folha-permissao-configuracoes")).toBeTruthy();
    expect(N.req).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.press(t.getByTestId("botao-permissao-agora-nao"));
    });
    expect(t.queryByTestId("folha-permissao-configuracoes")).toBeNull();
    expect(N.agendar).not.toHaveBeenCalled();
  });

  it("Me avise em N dias volta marcado ao reabrir o laudo", async () => {
    const t1 = tela(caso04);
    await act(async () => {
      fireEvent.press(t1.getByTestId("botao-me-avise"));
    });
    expect(t1.getByTestId("lembrete-combinado")).toBeTruthy();
    t1.unmount();
    const t2 = tela(caso04);
    expect(await t2.findByTestId("lembrete-combinado")).toBeTruthy();
    expect(t2.queryByTestId("botao-me-avise")).toBeNull();
  });
});

describe("plantas em cuidado na Home", () => {
  it("lista a planta doente com Ver laudo e Tirar foto de retorno", async () => {
    await registrarLaudo(caso04, {
      id: "c1",
      timestamp: Date.now(),
      imageUri: "file:///docs/historico-fotos/c1.jpg",
      nome_popular: caso04.nome_popular,
      especie_identificada: caso04.especie_identificada,
      estado_saude: caso04.estado_saude,
      diagnostico_titulo: caso04.diagnostico_titulo,
    });
    const onVerLaudo = jest.fn();
    const onFotoRetorno = jest.fn();
    const t = render(<PlantasEmCuidado gatilho={1} onVerLaudo={onVerLaudo} onFotoRetorno={onFotoRetorno} />);
    expect(await t.findByTestId("plantas-em-cuidado")).toBeTruthy();
    expect(t.getByText(caso04.nome_popular)).toBeTruthy();
    expect(t.getByText(/^Rever dia \d{2}\/\d{2}$/)).toBeTruthy();
    fireEvent.press(t.getByTestId("botao-ver-laudo"));
    expect(onVerLaudo).toHaveBeenCalledWith("c1");
    fireEvent.press(t.getByTestId("botao-foto-retorno"));
    expect(onFotoRetorno).toHaveBeenCalled();
  });

  it("mostra a proxima rega de planta saudavel com lembrete; vazio nao renderiza", async () => {
    const vazio = render(<PlantasEmCuidado gatilho={1} onVerLaudo={jest.fn()} onFotoRetorno={jest.fn()} />);
    await act(async () => {});
    expect(vazio.queryByTestId("plantas-em-cuidado")).toBeNull();
    vazio.unmount();

    await agendarRega({ chave: "epipremnum aureum", nome_popular: "Jiboia", estado_saude: "saudavel" }, 7);
    const t = render(<PlantasEmCuidado gatilho={2} onVerLaudo={jest.fn()} onFotoRetorno={jest.fn()} />);
    expect(await t.findByText(/^Próxima rega \d{2}\/\d{2}$/)).toBeTruthy();
    expect(t.queryByTestId("botao-ver-laudo")).toBeNull();
  });
});

describe("medidor de luz", () => {
  const props = { leitura: caso01.leitura_foto || [], luzOnde: 50, luzPrecisa: 55, luzVeredito: "ok", abertoInicial: true, nivelLuz: "indireta_brilhante" };

  it("sem sensor (ou fora do Android) o botao nao aparece", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    const t = render(<OQueODoutorViu {...props} />);
    await act(async () => {});
    expect(LightSensor.isAvailableAsync).toHaveBeenCalled();
    expect(t.queryByTestId("botao-medir-luz")).toBeNull();
  });

  it("no iOS nem consulta o sensor", async () => {
    jest.replaceProperty(Platform, "OS", "ios");
    (LightSensor.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    const t = render(<OQueODoutorViu {...props} />);
    await act(async () => {});
    expect(t.queryByTestId("botao-medir-luz")).toBeNull();
  });

  it("com sensor: mede alguns segundos e compara com o que a planta precisa", async () => {
    jest.useFakeTimers();
    try {
      jest.replaceProperty(Platform, "OS", "android");
      (LightSensor.isAvailableAsync as jest.Mock).mockResolvedValue(true);
      let emitir: ((d: { illuminance: number }) => void) | null = null;
      (LightSensor.addListener as jest.Mock).mockImplementation((fn) => {
        emitir = fn;
        return { remove: jest.fn() };
      });
      const t = render(<OQueODoutorViu {...props} />);
      await act(async () => {});
      fireEvent.press(t.getByTestId("botao-medir-luz"));
      expect(t.getByTestId("folha-medidor-luz")).toBeTruthy();
      act(() => {
        emitir?.({ illuminance: 300 });
        emitir?.({ illuminance: 320 });
      });
      act(() => {
        jest.advanceTimersByTime(4100);
      });
      expect(t.getByTestId("resultado-luz")).toBeTruthy();
      expect(t.getByText("Aqui: Sombra")).toBeTruthy();
      expect(t.getByText(/mais escuro do que ela gosta/)).toBeTruthy();
    } finally {
      jest.useRealTimers();
    }
  });

  it("faixas de lux e comparacao", () => {
    expect([faixaDoLux(100), faixaDoLux(2000), faixaDoLux(12000), faixaDoLux(50000)]).toEqual([0, 1, 2, 3]);
    expect(faixaDaPlanta("sol_pleno")).toBe(3);
    expect(faixaDaPlanta("nao_aplicavel")).toBeNull();
    expect(comparaLuz(1, 1)).toMatch(/combina/);
    expect(comparaLuz(3, 1)).toMatch(/mais luz/);
  });
});
