"""
Foto de referencia da especie, buscada na Wikipedia pelo nome cientifico.

Campo derivado pelo backend, nunca pelo modelo: foto_referencia na raiz do relatorio v2
(especie identificada) e em cada identificacao.alternativas[].

Regras:
- API REST page/summary, primeiro em pt e, se nao achar, em en; usa thumbnail.source.
- Todas as buscas em paralelo com teto total de TEMPO_TOTAL_S. O que nao chegou a tempo
  vira "", sem atrasar a resposta alem disso.
- Cache em memoria por nome (achou ou pagina inexistente). Falha de rede nao entra no
  cache, para tentar de novo na proxima consulta.
- Qualquer falha e silenciosa e vira "".
"""
from __future__ import annotations

import asyncio
import logging
import re
from collections import OrderedDict
from urllib.parse import quote

import httpx

from app.schemas.diagnostico_v2 import DiagnosticoV2Response

logger = logging.getLogger(__name__)

TEMPO_TOTAL_S = 2.0
IDIOMAS = ("pt", "en")
URL_RESUMO = "https://{idioma}.wikipedia.org/api/rest_v1/page/summary/{titulo}"
CABECALHOS = {"User-Agent": "TerraGentilApp/1.0", "Accept": "application/json"}
CACHE_MAXIMO = 512

# nome normalizado -> url ("" quando a Wikipedia nao tem pagina com foto)
_cache: OrderedDict[str, str] = OrderedDict()

# Transporte do httpx; os testes trocam por um httpx.MockTransport
_transporte: httpx.AsyncBaseTransport | None = None


class _SemResposta(Exception):
    """Falha de rede ou resposta inesperada: nao vai para o cache."""


def limpar_cache() -> None:
    _cache.clear()


def normalizar_nome(nome: str) -> str:
    """
    Nome cientifico pronto para virar titulo de pagina: so genero e epiteto, sem autor,
    sem "sp." e sem variedade entre aspas. "Monstera sp." vira "Monstera".
    """
    nome = re.sub(r"['\"‘’“”].*$", "", (nome or "").strip())
    partes = [p for p in nome.split() if p]
    if not partes:
        return ""
    if len(partes) >= 2 and partes[1].lower().rstrip(".") in ("sp", "spp"):
        return partes[0].capitalize()
    if len(partes) >= 2 and partes[1].lower() == "x" and len(partes) >= 3:
        return f"{partes[0].capitalize()} × {partes[2].lower()}"
    if len(partes) >= 2 and partes[1][:1].islower() and partes[1].isalpha():
        return f"{partes[0].capitalize()} {partes[1]}"
    return partes[0].capitalize()


def _nome_valido(nome: str) -> bool:
    return bool(nome) and nome.lower() not in ("não identificada", "nao identificada")


async def _buscar_no_idioma(client: httpx.AsyncClient, idioma: str, nome: str) -> str:
    """URL da miniatura, "" se a pagina nao existe ou nao tem foto. Rede ruim levanta _SemResposta."""
    url = URL_RESUMO.format(idioma=idioma, titulo=quote(nome.replace(" ", "_"), safe=""))
    try:
        resp = await client.get(url)
    except httpx.HTTPError as exc:
        raise _SemResposta(str(exc)) from exc
    if resp.status_code == 404:
        return ""
    if resp.status_code != 200:
        raise _SemResposta(f"status {resp.status_code}")
    try:
        dados = resp.json()
    except ValueError as exc:
        raise _SemResposta("json invalido") from exc
    if not isinstance(dados, dict) or dados.get("type") == "disambiguation":
        return ""
    fonte = (dados.get("thumbnail") or {}).get("source", "")
    return fonte if isinstance(fonte, str) and fonte.startswith("https://") else ""


async def _buscar_nome(client: httpx.AsyncClient, nome: str) -> str:
    if nome in _cache:
        _cache.move_to_end(nome)
        return _cache[nome]
    try:
        url = ""
        for idioma in IDIOMAS:
            url = await _buscar_no_idioma(client, idioma, nome)
            if url:
                break
    except _SemResposta as exc:
        logger.info("Foto de referencia indisponivel para %s: %s", nome, exc)
        return ""
    _cache[nome] = url
    if len(_cache) > CACHE_MAXIMO:
        _cache.popitem(last=False)
    return url


async def buscar_fotos(nomes: list[str], tempo_total_s: float | None = None) -> dict[str, str]:
    """
    Busca em paralelo a foto de cada nome (ja normalizado). Devolve {nome: url}; nomes que
    nao responderam dentro do tempo (padrao TEMPO_TOTAL_S) ficam com "".
    """
    if tempo_total_s is None:
        tempo_total_s = TEMPO_TOTAL_S
    unicos = list(dict.fromkeys(n for n in nomes if n))
    resultado = {n: "" for n in unicos}
    pendentes = [n for n in unicos if n not in _cache]
    for n in unicos:
        if n in _cache:
            resultado[n] = _cache[n]
    if not pendentes:
        return resultado

    async with httpx.AsyncClient(
        timeout=tempo_total_s,
        headers=CABECALHOS,
        follow_redirects=True,
        transport=_transporte,
    ) as client:
        tarefas = {asyncio.create_task(_buscar_nome(client, n)): n for n in pendentes}
        prontas, atrasadas = await asyncio.wait(tarefas, timeout=tempo_total_s)
        for tarefa in atrasadas:
            tarefa.cancel()
        if atrasadas:
            await asyncio.gather(*atrasadas, return_exceptions=True)
            logger.info("Foto de referencia: %s busca(s) passaram do tempo", len(atrasadas))
        for tarefa in prontas:
            if not tarefa.cancelled() and tarefa.exception() is None:
                resultado[tarefas[tarefa]] = tarefa.result()
    return resultado


async def preencher_fotos_referencia(relatorio: DiagnosticoV2Response) -> DiagnosticoV2Response:
    """
    Preenche foto_referencia da especie e das alternativas. Sempre sobrescreve o que o
    modelo tenha escrito e nunca levanta erro.
    """
    alternativas = relatorio.identificacao.alternativas
    relatorio.foto_referencia = ""
    for alt in alternativas:
        alt.foto_referencia = ""
    if not relatorio.eh_planta:
        return relatorio

    principal = normalizar_nome(relatorio.especie_identificada)
    nomes_alt = [normalizar_nome(alt.especie) for alt in alternativas]
    nomes = [n for n in [principal, *nomes_alt] if _nome_valido(n)]
    if not nomes:
        return relatorio

    try:
        fotos = await buscar_fotos(nomes)
    except Exception as exc:  # noqa: BLE001, a foto e enfeite: nunca derruba o diagnostico
        logger.warning("Falha inesperada na foto de referencia: %s", exc)
        return relatorio

    relatorio.foto_referencia = fotos.get(principal, "")
    for alt, nome in zip(alternativas, nomes_alt):
        alt.foto_referencia = fotos.get(nome, "")
    return relatorio
