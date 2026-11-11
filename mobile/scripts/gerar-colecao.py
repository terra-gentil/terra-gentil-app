import json, re, glob, os, sys

SITE = r"C:\Gitlab_hz\terra-gentil-site\terra-gentil"
OUT = r"C:\Gitlab_hz\app-terragentil\mobile\src\data\colecao.ts"

temas_src = open(os.path.join(SITE, "lib", "temas.ts"), encoding="utf8").read()
bloco = temas_src[temas_src.index("export const TEMAS"):temas_src.index("const RESERVA")]
temas = []
for m in re.finditer(r"id: '([^']+)',\s*nome: '([^']+)',\s*chamada: '([^']+)',\s*codigos: \[([^\]]*)\]", bloco):
    cods = re.findall(r"'(TG\d+)'", m.group(4))
    temas.append((m.group(1), m.group(2), m.group(3), cods))

tema_de = {}
for tid, _, _, cods in temas:
    for c in cods:
        tema_de[c] = tid
reserva = temas[-1][0]

livros = []
for f in glob.glob(os.path.join(SITE, "data", "guias", "*.json")):
    d = json.load(open(f, encoding="utf8"))
    livros.append({
        "codigo": d["codigo"],
        "slug": d["slug"],
        "titulo": d["titulo"],
        "pdf": d["meta"]["pdf"],
        "tema": tema_de.get(d["codigo"], reserva),
    })
livros.sort(key=lambda l: l["codigo"])

visual = {
    "orquideas": ("🌸", "#C75B9B"),
    "suculentas": ("🌵", "#3FA77A"),
    "rosas": ("🌹", "#D8552B"),
    "horta": ("🥬", "#4A8C4F"),
    "dentro-de-casa": ("🪴", "#E8A33D"),
    "jardim": ("🏡", "#2F7FA5"),
    "cuidados": ("💧", "#9B7BC8"),
}

def js(s):
    return json.dumps(s, ensure_ascii=False)

linhas = []
linhas.append("// GERADO a partir do site (terra-gentil/data/guias e lib/temas.ts). Nao editar na mao:")
linhas.append("// rodar de novo o gerador quando o site ganhar livros novos.")
linhas.append("")
linhas.append("export interface TemaColecao {")
linhas.append("  id: string;")
linhas.append("  nome: string;")
linhas.append("  emoji: string;")
linhas.append("  chamada: string;")
linhas.append("  cor: string;")
linhas.append("}")
linhas.append("")
linhas.append("export interface LivroColecao {")
linhas.append("  codigo: string;")
linhas.append("  slug: string;")
linhas.append("  titulo: string;")
linhas.append("  pdf: string;")
linhas.append("  tema: string;")
linhas.append("}")
linhas.append("")
linhas.append('export const COLECAO_PDF_BASE = "https://terra-gentil-pdfs.canalterragentil.workers.dev";')
linhas.append('export const COLECAO_SITE_BASE = "https://terragentil.com.br";')
linhas.append("")
linhas.append("export const TEMAS_COLECAO: TemaColecao[] = [")
for tid, nome, chamada, _ in temas:
    e, c = visual[tid]
    linhas.append(f"  {{ id: {js(tid)}, nome: {js(nome)}, emoji: {js(e)}, chamada: {js(chamada)}, cor: {js(c)} }},")
linhas.append("];")
linhas.append("")
linhas.append("export const COLECAO: LivroColecao[] = [")
for l in livros:
    linhas.append(f"  {{ codigo: {js(l['codigo'])}, slug: {js(l['slug'])}, titulo: {js(l['titulo'])}, pdf: {js(l['pdf'])}, tema: {js(l['tema'])} }},")
linhas.append("];")
linhas.append("")
linhas.append("export function capaDoLivro(l: LivroColecao): string {")
linhas.append("  return `${COLECAO_SITE_BASE}/guias/${l.slug}/capa.webp`;")
linhas.append("}")
linhas.append("")
linhas.append("export function pdfDoLivro(l: LivroColecao): string {")
linhas.append("  return `${COLECAO_PDF_BASE}/${l.pdf}`;")
linhas.append("}")
linhas.append("")

open(OUT, "w", encoding="utf8", newline="\n").write("\n".join(linhas))
print(len(livros), "livros;", len(temas), "temas")
from collections import Counter
print(Counter(l["tema"] for l in livros))
