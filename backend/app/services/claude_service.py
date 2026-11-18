"""
Servico de diagnostico v2 com o Claude (Anthropic).

Prepara de 1 a 3 fotos da mesma planta (orientacao EXIF, no maximo 1568 px no lado maior,
JPEG, cada uma), chama o modelo com o schema v2 no prompt e devolve um DiagnosticoV2Response.

Sem saida estruturada (output_config.format): o schema v2 compila numa gramatica maior
que o limite interno da API ("compiled grammar is too large", fase 2, 17/11/2026). O
schema vai no primeiro bloco do system, dentro do prefixo em cache, e o Pydantic valida
a resposta; fora do schema vira ClaudeServiceError e a rota cai no Gemini.

Regras (secoes 6.1, 7.2 e 7.4 da proposta):
- Uma tentativa so, sem retentativa no SDK (max_retries=0) e com limite de tempo proprio
  do cliente, para a requisicao ser abortada de verdade e nao seguir sendo cobrada.
- Qualquer falha vira ClaudeServiceError com um motivo curto; a rota cai no Gemini.
- Com EBOOKS_PELO_BACKEND (padrao desde 18/11/2026) o system tem um bloco so, sem catalogo,
  e o backend escolhe os guias (escolher_ebooks). Desligado, volta o segundo bloco com o
  catalogo. A marca de cache (CLAUDE_CACHE_TTL, 5m por padrao) fica no ultimo bloco.
  Fotos, data, mes e estacao vao na mensagem do usuario, depois da marca.
"""
from __future__ import annotations

import asyncio
import base64
import json
import logging
import time
from datetime import datetime
from functools import lru_cache
from io import BytesIO
from pathlib import Path

import anthropic
from anthropic import AsyncAnthropic
from PIL import Image, ImageOps

from app.core.config import settings
from app.prompts.diagnostico_v2 import catalogo_v2, instrucoes_v2
from app.schemas.diagnostico_v2 import DiagnosticoV2Response, EbookRecomendado
from app.schemas.diagnostico_v2_schema import schema_v2
from app.services.escolher_ebooks import escolher_ebooks
from app.services.trava_diaria import FUSO_BRASILIA

logger = logging.getLogger(__name__)

LADO_MAXIMO_PX = 1568
QUALIDADE_JPEG = 85

# Gerado por mobile/scripts/gerar-colecao.py, mesma fonte da aba Ebooks do app
CATALOGO_EBOOKS_PATH = Path(__file__).resolve().parent.parent / "data" / "catalogo_ebooks.json"
MAX_EBOOKS = 2
MAX_FOTOS = 3

MESES = (
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
)


def estacao_brasil(mes: int) -> str:
    """Estacao no hemisferio sul pelo mes (1 a 12), pelos meses inteiros que o app usa."""
    if mes in (12, 1, 2):
        return "verão"
    if mes in (3, 4, 5):
        return "outono"
    if mes in (6, 7, 8):
        return "inverno"
    return "primavera"


def texto_usuario(agora: datetime, n_fotos: int) -> str:
    """Texto da mensagem do usuario. Muda por chamada, por isso fica fora do bloco em cache."""
    fotos = (
        "Foto enviada: 1."
        if n_fotos == 1
        else f"Fotos enviadas: {n_fotos}, ângulos da mesma planta. "
        "A primeira é a principal e area_foto se refere sempre a ela."
    )
    return (
        f"Data de hoje: {agora.strftime('%d/%m/%Y')}. País: Brasil. "
        f"Mês: {MESES[agora.month - 1]}. Estação no Brasil: {estacao_brasil(agora.month)}. "
        "Considere essa estação na rega e nos cuidados. " + fotos
    )


class ClaudeServiceError(Exception):
    """Falha no caminho do Claude. O atributo motivo vai para o log da reserva."""

    def __init__(self, motivo: str, detalhe: str = "") -> None:
        self.motivo = motivo
        super().__init__(f"{motivo}: {detalhe}" if detalhe else motivo)


# Cliente reaproveitado entre chamadas (pool de conexoes). Criado sob demanda.
_cliente: AsyncAnthropic | None = None


def _obter_cliente() -> AsyncAnthropic:
    global _cliente
    if _cliente is None:
        _cliente = AsyncAnthropic(
            api_key=settings.ANTHROPIC_API_KEY,
            timeout=settings.CLAUDE_TIMEOUT_S,
            max_retries=0,
        )
    return _cliente


