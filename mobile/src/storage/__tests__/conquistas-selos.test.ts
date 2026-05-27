import { SELOS, ConquistaStats } from "../conquistas";

const statsZero: ConquistaStats = {
  total: 0,
  especiesUnicas: 0,
  diasUnicos: 0,
  diasConsecutivos: 0,
  criticalDiag: 0,
  allHealthStates: false,
  noturnoDiag: 0,
  totalPosts: 0,
  totalRespostas: 0,
  totalReacoesEnviadas: 0,
};

describe("SELOS", () => {
  it("e um array nao vazio com campos obrigatorios", () => {
    expect(Array.isArray(SELOS)).toBe(true);
    expect(SELOS.length).toBeGreaterThan(0);
    SELOS.forEach((s) => {
      expect(s).toHaveProperty("id");
      expect(s).toHaveProperty("nome");
      expect(s).toHaveProperty("emoji");
      expect(s).toHaveProperty("check");
      expect(typeof s.check).toBe("function");
    });
  });

  it("stats zerados: nenhum selo desbloqueado", () => {
    SELOS.forEach((selo) => {
      expect(selo.check(statsZero)).toBe(false);
    });
  });

  it("total=1 desbloqueia primeira_foto", () => {
    const stats = { ...statsZero, total: 1 };
    const selo = SELOS.find((s) => s.id === "primeira_foto");
    expect(selo?.check(stats)).toBe(true);
  });

  it("total=9 nao desbloqueia dedicado (precisa 10)", () => {
    const stats = { ...statsZero, total: 9 };
    const selo = SELOS.find((s) => s.id === "dedicado");
    expect(selo?.check(stats)).toBe(false);
  });

  it("total=10 desbloqueia dedicado", () => {
    const stats = { ...statsZero, total: 10 };
    const selo = SELOS.find((s) => s.id === "dedicado");
    expect(selo?.check(stats)).toBe(true);
  });

  it("especiesUnicas=9 nao desbloqueia mao_verde (precisa 10)", () => {
    const stats = { ...statsZero, especiesUnicas: 9 };
    const selo = SELOS.find((s) => s.id === "mao_verde");
    expect(selo?.check(stats)).toBe(false);
  });

  it("especiesUnicas=10 desbloqueia mao_verde", () => {
    const stats = { ...statsZero, especiesUnicas: 10 };
    const selo = SELOS.find((s) => s.id === "mao_verde");
    expect(selo?.check(stats)).toBe(true);
  });

  it("diasUnicos=6 nao desbloqueia 7_dias", () => {
    const stats = { ...statsZero, diasUnicos: 6 };
    const selo = SELOS.find((s) => s.id === "7_dias");
    expect(selo?.check(stats)).toBe(false);
  });

  it("diasUnicos=7 desbloqueia 7_dias", () => {
    const stats = { ...statsZero, diasUnicos: 7 };
    const selo = SELOS.find((s) => s.id === "7_dias");
    expect(selo?.check(stats)).toBe(true);
  });

  it("diasConsecutivos=4 nao desbloqueia sequencia (precisa 5)", () => {
    const stats = { ...statsZero, diasConsecutivos: 4 };
    const selo = SELOS.find((s) => s.id === "sequencia");
    expect(selo?.check(stats)).toBe(false);
  });

  it("diasConsecutivos=5 desbloqueia sequencia", () => {
    const stats = { ...statsZero, diasConsecutivos: 5 };
    const selo = SELOS.find((s) => s.id === "sequencia");
    expect(selo?.check(stats)).toBe(true);
  });

  it("criticalDiag=1 desbloqueia socorrista", () => {
    const stats = { ...statsZero, criticalDiag: 1 };
    const selo = SELOS.find((s) => s.id === "socorrista");
    expect(selo?.check(stats)).toBe(true);
  });

  it("allHealthStates=true desbloqueia conhecedor", () => {
    const stats = { ...statsZero, allHealthStates: true };
    const selo = SELOS.find((s) => s.id === "conhecedor");
    expect(selo?.check(stats)).toBe(true);
  });

  it("noturnoDiag=1 desbloqueia plantao", () => {
    const stats = { ...statsZero, noturnoDiag: 1 };
    const selo = SELOS.find((s) => s.id === "plantao");
    expect(selo?.check(stats)).toBe(true);
  });

  it("totalPosts=1 desbloqueia voz_ativa", () => {
    const stats = { ...statsZero, totalPosts: 1 };
    const selo = SELOS.find((s) => s.id === "voz_ativa");
    expect(selo?.check(stats)).toBe(true);
  });

  it("totalRespostas=4 nao desbloqueia solidario (precisa 5)", () => {
    const stats = { ...statsZero, totalRespostas: 4 };
    const selo = SELOS.find((s) => s.id === "solidario");
    expect(selo?.check(stats)).toBe(false);
  });

  it("totalRespostas=5 desbloqueia solidario", () => {
    const stats = { ...statsZero, totalRespostas: 5 };
    const selo = SELOS.find((s) => s.id === "solidario");
    expect(selo?.check(stats)).toBe(true);
  });

  it("totalReacoesEnviadas=20 desbloqueia popular", () => {
    const stats = { ...statsZero, totalReacoesEnviadas: 20 };
    const selo = SELOS.find((s) => s.id === "popular");
    expect(selo?.check(stats)).toBe(true);
  });
});
