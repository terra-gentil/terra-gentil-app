"""
Gera a colecao de ebooks a partir do site, numa execucao so:
- mobile/src/data/colecao.ts (aba Ebooks do app)
- backend/app/data/catalogo_ebooks.json (catalogo que o Doutor recomenda, secao 2.6 da proposta)

Uso: python3 mobile/scripts/gerar-colecao.py [--site CAMINHO_DO_SITE]
Sem --site, usa a variavel TG_SITE ou a pasta terra-gentil ao lado deste repositorio.
"""
import argparse, glob, json, os, re

APP = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SITE_PADRAO = os.environ.get("TG_SITE") or os.path.join(os.path.dirname(APP), "terra-gentil")

parser = argparse.ArgumentParser()
parser.add_argument("--site", default=SITE_PADRAO, help="raiz do repositorio do site (pasta terra-gentil)")
args = parser.parse_args()
SITE = args.site
OUT_TS = os.path.join(APP, "mobile", "src", "data", "colecao.ts")
OUT_JSON = os.path.join(APP, "backend", "app", "data", "catalogo_ebooks.json")
EBOOKS_TS = os.path.join(APP, "mobile", "src", "data", "ebooks.ts")

PDF_BASE = "https://terra-gentil-pdfs.canalterragentil.workers.dev"
SITE_BASE = "https://terragentil.com.br"

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
# Mesma regra do site (temaDe em lib/temas.ts): sem tema vai para o ultimo da lista
reserva = temas[-1][0]


def descricao_curta(texto):
    """Corta o fecho padrao das descricoes ("Livro gratis do Andre, ...")."""
    return texto.split(" Livro grátis do André")[0].strip()


livros = []
for f in glob.glob(os.path.join(SITE, "data", "guias", "*.json")):
    d = json.load(open(f, encoding="utf8"))
    livros.append({
        "codigo": d["codigo"],
        "slug": d["slug"],
        "titulo": d["titulo"],
        "pdf": d["meta"]["pdf"],
        "tema": tema_de.get(d["codigo"], reserva),
        "descricao": descricao_curta(d["meta"].get("descricao", "")),
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
    "carnivoras": ("🪤", "#B5463C"),
}
faltando = [t[0] for t in temas if t[0] not in visual]
if faltando:
    raise SystemExit(f"Tema sem emoji e cor no mapa visual: {faltando}")


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
linhas.append(f"export const COLECAO_PDF_BASE = {js(PDF_BASE)};")
linhas.append(f"export const COLECAO_SITE_BASE = {js(SITE_BASE)};")
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

open(OUT_TS, "w", encoding="utf8", newline="\n").write("\n".join(linhas))

# Classicos visiveis no app: os de ebooks.ts fora de NUMEROS_NA_COLECAO
ebooks_src = open(EBOOKS_TS, encoding="utf8").read()
base_img = re.search(r'const BASE_IMG = "([^"]+)"', ebooks_src).group(1)
base_pdf = re.search(r'const BASE_PDF = "([^"]+)"', ebooks_src).group(1)
escondidos = {int(n) for n in re.findall(r"\d+", re.search(r"NUMEROS_NA_COLECAO[^\[]*\[([^\]]*)\]", ebooks_src).group(1))}


def campo(bloco_ebook, nome):
    m = re.search(nome + r': (?:"([^"]*)"|`([^`]*)`)', bloco_ebook)
    valor = m.group(1) if m.group(1) is not None else m.group(2)
    return valor.replace("${BASE_IMG}", base_img).replace("${BASE_PDF}", base_pdf)


classicos = []
for m in re.finditer(r'\{\s*id: "(ebook-\d+)",\s*numero: (\d+),(.*?)keywords: \[([^\]]*)\]', ebooks_src, re.S):
    if int(m.group(2)) in escondidos:
        continue
    corpo = m.group(3)
    palavras = re.findall(r'"([^"]+)"', m.group(4))
    subtitulo = campo(corpo, "subtitulo")
    classicos.append({
        "id": m.group(1),
        "titulo": campo(corpo, "titulo"),
        "tema": "classicos",
        "descricao": f"{subtitulo}. Fala de: {', '.join(palavras)}." if palavras else subtitulo,
        "capa": campo(corpo, "capa"),
        "pdf": campo(corpo, "pdf"),
        "emoji": campo(corpo, "emoji"),
    })

catalogo = [
    {
        "id": l["codigo"],
        "titulo": l["titulo"],
        "tema": l["tema"],
        "descricao": l["descricao"],
        "capa": f"{SITE_BASE}/guias/{l['slug']}/capa.webp",
        "pdf": f"{PDF_BASE}/{l['pdf']}",
        "emoji": visual[l["tema"]][0],
    }
    for l in livros
] + classicos

os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
with open(OUT_JSON, "w", encoding="utf8", newline="\n") as f:
    json.dump(catalogo, f, ensure_ascii=False, indent=1)
    f.write("\n")

print(len(livros), "livros;", len(temas), "temas;", len(classicos), "classicos no catalogo do backend")
from collections import Counter
print(Counter(l["tema"] for l in livros))
