"""
Serviço de integração com Google Gemini.

Responsável por enviar imagens de plantas e receber diagnósticos estruturados.
"""
from __future__ import annotations

import json
import logging
import time
from io import BytesIO

import google.generativeai as genai
from PIL import Image

from app.core.config import settings
from app.prompts.diagnostico_v1 import PROMPT_DIAGNOSTICO_V1
from app.schemas.diagnostico import DiagnosticoResponse

logger = logging.getLogger(__name__)


class GeminiServiceError(Exception):
    """Erro genérico do GeminiService."""


class GeminiInvalidResponseError(GeminiServiceError):
    """Gemini retornou resposta que não é JSON válido ou não bate com schema."""


DIAGNOSTICO_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "eh_planta": {"type": "boolean"},
        "especie_identificada": {"type": "string"},
        "nome_popular": {"type": "string"},
        "confianca": {"type": "number"},
        "estado_saude": {
            "type": "string",
            "enum": ["saudavel", "atencao", "doente", "critico", "nao_aplicavel"],
        },
        "toxica_para_pets": {"type": "boolean"},
        "toxicidade_detalhes": {"type": "string"},
        "nivel_luz": {
            "type": "string",
            "enum": ["sol_pleno", "meia_sombra", "indireta_brilhante", "sombra", "nao_aplicavel"],
        },
        "rega_dias": {"type": "integer"},
        "rega_condicao": {"type": "string"},
        "temperatura_ideal": {"type": "string"},
        "nivel_dificuldade": {
            "type": "string",
            "enum": ["facil", "medio", "dificil", "nao_aplicavel"],
        },
        "luz_porcentagem": {"type": "integer"},
        "luz_veredito": {"type": "string"},
        "diagnostico_titulo": {"type": "string"},
        "diagnostico_explicacao": {"type": "string"},
        "problemas_detectados": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "descricao": {"type": "string"},
                    "gravidade": {"type": "string"},
                    "causa_provavel": {"type": "string"},
                },
                "required": ["descricao", "gravidade", "causa_provavel"],
            },
        },
        "plano_tratamento": {"type": "string"},
        "plano_timeline": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "etapa": {"type": "string"},
                    "acao": {"type": "string"},
                },
                "required": ["etapa", "acao"],
            },
        },
        "precisa_retorno": {"type": "boolean"},
        "mensagem_retorno": {"type": "string"},
    },
    "required": [
        "eh_planta",
        "especie_identificada",
        "nome_popular",
        "confianca",
        "estado_saude",
        "toxica_para_pets",
        "toxicidade_detalhes",
        "nivel_luz",
        "rega_dias",
        "rega_condicao",
        "temperatura_ideal",
        "nivel_dificuldade",
        "luz_porcentagem",
        "luz_veredito",
        "diagnostico_titulo",
        "diagnostico_explicacao",
        "problemas_detectados",
        "plano_tratamento",
        "plano_timeline",
        "precisa_retorno",
        "mensagem_retorno",
    ],
}


class GeminiService:
    def __init__(self) -> None:
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY nao configurada.")
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model_name = settings.GEMINI_MODEL
        self.model = genai.GenerativeModel(self.model_name)
        logger.info("GeminiService inicializado com modelo %s", self.model_name)

    def hello(self) -> str:
        response = self.model.generate_content(
            "Responda em portugues: diga apenas 'Ola do Terra Gentil, conectado ao Gemini'."
        )
        return response.text.strip()

    def diagnosticar(self, image_bytes: bytes) -> DiagnosticoResponse:
        start = time.time()

        try:
            pil_image = Image.open(BytesIO(image_bytes))
            pil_image.verify()
            pil_image = Image.open(BytesIO(image_bytes))
        except Exception as exc:
            raise GeminiServiceError(f"Imagem invalida ou corrompida: {exc}") from exc

        logger.info(
            "Enviando imagem ao Gemini: formato=%s tamanho=%sx%s bytes=%s",
            pil_image.format,
            pil_image.width,
            pil_image.height,
            len(image_bytes),
        )

        try:
            response = self.model.generate_content(
                [PROMPT_DIAGNOSTICO_V1, pil_image],
                generation_config=genai.types.GenerationConfig(
                    temperature=0.2,
                    max_output_tokens=2048,
                    response_mime_type="application/json",
                    response_schema=DIAGNOSTICO_JSON_SCHEMA,
                ),
            )
        except Exception as exc:
            raise GeminiServiceError(f"Falha ao chamar Gemini: {exc}") from exc

        elapsed_ms = int((time.time() - start) * 1000)
        raw_text = response.text.strip()

        logger.info("Gemini respondeu em %sms com %s chars", elapsed_ms, len(raw_text))

        try:
            data = json.loads(raw_text)
        except json.JSONDecodeError as exc:
            logger.error("Resposta do Gemini nao e JSON: %s", raw_text[:500])
            raise GeminiInvalidResponseError(
                f"Gemini retornou resposta fora do formato esperado: {exc}"
            ) from exc

        try:
            return DiagnosticoResponse(**data)
        except Exception as exc:
            logger.error("Resposta nao bate com schema: %s", data)
            raise GeminiInvalidResponseError(
                f"Resposta do Gemini nao bate com o schema: {exc}"
            ) from exc
