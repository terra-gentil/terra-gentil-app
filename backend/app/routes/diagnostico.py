"""
Rota de diagnóstico de plantas.

POST /v1/diagnostico
Recebe imagem via multipart/form-data e retorna diagnóstico estruturado.

Provedor por chamada: Claude (relatorio v2) quando ha chave, o sorteio cai dentro de
CLAUDE_ROLLOUT_PERCENT e a trava diaria tem vaga. Qualquer falha do Claude cai no
Gemini (relatorio v1) sem o usuario perceber. Os codigos de erro sao os de sempre.
"""
import asyncio
import logging
import random
import time

from fastapi import APIRouter, File, HTTPException, Request, UploadFile, status

from app.core.config import settings
from app.core.limiter import limiter
from app.schemas.diagnostico import DiagnosticoErrorResponse, DiagnosticoResponse
from app.schemas.diagnostico_v2 import DiagnosticoV2Response
from app.services.claude_service import ClaudeService, ClaudeServiceError
from app.services.gemini_service import (
    GEMINI_TIMEOUT_S,
    GeminiInvalidResponseError,
    GeminiQuotaError,
    GeminiService,
    GeminiServiceError,
    GeminiTimeoutError,
)
from app.services.trava_diaria import trava_claude

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1", tags=["Diagnostico"])

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}

# Teto total da rota quando o Gemini entra como reserva depois do Claude (secao 6.1).
ROTA_TETO_S = 95
# Folga sobre o limite do cliente do Claude; o cancelamento da tarefa aborta a conexao.
CLAUDE_FOLGA_S = 2
# Tempo minimo dado ao Gemini na reserva, mesmo com a rota perto do teto.
GEMINI_RESERVA_MINIMO_S = 10


def escolher_provedor() -> tuple[str, str]:
    """Devolve (provedor, motivo). So reserva vaga na trava quando o Claude vai ser chamado."""
    if not settings.ANTHROPIC_API_KEY:
        return "gemini", "sem_chave"
    if random.uniform(0, 100) >= settings.CLAUDE_ROLLOUT_PERCENT:
        return "gemini", "fora_da_liberacao"
    if not trava_claude.reservar(settings.CLAUDE_DAILY_LIMIT):
        return "gemini", "trava_diaria"
    return "claude", "liberado"


async def _diagnosticar_com_claude(image_bytes: bytes) -> DiagnosticoV2Response | None:
    """Tenta o Claude. Devolve None em qualquer falha, com o motivo no log."""
    try:
        service = ClaudeService()
        return await asyncio.wait_for(
            service.diagnosticar(image_bytes),
            timeout=settings.CLAUDE_TIMEOUT_S + CLAUDE_FOLGA_S,
        )
    except asyncio.TimeoutError:
        motivo = "timeout_rota"
    except ClaudeServiceError as exc:
        motivo = exc.motivo
    except Exception as exc:
        logger.exception("Erro nao tratado no caminho do Claude")
        motivo = f"erro_inesperado_{type(exc).__name__}"
    logger.warning("Claude falhou, usando Gemini como reserva: motivo=%s", motivo)
    return None


