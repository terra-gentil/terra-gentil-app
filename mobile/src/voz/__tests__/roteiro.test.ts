import type { DiagnosticoResponse } from "../../api/diagnostico";
import { ErrorCode } from "../../errors/AppError";
import { FALAS } from "../falas";
import { escolherFalasLaudo, falaDeErro, GRUPOS, planoEspera, proximaTrilha, situacaoDoLaudo, Sorteio } from "../roteiro";

const base = {
  eh_planta: true,
  estado_saude: "saudavel",
  problemas_detectados: [],
  toxica_para_pets: false,
  foto: { qualidade: "boa" },
} as unknown as DiagnosticoResponse;

const com = (extra: object) => ({ ...base, ...extra }) as unknown as DiagnosticoResponse;
const falas = (r: DiagnosticoResponse, primeira = false, fotoMarcadaVezes = 0) =>
  escolherFalasLaudo(r, { primeira, fotoMarcadaVezes }, new Sorteio({}, () => 0)).itens.map((i) => i.fala);

describe("roteiro da voz", () => {
  it("todo id do roteiro tem arquivo", () => {
    Object.values(GRUPOS).flat().forEach((f) => expect(FALAS).toHaveProperty(f));
    (["primeira", "A", "B", "C"] as const).forEach((t) =>
      planoEspera(t, new Sorteio()).forEach((i) => expect(FALAS).toHaveProperty(i.fala)),
    );
  });

  it("toda trilha tem chamada do canal antes dos 25 s", () => {
    (["primeira", "A", "B", "C"] as const).forEach((t) => {
      const chamada = planoEspera(t, new Sorteio()).find((i) => i.cartao === "canal");
      expect(chamada?.em).toBeLessThan(25000);
      expect(chamada?.prioridade).toBe("alta");
    });
  });

  it("trilhas revezam A, B, C", () => {
    expect([null, "A", "B", "C"].map(proximaTrilha)).toEqual(["A", "B", "C", "A"]);
  });

  it("sorteio nunca repete a ultima variacao", () => {
    const s = new Sorteio({ convite: "convite_a" }, () => 0);
    expect(s.de("convite")).toBe("convite_b");
    expect(s.de("convite")).toBe("convite_a");
  });

  it("planta saudavel: fala, convite; primeira consulta usa convite_a", () => {
    expect(falas(base, true)).toEqual(["laudo_saudavel_a", "convite_a"]);
  });

  it("com problema e foto marcada nas tres primeiras vezes", () => {
    const r = com({
      estado_saude: "doente",
      problemas_detectados: [{ descricao: "x", area_foto: { x: 0.1, y: 0.1, largura: 0.2, altura: 0.2 } }],
    });
    expect(falas(r)).toEqual(["laudo_problema_a", "laudo_foto_marcada", "convite_cuidado_a"]);
    expect(falas(r, false, 3)).toEqual(["laudo_problema_a", "convite_cuidado_a"]);
  });

  it("caso serio tem pausa de 1,5 s antes do convite", () => {
    const { itens } = escolherFalasLaudo(com({ estado_saude: "critico" }), { primeira: false, fotoMarcadaVezes: 9 }, new Sorteio());
    expect(itens[0].fala).toBe("laudo_serio");
    expect(itens[itens.length - 1]).toMatchObject({ convite: true, pausaAntesMs: 1500 });
  });

  it("toxica tem prioridade e fecha com convite_curto", () => {
    const r = com({ toxicidade: { nivel: "grave", afeta: ["caes"] } });
    expect(falas(r)).toEqual(["laudo_saudavel_a", "laudo_toxica_a", "convite_curto"]);
  });

  it("nao planta e foto ruim: so orientacao, sem convite", () => {
    expect(falas(com({ eh_planta: false }))).toEqual(["nao_planta_a"]);
    expect(falas(com({ foto: { qualidade: "ruim" } }))).toEqual(["foto_ruim_a"]);
    expect(situacaoDoLaudo(com({ estado_saude: "nao_aplicavel" }))).toBe("geral");
  });

  it("erros: conexao, tempo limite e foto", () => {
    const s = new Sorteio({}, () => 0);
    expect(falaDeErro(ErrorCode.NETWORK_OFFLINE, s)?.fala).toBe("erro_conexao_a");
    expect(falaDeErro(ErrorCode.NETWORK_TIMEOUT, s)?.fala).toBe("erro_geral");
    expect(falaDeErro(ErrorCode.IMAGE_INVALID, s)?.fala).toBe("foto_ruim_a");
    expect(falaDeErro(ErrorCode.PERMISSION_DENIED, s)).toBeNull();
  });
});