def preparar_imagem(image_bytes: bytes) -> tuple[bytes, tuple[int, int], tuple[int, int]]:
    """
    Valida a imagem como o GeminiService, aplica a orientacao EXIF, reduz para no
    maximo LADO_MAXIMO_PX no lado maior e recomprime em JPEG.
    Devolve (bytes_jpeg, tamanho_original, tamanho_final).
    """
    try:
        img = Image.open(BytesIO(image_bytes))
        img.verify()
        img = Image.open(BytesIO(image_bytes))
        img.load()
    except Exception as exc:
        raise ClaudeServiceError("imagem_invalida", str(exc)) from exc

    original = img.size
    img = ImageOps.exif_transpose(img)
    if img.mode != "RGB":
        # Transparencia vira fundo branco, para nao escurecer a foto no JPEG
        fundo = Image.new("RGB", img.size, (255, 255, 255))
        rgba = img.convert("RGBA")
        fundo.paste(rgba, mask=rgba.getchannel("A"))
        img = fundo
    img.thumbnail((LADO_MAXIMO_PX, LADO_MAXIMO_PX), Image.Resampling.LANCZOS)

    buf = BytesIO()
    img.save(buf, format="JPEG", quality=QUALIDADE_JPEG, optimize=True)
    return buf.getvalue(), original, img.size


@lru_cache(maxsize=1)
def carregar_catalogo() -> dict[str, dict]:
    """Catalogo indexado pelo id em minusculas. Arquivo ausente ou quebrado vira catalogo vazio."""
    try:
        itens = json.loads(CATALOGO_EBOOKS_PATH.read_text(encoding="utf-8"))
        return {item["id"].lower(): item for item in itens}
    except (OSError, ValueError, KeyError, TypeError) as exc:
        logger.warning("Catalogo de ebooks indisponivel: %s", exc)
        return {}


@lru_cache(maxsize=1)
def linhas_catalogo() -> tuple[str, ...]:
    """Uma linha por guia, na ordem do arquivo, para o texto do prefixo em cache nao mudar."""
    return tuple(
        f"{i['id']} | {i['titulo']} | {i['tema']} | {i['descricao']}"
        for i in carregar_catalogo().values()
    )


def resolver_ebooks(itens: list[EbookRecomendado]) -> list[EbookRecomendado]:
    """
    Confere os ebooks indicados pelo modelo (secao 2.6 da proposta): descarta codigos fora
    do catalogo e repetidos, limita a MAX_EBOOKS e completa titulo, capa, pdf, tema e emoji
    com os dados do catalogo, nunca com o que o modelo escreveu.
    """
    catalogo = carregar_catalogo()
    resultado: list[EbookRecomendado] = []
    vistos: set[str] = set()
    for item in itens:
        chave = item.id.strip().lower()
        livro = catalogo.get(chave)
        if livro is None:
            if chave:
                logger.info("Ebook fora do catalogo descartado: %s", item.id)
            continue
        if chave in vistos:
            continue
        vistos.add(chave)
        resultado.append(
            EbookRecomendado(
                id=livro["id"],
                motivo=item.motivo.strip(),
                titulo=livro["titulo"],
                capa=livro["capa"],
                pdf=livro["pdf"],
                tema=livro["tema"],
                emoji=livro.get("emoji", ""),
            )
        )
        if len(resultado) == MAX_EBOOKS:
            break
    return resultado


# Observacoes da foto que vao para a tela (so as nao neutras)
MAX_LEITURA_FOTO = 3

# Toxicidade: niveis que fazem o app mostrar o cartao de alerta (toxica_para_pets true)
NIVEIS_TOXICOS = {"leve", "moderada", "grave", "desconhecida"}

TEXTO_TOXICIDADE_DESCONHECIDA = (
    "Não deu para confirmar se esta planta é segura. "
    "Mantenha fora do alcance de pets e crianças até ter certeza."
)

# Luz que a especie precisa, para a ficha de cuidados (cuidados.luz_e_local)
ROTULO_LUZ = {
    "sol_pleno": "Sol direto por boa parte do dia, em área externa ou janela bem ensolarada.",
    "meia_sombra": "Meia sombra, com sol fraco da manhã ou do fim da tarde.",
    "indireta_brilhante": "Luz indireta e clara, perto de uma janela, sem sol forte direto nas folhas.",
    "sombra": "Pouca luz, longe da janela, sem sol direto.",
}


def _frase(texto: str) -> str:
    """Tira espacos e ponto final, para juntar trechos sem pontuacao dobrada."""
    return texto.strip().rstrip(".").strip()