@router.post(
    "/diagnostico",
    # v2 primeiro: o relatorio do Claude sai com todos os campos, o do Gemini sai como v1
    response_model=DiagnosticoV2Response | DiagnosticoResponse,
    responses={
        400: {"model": DiagnosticoErrorResponse, "description": "Imagem inválida"},
        413: {"model": DiagnosticoErrorResponse, "description": "Imagem muito grande"},
        415: {"model": DiagnosticoErrorResponse, "description": "Formato não suportado"},
        502: {"model": DiagnosticoErrorResponse, "description": "Erro no Gemini"},
        504: {"model": DiagnosticoErrorResponse, "description": "Demora no diagnóstico"},
        429: {"model": DiagnosticoErrorResponse, "description": "Cota esgotada"},
    },
)
@limiter.limit("10/minute")
async def diagnosticar(
    request: Request,
    file: UploadFile = File(..., description="Foto da planta, JPEG, PNG ou WebP, até 10MB"),
) -> DiagnosticoV2Response | DiagnosticoResponse:
    """
    Analisa uma imagem de planta e retorna diagnóstico (Claude v2 ou Gemini v1).

    Regras:
    - Aceita JPEG, PNG ou WebP
    - Tamanho máximo: 10MB
    - Retorna DiagnosticoV2Response (Claude) ou DiagnosticoResponse (Gemini)
    """
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail={
                "error_code": "UNSUPPORTED_MEDIA_TYPE",
                "message": f"Formato {file.content_type} não suportado. Use JPEG, PNG ou WebP.",
            },
        )

    # +1 byte basta pra saber se passou do limite, sem carregar upload gigante
    image_bytes = await file.read(MAX_FILE_SIZE_BYTES + 1)

    if len(image_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail={
                "error_code": "FILE_TOO_LARGE",
                "message": f"Imagem tem {len(image_bytes)} bytes, máximo permitido é {MAX_FILE_SIZE_BYTES}.",
            },
        )

    if len(image_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error_code": "EMPTY_FILE",
                "message": "Arquivo enviado está vazio.",
            },
        )

    logger.info(
        "Diagnóstico solicitado: filename=%s content_type=%s size=%s",
        file.filename,
        file.content_type,
        len(image_bytes),
    )

    inicio = time.monotonic()
    provedor, motivo = escolher_provedor()
    logger.info("Provedor do diagnostico: %s (%s)", provedor, motivo)

    if provedor == "claude":
        resultado_v2 = await _diagnosticar_com_claude(image_bytes)
        if resultado_v2 is not None:
            logger.info(
                "Diagnóstico concluído: provedor=claude especie=%s confianca=%s",
                resultado_v2.especie_identificada,
                resultado_v2.confianca,
            )
            return resultado_v2

    try:
        service = GeminiService()
        # A chamada ao Gemini e bloqueante: roda em outra thread para nao travar a API inteira
        # (forum, feed, health) enquanto uma foto e analisada.
        if provedor == "claude":
            # Reserva depois de falha do Claude: 1 tentativa e o tempo que sobra da rota
            restante = ROTA_TETO_S - (time.monotonic() - inicio)
            chamada = asyncio.to_thread(service.diagnosticar, image_bytes, tentativas=1)
            limite = min(GEMINI_TIMEOUT_S + 10, max(GEMINI_RESERVA_MINIMO_S, restante))
        else:
            chamada = asyncio.to_thread(service.diagnosticar, image_bytes)
            limite = GEMINI_TIMEOUT_S + 10
        resultado = await asyncio.wait_for(chamada, timeout=limite)
    except (asyncio.TimeoutError, GeminiTimeoutError) as exc:
        logger.error("Diagnostico demorou demais: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail={
                "error_code": "GEMINI_TIMEOUT",
                "message": "O Doutor está com muita gente no consultório agora. Tente de novo em instantes.",
            },
        ) from exc
    except GeminiQuotaError as exc:
        logger.error("Cota do Gemini esgotada: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error_code": "GEMINI_QUOTA",
                "message": "O Doutor atendeu muitas plantas hoje e precisa descansar um pouco. Tente de novo mais tarde.",
            },
        ) from exc
    except GeminiInvalidResponseError as exc:
        logger.error("Resposta inválida do Gemini: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "error_code": "GEMINI_INVALID_RESPONSE",
                "message": "Gemini retornou resposta em formato inesperado. Tente novamente.",
                "details": str(exc),
            },
        ) from exc
    except GeminiServiceError as exc:
        logger.error("Erro no GeminiService: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "error_code": "GEMINI_ERROR",
                "message": "Erro ao processar imagem com Gemini.",
                "details": str(exc),
            },
        ) from exc
    except Exception as exc:
        logger.exception("Erro não tratado no diagnóstico")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error_code": "INTERNAL_ERROR",
                "message": "Erro interno ao processar o diagnóstico.",
            },
        ) from exc

    logger.info(
        "Diagnóstico concluído: provedor=gemini especie=%s confianca=%s",
        resultado.especie_identificada,
        resultado.confianca,
    )

    return resultado
