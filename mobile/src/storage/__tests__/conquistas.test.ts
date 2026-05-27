import { calcularHistoricoStats } from "../conquistas";
import { ConsultaHistorico } from "../historico";

function mkEntry(overrides: Partial<ConsultaHistorico> = {}): ConsultaHistorico {
  return {
    id: "test",
    timestamp: new Date(2026, 0, 10, 12, 0, 0).getTime(),
    imageUri: "",
    nome_popular: "Samambaia",
    especie_identificada: "Nephrolepis exaltata",
    estado_saude: "saudavel",
    diagnostico_titulo: "Saudavel",
    ...overrides,
  };
}

describe("calcularHistoricoStats", () => {
  it("historico vazio retorna zeros e false", () => {
    const s = calcularHistoricoStats([]);
    expect(s.total).toBe(0);
    expect(s.especiesUnicas).toBe(0);
    expect(s.diasUnicos).toBe(0);
    expect(s.diasConsecutivos).toBe(0);
    expect(s.criticalDiag).toBe(0);
    expect(s.noturnoDiag).toBe(0);
    expect(s.allHealthStates).toBe(false);
  });

  it("1 consulta retorna total=1, diasUnicos=1, especiesUnicas=1", () => {
    const s = calcularHistoricoStats([mkEntry()]);
    expect(s.total).toBe(1);
    expect(s.diasUnicos).toBe(1);
    expect(s.especiesUnicas).toBe(1);
  });

  it("3 consultas no mesmo dia contam como diasUnicos=1", () => {
    const base = new Date(2026, 0, 10, 12, 0, 0).getTime();
    const entries = [
      mkEntry({ timestamp: base }),
      mkEntry({ timestamp: base + 1000 }),
      mkEntry({ timestamp: base + 2000 }),
    ];
    const s = calcularHistoricoStats(entries);
    expect(s.diasUnicos).toBe(1);
    expect(s.total).toBe(3);
  });

  it("mesma especie em dias diferentes nao duplica especiesUnicas", () => {
    const entries = [
      mkEntry({ timestamp: new Date(2026, 0, 10, 12, 0, 0).getTime() }),
      mkEntry({ timestamp: new Date(2026, 0, 11, 12, 0, 0).getTime() }),
    ];
    const s = calcularHistoricoStats(entries);
    expect(s.especiesUnicas).toBe(1);
    expect(s.diasUnicos).toBe(2);
  });

  it("7 dias consecutivos retorna diasConsecutivos=7", () => {
    const entries = Array.from({ length: 7 }, (_, i) =>
      mkEntry({ timestamp: new Date(2026, 0, 10 + i, 12, 0, 0).getTime() })
    );
    const s = calcularHistoricoStats(entries);
    expect(s.diasConsecutivos).toBe(7);
  });

  it("dias com gap nao contam como consecutivos", () => {
    const entries = [
      mkEntry({ timestamp: new Date(2026, 0, 10, 12, 0, 0).getTime() }),
      mkEntry({ timestamp: new Date(2026, 0, 11, 12, 0, 0).getTime() }),
      // gap no dia 12
      mkEntry({ timestamp: new Date(2026, 0, 13, 12, 0, 0).getTime() }),
    ];
    const s = calcularHistoricoStats(entries);
    expect(s.diasConsecutivos).toBe(2);
  });

  it("consulta as 23h conta como noturnoDiag", () => {
    const s = calcularHistoricoStats([
      mkEntry({ timestamp: new Date(2026, 0, 10, 23, 0, 0).getTime() }),
    ]);
    expect(s.noturnoDiag).toBe(1);
  });

  it("consulta as 4h conta como noturnoDiag", () => {
    const s = calcularHistoricoStats([
      mkEntry({ timestamp: new Date(2026, 0, 10, 4, 0, 0).getTime() }),
    ]);
    expect(s.noturnoDiag).toBe(1);
  });

  it("consulta as 12h nao conta como noturnoDiag", () => {
    const s = calcularHistoricoStats([
      mkEntry({ timestamp: new Date(2026, 0, 10, 12, 0, 0).getTime() }),
    ]);
    expect(s.noturnoDiag).toBe(0);
  });

  it("allHealthStates true somente quando todos 4 estados presentes", () => {
    const entries = [
      mkEntry({ estado_saude: "saudavel" }),
      mkEntry({ estado_saude: "atencao" }),
      mkEntry({ estado_saude: "doente" }),
      mkEntry({ estado_saude: "critico" }),
    ];
    expect(calcularHistoricoStats(entries).allHealthStates).toBe(true);
    expect(calcularHistoricoStats(entries.slice(0, 3)).allHealthStates).toBe(false);
  });

  it("criticalDiag conta doente e critico mas nao saudavel", () => {
    const entries = [
      mkEntry({ estado_saude: "doente" }),
      mkEntry({ estado_saude: "critico" }),
      mkEntry({ estado_saude: "saudavel" }),
    ];
    expect(calcularHistoricoStats(entries).criticalDiag).toBe(2);
  });
});