def _montar_toxicidade_detalhes(relatorio: DiagnosticoV2Response) -> str:
    """Resumo v1 do risco a partir do bloco toxicidade (partes e sintomas)."""
    tox = relatorio.toxicidade
    if tox.nivel not in NIVEIS_TOXICOS:
        return ""
    partes, sintomas = _frase(tox.partes_toxicas), _frase(tox.sintomas)
    trechos = []
    if partes:
        trechos.append(f"Partes tóxicas: {partes[0].lower() + partes[1:]}.")
    if sintomas:
        trechos.append(f"Sintomas: {sintomas[0].lower() + sintomas[1:]}.")
    if trechos:
        return " ".join(trechos)
    if tox.nivel == "desconhecida":
        return TEXTO_TOXICIDADE_DESCONHECIDA
    return tox.o_que_fazer.strip()


def _montar_mensagem_retorno(dias: int) -> str:
    """Frase do lembrete da tela v1 a partir de retorno_em_dias."""
    if dias <= 0:
        return ""
    prazo = "amanhã" if dias == 1 else f"daqui a {dias} dias"
    return f"Tire uma nova foto {prazo} para conferir como a planta está reagindo."


def completar_campos_derivados(relatorio: DiagnosticoV2Response) -> DiagnosticoV2Response:
    """
    Preenche os campos v1 que o modelo deixou de escrever (secao C de
    docs/PESQUISA-CONCORRENTES.md), para a resposta continuar valida e completa para a
    tela v1 publicada:
    - toxicidade_detalhes: montado de toxicidade.partes_toxicas e sintomas
    - toxica_para_pets: true sempre que o nivel pede o alerta (leve a grave ou desconhecida)
    - precisa_retorno e mensagem_retorno: derivados de acompanhamento.retorno_em_dias
    - cuidados.rega e cuidados.luz_e_local: da grade (rega_condicao e nivel_luz)
    - calendario_cuidados: fica vazio (nenhuma tela usa; rega_dias ja cobre a rotina)
    - leitura_foto: sem itens neutros e com no maximo MAX_LEITURA_FOTO, mesmo que o
      modelo escape da regra do prompt
    Campo que o modelo ainda preencher por conta propria e mantido.
    """
    relatorio.leitura_foto = [
        item for item in relatorio.leitura_foto if item.sinal != "neutro"
    ][:MAX_LEITURA_FOTO]

    if relatorio.toxicidade.nivel in NIVEIS_TOXICOS:
        relatorio.toxica_para_pets = True
    if relatorio.toxica_para_pets and not relatorio.toxicidade_detalhes.strip():
        relatorio.toxicidade_detalhes = (
            _montar_toxicidade_detalhes(relatorio) or TEXTO_TOXICIDADE_DESCONHECIDA
        )

    dias = relatorio.acompanhamento.retorno_em_dias if relatorio.eh_planta else 0
    relatorio.precisa_retorno = dias > 0
    relatorio.mensagem_retorno = _montar_mensagem_retorno(dias)

    if relatorio.eh_planta:
        cuidados = relatorio.cuidados
        if not cuidados.rega.strip():
            cuidados.rega = relatorio.rega_condicao.strip()
        if not cuidados.luz_e_local.strip():
            cuidados.luz_e_local = ROTULO_LUZ.get(relatorio.nivel_luz.value, "")
    return relatorio


def _formato_resposta(com_ebooks: bool = True) -> str:
    """Instrucao de formato com o schema v2 compacto. Texto fixo para nao quebrar o cache."""
    schema = json.dumps(schema_v2(com_ebooks), ensure_ascii=False, separators=(",", ":"))
    return (
        "\n\nFORMATO DA RESPOSTA: responda somente com um objeto JSON, sem texto antes ou "
        "depois e sem cercas de codigo, que valide neste JSON Schema (todos os campos "
        "sao obrigatorios):\n" + schema
    )


def extrair_json(texto: str) -> str:
    """Recorta do primeiro '{' ao ultimo '}', tolerando cercas de codigo ou texto em volta."""
    inicio, fim = texto.find("{"), texto.rfind("}")
    return texto[inicio : fim + 1] if inicio != -1 and fim > inicio else texto


def _bloco_imagem(imagem_jpeg: bytes) -> dict:
    return {
        "type": "image",
        "source": {
            "type": "base64",
            "media_type": "image/jpeg",
            "data": base64.standard_b64encode(imagem_jpeg).decode("ascii"),
        },
    }


