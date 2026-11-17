"""
Servico de diagnostico v2 com o Claude (Anthropic).

Prepara a foto (orientacao EXIF, no maximo 1568 px no lado maior, JPEG), chama o modelo
com saida estruturada pelo schema v2 e devolve um DiagnosticoV2Response.

Regras (secoes 6.1, 7.2 e 7.4 da proposta):
- Uma tentativa so, sem retentativa no SDK (max_retries=0) e com limite de tempo proprio
  do cliente, para a requisicao ser abortada de verdade e nao seguir sendo cobrada.
- Qualquer falha vira ClaudeServiceError com um motivo curto; a rota cai no Gemini.
- O system tem dois blocos (instrucoes e catalogo) e a marca de cache de 1 hora fica
  no segundo. Data e foto vao na mensagem do usuario, depois da marca.
"""
from __future__ import annotations

import asyncio
import base64
import json
import logging
import time
from datetime import datetime
from io import BytesIO

import anthropic
from anthropic import AsyncAnthropic
from PIL import Image, ImageOps

from app.core.config import settings
from app.prompts.diagnostico_v2 import catalogo_v2, instrucoes_v2
from app.schemas.diagnostico_v2 import DiagnosticoV2Response, EbookRecomendado
from app.schemas.diagnostico_v2_schema import DIAGNOSTICO_V2_JSON_SCHEMA
from app.services.trava_diaria import FUSO_BRASILIA

logger = logging.getLogger(__name__)

LADO_MAXIMO_PX = 1568
QUALIDADE_JPEG = 85


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


def resolver_ebooks(itens: list[EbookRecomendado]) -> list[EbookRecomendado]:
    """
    Ponto de extensao dos ebooks (secao 2.6 da proposta).

    Quando o catalogo existir (app/data/catalogo_ebooks.json), aqui o backend descarta
    codigos fora do catalogo, remove repetidos, limita a 2 e completa titulo, capa, pdf,
    tema e emoji. Na fase 1 nao ha catalogo, entao nada e recomendado.
    """
    return []


def _montar_requisicao(imagem_jpeg: bytes, linhas_catalogo: list[str] | None = None) -> dict:
    """Parametros de messages.create. Ordem e conteudo do prefixo precisam ser estaveis."""
    data_hoje = datetime.now(FUSO_BRASILIA).strftime("%d/%m/%Y")
    return {
        "model": settings.CLAUDE_MODEL,
        "max_tokens": settings.CLAUDE_MAX_TOKENS,
        "system": [
            {"type": "text", "text": instrucoes_v2()},
            {
                "type": "text",
                "text": catalogo_v2(linhas_catalogo),
                "cache_control": {"type": "ephemeral", "ttl": "1h"},
            },
        ],
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/jpeg",
                            "data": base64.standard_b64encode(imagem_jpeg).decode("ascii"),
                        },
                    },
                    {"type": "text", "text": f"Data de hoje: {data_hoje}. País: Brasil."},
                ],
            }
        ],
        "output_config": {
            "effort": settings.CLAUDE_EFFORT,
            "format": {"type": "json_schema", "schema": DIAGNOSTICO_V2_JSON_SCHEMA},
        },
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

    async def diagnosticar(self, image_bytes: bytes) -> DiagnosticoV2Response:
        # Decodificar e reduzir foto de 12 MP leva centenas de ms: fora do loop de eventos
        imagem_jpeg, original, final = await asyncio.to_thread(preparar_imagem, image_bytes)
        logger.info(
            "Enviando imagem ao Claude: original=%sx%s final=%sx%s bytes=%s",
            original[0], original[1], final[0], final[1], len(imagem_jpeg),
        )

        params = _montar_requisicao(imagem_jpeg)
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
            dados = json.loads(texto)
            relatorio = DiagnosticoV2Response(**dados)
        except Exception as exc:
            raise ClaudeServiceError("fora_do_schema", str(exc)[:500]) from exc

        relatorio.ebooks_recomendados = resolver_ebooks(relatorio.ebooks_recomendados)
        return relatorio
