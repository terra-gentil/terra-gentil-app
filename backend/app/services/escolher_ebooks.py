"""
Escolha dos ebooks pelo backend, a partir do laudo ja validado.

Antes o catalogo inteiro (141 guias, 44% do prompt fixo) ia para o Claude escolher ate 2.
Agora o modelo nao ve o catalogo: o backend cruza nome da planta, problemas e toxicidade
com o titulo e a descricao de cada guia, e monta o motivo com uma frase fixa (opcao b,
aprovada pelo Andre em 18/11/2026).

Ordem: 1) guia da especie, 2) guia do problema mais grave, 3) guia de pet se a planta
for toxica e ainda sobrar vaga. Sem relacao clara, lista vazia.
"""
from __future__ import annotations

import re
import unicodedata

from app.schemas.diagnostico_v2 import DiagnosticoV2Response, EbookRecomendado

MAX_EBOOKS = 2

# Pontos de um nome da planta encontrado no guia. Nome inteiro vale mais que a primeira palavra.
PESO_NOME_TITULO = 10
PESO_NOME_DESCRICAO = 6
PESO_PALAVRA_TITULO = 6
PESO_PALAVRA_DESCRICAO = 3
# Planta com problema: guia "Doente" da especie passa na frente (Orquidea Doente, Roseira Doente)
BONUS_DOENTE = 5
PONTOS_MINIMOS = 6

# Nome cientifico ou popular -> nome que o catalogo usa
SINONIMOS = {
    "palma": ["cacto"],
    "opuntia": ["cacto"],
    "palmatoria": ["cacto"],
    "aloe": ["babosa"],
    "pothos": ["jiboia"],
    "epipremnum": ["jiboia"],
    "monstera": ["costela de adao"],
    "espatifilo": ["lirio da paz"],
    "spathiphyllum": ["lirio da paz"],
    "sansevieria": ["espada de sao jorge"],
    "dieffenbachia": ["comigo ninguem pode"],
    "difembaquia": ["comigo ninguem pode"],
    "morangueiro": ["morango"],
    "fragaria": ["morango"],
    "tomateiro": ["tomate"],
    "phalaenopsis": ["orquidea"],
    "falenopsis": ["orquidea"],
    "cattleya": ["orquidea"],
    "dendrobium": ["orquidea"],
    "roseira": ["rosa"],
    "nephrolepis": ["samambaia"],
    "zamioculcas": ["zamioculca"],
    "anthurium": ["anturio"],
    "dionaea": ["dioneia"],
    "nepenthes": ["nepentes"],
}

# Primeiras palavras genericas demais para valer como nome de planta
PALAVRAS_GENERICAS = {"planta", "plantas", "folha", "folhas", "flor", "flores", "nao", "identificada"}

# Categoria do problema -> (texto do motivo, guia padrao, guia por tema da especie)
GUIAS_PROBLEMA: dict[str, tuple[str, str, dict[str, str]]] = {
    "praga": ("a praga", "TG111", {"rosas": "TG030", "orquideas": "TG017"}),
    "fungo_ou_bacteria": ("a doença", "TG111", {"rosas": "TG030", "orquideas": "TG017"}),
    "rega_excesso": ("o excesso de água", "TG005", {"suculentas": "TG010", "orquideas": "TG017"}),
    "rega_falta": ("a falta de água", "TG005", {}),
    "luz_falta": ("a falta de luz", "TG009", {}),
    "luz_excesso": ("o excesso de sol", "TG108", {}),
    "nutricao": ("a falta de nutrientes", "TG057", {}),
    "raiz_ou_vaso": ("o problema na raiz e no vaso", "TG097", {"orquideas": "TG018"}),
}
ORDEM_GRAVIDADE = {"alta": 0, "media": 1, "baixa": 2}

GUIA_PET = "TG008"
NIVEIS_TOXICOS = {"leve", "moderada", "grave"}


def normalizar(texto: str) -> str:
    """Minusculas, sem acento, hifen vira espaco, sem caractere invisivel."""
    texto = unicodedata.normalize("NFKD", texto or "")
    texto = "".join(c for c in texto if not unicodedata.combining(c) and unicodedata.category(c) != "Cf")
    texto = re.sub(r"[^a-z0-9]+", " ", texto.lower())
    return texto.strip()


def _acha(termo: str, texto: str) -> bool:
    """Termo inteiro no texto, aceitando plural simples (cacto -> cactos)."""
    return re.search(rf"\b{re.escape(termo)}(s|es)?\b", texto) is not None


