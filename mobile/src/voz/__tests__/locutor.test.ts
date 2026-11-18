import { Locutor, Tocador } from "../locutor";
import type { FalaId } from "../falas";

function montar() {
  const tocadas: FalaId[] = [];
  let terminar: (() => void) | null = null;
  const tocador: Tocador = {
    preparar: jest.fn(),
    tocar: jest.fn((fala: FalaId, fim: () => void) => {
      tocadas.push(fala);
      terminar = fim;
    }),
    volume: jest.fn(),
    parar: jest.fn(),
  };
  const locutor = new Locutor(tocador, () => Date.now());
  return { locutor, tocador, tocadas, fim: () => terminar?.() };
}

describe("Locutor", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("toca uma fala por vez, com 1 s de silencio entre elas", () => {
    const { locutor, tocadas, fim } = montar();
    locutor.agendar([
      { fala: "espera_inicio_a", em: 500 },
      { fala: "espera_folhas_a", em: 600 },
    ]);
    jest.advanceTimersByTime(600);
    expect(tocadas).toEqual(["espera_inicio_a"]);
    jest.advanceTimersByTime(3000);
    fim();
    jest.advanceTimersByTime(900);
    expect(tocadas).toEqual(["espera_inicio_a"]);
    jest.advanceTimersByTime(200);
    expect(tocadas).toEqual(["espera_inicio_a", "espera_folhas_a"]);
  });

  it("chamada do canal passa na frente e fala de exame atrasada cai", () => {
    const { locutor, tocadas, fim } = montar();
    locutor.agendar([
      { fala: "espera_inicio_c", em: 0 },
      { fala: "espera_pragas_a", em: 100, toleranciaMs: 4000 },
      { fala: "espera_botao", em: 200, prioridade: "alta" },
    ]);
    jest.advanceTimersByTime(300);
    fim();
    jest.advanceTimersByTime(1000);
    expect(tocadas).toEqual(["espera_inicio_c", "espera_botao"]);
    jest.advanceTimersByTime(5000);
    fim();
    jest.advanceTimersByTime(2000);
    expect(tocadas).toEqual(["espera_inicio_c", "espera_botao"]);
  });

  it("cancelar com fade abaixa o volume e para em 0,5 s", () => {
    const { locutor, tocador } = montar();
    const eventos: string[] = [];
    locutor.ouvir((ev) => eventos.push(`${ev.tipo}:${ev.item.fala}`));
    locutor.agendar([{ fala: "espera_inicio_a", em: 0 }, { fala: "demora_a", em: 60000 }]);
    jest.advanceTimersByTime(10);
    locutor.cancelar(true);
    expect(tocador.parar).not.toHaveBeenCalled();
    jest.advanceTimersByTime(500);
    expect(tocador.parar).toHaveBeenCalledTimes(1);
    expect(tocador.volume).toHaveBeenLastCalledWith(0);
    jest.advanceTimersByTime(70000);
    expect(eventos).toEqual(["inicio:espera_inicio_a", "fim:espera_inicio_a"]);
  });

  it("alto-falante desligado nao toca e descarta o que chega", () => {
    const { locutor, tocadas } = montar();
    locutor.setLigado(false);
    locutor.agendar([{ fala: "espera_inicio_a", em: 0 }]);
    jest.advanceTimersByTime(100);
    locutor.setLigado(true);
    jest.advanceTimersByTime(2000);
    expect(tocadas).toEqual([]);
  });

  it("segundo plano corta a fala na hora", () => {
    const { locutor, tocador } = montar();
    locutor.sequencia([{ fala: "laudo_saudavel_a" }]);
    jest.advanceTimersByTime(1);
    locutor.setPrimeiroPlano(false);
    expect(tocador.parar).toHaveBeenCalledTimes(1);
    expect(locutor.falando).toBe(false);
  });

  it("dispensa o convite que ainda nao tocou", () => {
    const { locutor, tocadas, fim } = montar();
    locutor.sequencia([{ fala: "laudo_saudavel_a" }, { fala: "convite_a", convite: true }]);
    jest.advanceTimersByTime(1);
    locutor.dispensar((i) => !!i.convite);
    fim();
    jest.advanceTimersByTime(3000);
    expect(tocadas).toEqual(["laudo_saudavel_a"]);
  });

  it("lembrar_ok so toca se nada estiver no ar", () => {
    const { locutor, tocadas, fim } = montar();
    locutor.sequencia([{ fala: "espera_canal_c" }]);
    jest.advanceTimersByTime(1);
    locutor.tocarSeLivre("lembrar_ok");
    fim();
    jest.advanceTimersByTime(3000);
    expect(tocadas).toEqual(["espera_canal_c"]);
  });
});