def _montar_requisicao(
    imagens_jpeg: bytes | list[bytes],
    catalogo: list[str] | tuple[str, ...] | None = None,
) -> dict:
    """
    Parametros de messages.create. Ordem e conteudo do prefixo precisam ser estaveis.
    As imagens vao antes do texto, na ordem recebida (a primeira e a principal).
    """
    if isinstance(imagens_jpeg, (bytes, bytearray)):
        imagens_jpeg = [imagens_jpeg]
    agora = datetime.now(FUSO_BRASILIA)
    com_ebooks = not settings.EBOOKS_PELO_BACKEND
    system = [{"type": "text", "text": instrucoes_v2(com_ebooks) + _formato_resposta(com_ebooks)}]
    if com_ebooks:
        system.append({"type": "text", "text": catalogo_v2(list(catalogo) if catalogo else None)})
    system[-1]["cache_control"] = {"type": "ephemeral", "ttl": settings.CLAUDE_CACHE_TTL}
    return {
        "model": settings.CLAUDE_MODEL,
        "max_tokens": settings.CLAUDE_MAX_TOKENS,
        "system": system,
        "messages": [
            {
                "role": "user",
                "content": [
                    *(_bloco_imagem(img) for img in imagens_jpeg),
                    {"type": "text", "text": texto_usuario(agora, len(imagens_jpeg))},
                ],
            }
        ],
        "output_config": {"effort": settings.CLAUDE_EFFORT},
    }


def _classificar_erro(exc: Exception) -> ClaudeServiceError:
    """Traduz erros do SDK em motivos curtos para o log. Mais especifico primeiro."""
    if isinstance(exc, anthropic.APITimeoutError):
        return ClaudeServiceError("timeout", str(exc))
    if isinstance(exc, anthropic.RateLimitError):
        # Inclui limite de gasto do workspace e da organizacao
        return ClaudeServiceError(f"limite_{exc.status_code}", type(exc).__name__)
    if isinstance(exc, anthropic.APIStatusError):
        return ClaudeServiceError(f"erro_api_{exc.status_code}", type(exc).__name__)
    if isinstance(exc, anthropic.APIConnectionError):
        return ClaudeServiceError("conexao", str(exc))
    return ClaudeServiceError("erro_inesperado", f"{type(exc).__name__}: {exc}")


def _registrar_uso(resposta, elapsed_ms: int) -> None:
    """Log de tempo e tokens de cada chamada, para medir custo e acerto de cache."""
    uso = getattr(resposta, "usage", None)
    logger.info(
        "Claude uso: modelo=%s tempo_ms=%s stop_reason=%s input=%s output=%s "
        "cache_read=%s cache_write=%s request_id=%s",
        getattr(resposta, "model", settings.CLAUDE_MODEL),
        elapsed_ms,
        getattr(resposta, "stop_reason", None),
        getattr(uso, "input_tokens", None),
        getattr(uso, "output_tokens", None),
        getattr(uso, "cache_read_input_tokens", None),
        getattr(uso, "cache_creation_input_tokens", None),
        getattr(resposta, "_request_id", None),
    )