def nomes_da_planta(relatorio: DiagnosticoV2Response) -> tuple[list[str], list[str]]:
    """(nomes inteiros, primeiras palavras) normalizados, com sinonimos do catalogo."""
    brutos = [relatorio.nome_popular, relatorio.especie_identificada]
    if relatorio.identificacao:
        brutos += relatorio.identificacao.outros_nomes
    inteiros: list[str] = []
    palavras: list[str] = []
    for bruto in brutos:
        nome = normalizar(bruto)
        if not nome or nome in PALAVRAS_GENERICAS or nome == "nao identificada":
            continue
        inteiros.append(nome)
        for chave in (nome, nome.split()[0]):
            inteiros += SINONIMOS.get(chave, [])
        primeira = nome.split()[0]
        if len(primeira) >= 5 and primeira not in PALAVRAS_GENERICAS:
            palavras.append(primeira)
    return list(dict.fromkeys(inteiros)), list(dict.fromkeys(palavras))


def pontuar(livro: dict, inteiros: list[str], palavras: list[str], tem_problema: bool) -> int:
    titulo = normalizar(livro["titulo"])
    descricao = normalizar(_descricao_limpa(livro))
    pontos = 0
    for nome in inteiros:
        if _acha(nome, titulo):
            pontos += PESO_NOME_TITULO
        elif _acha(nome, descricao):
            pontos += PESO_NOME_DESCRICAO
    for palavra in palavras:
        if palavra in inteiros:
            continue
        if _acha(palavra, titulo):
            pontos += PESO_PALAVRA_TITULO
        elif _acha(palavra, descricao):
            pontos += PESO_PALAVRA_DESCRICAO
    if pontos and tem_problema and "doente" in titulo:
        pontos += BONUS_DOENTE
    return pontos


def _descricao_limpa(livro: dict) -> str:
    """Descricao sem a lista de palavras-chave dos classicos ("Fala de: ...")."""
    return livro.get("descricao", "").split(" Fala de:")[0].strip()


def _motivo(prefixo: str, livro: dict) -> str:
    """Frase do caso, ponto, descricao do catalogo (escrita por gente, sem inventar conteudo)."""
    descricao = _descricao_limpa(livro)
    return f"{prefixo}. {descricao}" if descricao else f"{prefixo}."


def _ebook(livro: dict, motivo: str) -> EbookRecomendado:
    return EbookRecomendado(
        id=livro["id"],
        motivo=motivo,
        titulo=livro["titulo"],
        capa=livro["capa"],
        pdf=livro["pdf"],
        tema=livro["tema"],
        emoji=livro.get("emoji", ""),
    )


def escolher_ebooks(relatorio: DiagnosticoV2Response, catalogo: dict[str, dict]) -> list[EbookRecomendado]:
    """Ate MAX_EBOOKS guias para o laudo. catalogo vem indexado pelo id em minusculas."""
    if not relatorio.eh_planta or not catalogo:
        return []

    escolhidos: list[tuple[dict, str]] = []
    usados: set[str] = set()

    def adicionar(livro: dict | None, motivo: str) -> None:
        if livro and livro["id"] not in usados and len(escolhidos) < MAX_EBOOKS:
            usados.add(livro["id"])
            escolhidos.append((livro, motivo))

    problemas = sorted(
        (p for p in relatorio.problemas_detectados if p.categoria in GUIAS_PROBLEMA),
        key=lambda p: ORDEM_GRAVIDADE.get(p.gravidade, 3),
    )

    # 1) Guia da especie: maior pontuacao, empate fica com a ordem do catalogo
    inteiros, palavras = nomes_da_planta(relatorio)
    especie, melhor = None, 0
    for livro in catalogo.values():
        pontos = pontuar(livro, inteiros, palavras, bool(problemas))
        if pontos > melhor:
            especie, melhor = livro, pontos
    if melhor < PONTOS_MINIMOS:
        especie = None
    if especie:
        nome = (relatorio.nome_popular or "").strip().lower()
        adicionar(especie, _motivo(f"Feito para quem tem {nome}", especie))

    # 2) Guia do problema mais grave que ainda nao foi indicado
    # Primeiro o guia proprio do tema (Vaso de Orquidea), depois o guia geral do problema
    tema = especie["tema"] if especie else ""
    candidatos = [
        (problema, codigo)
        for so_tema in (True, False)
        for problema in problemas
        for codigo in [GUIAS_PROBLEMA[problema.categoria][2].get(tema) if so_tema else GUIAS_PROBLEMA[problema.categoria][1]]
        if codigo
    ]
    for problema, codigo in candidatos:
        livro = catalogo.get(codigo.lower())
        if livro and livro["id"] not in usados:
            texto = GUIAS_PROBLEMA[problema.categoria][0]
            adicionar(livro, _motivo(f"Para {texto} que vi na sua planta", livro))
            break

    # 3) Planta toxica: guia de pet na vaga que sobrar
    if relatorio.toxicidade and relatorio.toxicidade.nivel in NIVEIS_TOXICOS:
        livro = catalogo.get(GUIA_PET.lower())
        adicionar(livro, _motivo("Sua planta é tóxica para cães e gatos", livro) if livro else "")

    return [_ebook(livro, motivo) for livro, motivo in escolhidos]
