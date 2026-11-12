import { TODOS_EBOOKS, CATEGORIAS_EBOOK, categoriaDoEbook, NUMEROS_NA_COLECAO } from "../ebooks";
import { COLECAO, TEMAS_COLECAO } from "../colecao";

describe("dados dos ebooks", () => {
  it("classicos nao repetem id nem numero", () => {
    expect(new Set(TODOS_EBOOKS.map((e) => e.id)).size).toBe(TODOS_EBOOKS.length);
    expect(new Set(TODOS_EBOOKS.map((e) => e.numero)).size).toBe(TODOS_EBOOKS.length);
  });

  it("todo classico cai numa categoria existente", () => {
    const ids = new Set(CATEGORIAS_EBOOK.map((c) => c.id));
    for (const e of TODOS_EBOOKS) expect(ids.has(categoriaDoEbook(e))).toBe(true);
  });

  it("a colecao nao repete codigo, slug nem pdf e usa temas existentes", () => {
    expect(new Set(COLECAO.map((l) => l.codigo)).size).toBe(COLECAO.length);
    expect(new Set(COLECAO.map((l) => l.slug)).size).toBe(COLECAO.length);
    expect(new Set(COLECAO.map((l) => l.pdf)).size).toBe(COLECAO.length);
    const temas = new Set(TEMAS_COLECAO.map((t) => t.id));
    for (const l of COLECAO) expect(temas.has(l.tema)).toBe(true);
  });

  it("os classicos escondidos existem de fato", () => {
    const numeros = new Set(TODOS_EBOOKS.map((e) => e.numero));
    for (const n of NUMEROS_NA_COLECAO) expect(numeros.has(n)).toBe(true);
  });
});