class ClaudeService:
    def __init__(self, client: AsyncAnthropic | None = None) -> None:
        if not settings.ANTHROPIC_API_KEY:
            raise ClaudeServiceError("sem_chave")
        self.client = client or _obter_cliente()

    async def diagnosticar(self, image_bytes: bytes | list[bytes]) -> DiagnosticoV2Response:
        """Aceita uma foto (bytes) ou de 1 a MAX_FOTOS fotos da mesma planta (lista)."""
        fotos = [image_bytes] if isinstance(image_bytes, (bytes, bytearray)) else list(image_bytes)
        if not fotos:
            raise ClaudeServiceError("imagem_invalida", "nenhuma foto")
        fotos = fotos[:MAX_FOTOS]

        # Decodificar e reduzir foto de 12 MP leva centenas de ms: fora do loop de eventos
        preparadas = await asyncio.gather(
            *(asyncio.to_thread(preparar_imagem, foto) for foto in fotos)
        )
        for i, (imagem_jpeg, original, final) in enumerate(preparadas, start=1):
            logger.info(
                "Enviando imagem %s/%s ao Claude: original=%sx%s final=%sx%s bytes=%s",
                i, len(preparadas), original[0], original[1], final[0], final[1], len(imagem_jpeg),
            )

        catalogo = None if settings.EBOOKS_PELO_BACKEND else linhas_catalogo()
        params = _montar_requisicao([p[0] for p in preparadas], catalogo)
        inicio = time.monotonic()
        try:
            resposta = await self.client.messages.create(**params)
        except Exception as exc:
            elapsed_ms = int((time.monotonic() - inicio) * 1000)
            erro = _classificar_erro(exc)
            logger.warning("Claude falhou em %sms: %s", elapsed_ms, erro.motivo)
            raise erro from exc

        _registrar_uso(resposta, int((time.monotonic() - inicio) * 1000))

        if resposta.stop_reason == "refusal":
            categoria = getattr(getattr(resposta, "stop_details", None), "category", None)
            raise ClaudeServiceError("recusa", f"categoria={categoria}")
        if resposta.stop_reason == "max_tokens":
            raise ClaudeServiceError("max_tokens", "resposta cortada no teto de tokens")

        texto = next((b.text for b in resposta.content if b.type == "text"), None)
        if not texto:
            raise ClaudeServiceError("sem_texto", f"stop_reason={resposta.stop_reason}")

        try:
            dados = json.loads(extrair_json(texto))
        except Exception as exc:
            raise ClaudeServiceError("fora_do_schema", str(exc)[:500]) from exc
        try:
            relatorio = DiagnosticoV2Response(**dados)
        except Exception as exc:
            relatorio = await self._consertar(params, texto, dados, exc)

        return pos_processar(relatorio)

    async def _consertar(self, params: dict, texto: str, dados: dict, exc: Exception) -> DiagnosticoV2Response:
        """
        JSON valido mas fora do schema (o Opus as vezes pula campos, ~1 em 10): devolve ao
        modelo a propria resposta e pede so os campos de topo com erro. O prefixo esta quente
        no cache, entao custa ~US$ 0,02 e poucos segundos, contra cair no Gemini.
        """
        campos = campos_com_erro(exc, dados) if isinstance(dados, dict) else []
        if not campos or not settings.CLAUDE_CONSERTO:
            raise ClaudeServiceError("fora_do_schema", str(exc)[:500]) from exc
        logger.warning("Claude fora do schema, pedindo conserto de %s", ", ".join(campos))

        pedido = (
            "Sua resposta não passou na validação do schema. Campos com problema: "
            + ", ".join(campos)
            + ". Responda somente com um objeto JSON que tenha apenas esses campos, completos e "
            "corrigidos, seguindo o schema e coerentes com o resto do relatório. Sem texto em volta."
        )
        conserto = params | {
            "max_tokens": CONSERTO_MAX_TOKENS,
            "messages": params["messages"]
            + [
                {"role": "assistant", "content": texto},
                {"role": "user", "content": [{"type": "text", "text": pedido}]},
            ],
        }
        inicio = time.monotonic()
        try:
            resposta = await self.client.with_options(timeout=CONSERTO_TIMEOUT_S).messages.create(**conserto)
        except Exception as erro_api:
            logger.warning("Conserto do Claude falhou: %s", _classificar_erro(erro_api).motivo)
            raise ClaudeServiceError("fora_do_schema", str(exc)[:500]) from exc
        _registrar_uso(resposta, int((time.monotonic() - inicio) * 1000))

        texto_conserto = next((b.text for b in resposta.content if b.type == "text"), "")
        try:
            remendo = json.loads(extrair_json(texto_conserto))
            relatorio = DiagnosticoV2Response(**(dados | {k: v for k, v in remendo.items() if k in campos}))
        except Exception as exc2:
            raise ClaudeServiceError("fora_do_schema", f"conserto falhou: {str(exc2)[:450]}") from exc2
        logger.info("Conserto do Claude ok: %s", ", ".join(campos))
        return relatorio


# Conserto de resposta fora do schema: saida curta e limite de tempo proprio
CONSERTO_MAX_TOKENS = 3000
CONSERTO_TIMEOUT_S = 20.0


def campos_com_erro(exc: Exception, dados: dict) -> list[str]:
    """
    Campos de topo citados no erro do Pydantic mais os obrigatorios do schema que nao
    vieram (alguns tem valor padrao no modelo e passariam vazios), sem repetir.
    """
    erros = getattr(exc, "errors", None)
    if not callable(erros):
        return []
    citados = [str(e["loc"][0]) for e in erros() if e.get("loc")]
    obrigatorios = schema_v2(not settings.EBOOKS_PELO_BACKEND)["required"]
    return list(dict.fromkeys(citados + [c for c in obrigatorios if c not in dados]))


def pos_processar(relatorio: DiagnosticoV2Response) -> DiagnosticoV2Response:
    """Tudo o que o backend faz sobre a resposta validada antes de devolver ao app."""
    if settings.EBOOKS_PELO_BACKEND:
        relatorio.ebooks_recomendados = escolher_ebooks(relatorio, carregar_catalogo())
    else:
        relatorio.ebooks_recomendados = resolver_ebooks(relatorio.ebooks_recomendados)
    return completar_campos_derivados(relatorio)
