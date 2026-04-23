"""
Rota de diagnóstico de plantas.

POST /v1/diagnostico
Recebe imagem via multipart/form-data e retorna diagnóstico estruturado.
"""
import logging

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.schemas.diagnostico import DiagnosticoErrorResponse, DiagnosticoResponse
from app.services.gemini_service import (
    GeminiInvalidResponseError,
    GeminiService,
    GeminiServiceError,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1", tags=["Diagnostico"])

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


@router.post(
    "/diagnostico",
    response_model=DiagnosticoResponse,
    responses={
        400: {"model": DiagnosticoErrorResponse, "description": "Imagem inválida"},
        413: {"model": DiagnosticoErrorResponse, "description": "Imagem muito grande"},
        415: {"model": DiagnosticoErrorResponse, "description": "Formato não suportado"},
        502: {"model": DiagnosticoErrorResponse, "description": "Erro no Gemini"},
    },
)
async def diagnosticar(
    file: UploadFile = File(..., description="Foto da planta, JPEG, PNG ou WebP, até 10MB"),
) -> DiagnosticoResponse:
    """
    Analisa uma imagem de planta e retorna diagnóstico via Gemini.

    Regras:
    - Aceita JPEG, PNG ou WebP
    - Tamanho máximo: 10MB
    - Retorna schema DiagnosticoResponse validado
    """
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail={
                "error_code": "UNSUPPORTED_MEDIA_TYPE",
                "message": f"Formato {file.content_type} não suportado. Use JPEG, PNG ou WebP.",
            },
        )

    image_bytes = await file.read()

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

    try:
        service = GeminiService()
        resultado = service.diagnosticar(image_bytes)
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
        "Diagnóstico concluído: especie=%s confianca=%s",
        resultado.especie_identificada,
        resultado.confianca,
    )

    return resultado
