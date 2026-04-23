"""
Serviço de integração com Google Gemini.

Responsável por enviar imagens de plantas e receber diagnósticos estruturados.
"""
from __future__ import annotations

import logging

import google.generativeai as genai

from app.core.config import settings

logger = logging.getLogger(__name__)


class GeminiService:
    """
    Cliente de alto nível pra Gemini.

    Uso:
        service = GeminiService()
        resposta = service.hello()
    """

    def __init__(self) -> None:
        if not settings.GEMINI_API_KEY:
            raise ValueError(
                "GEMINI_API_KEY não configurada. Defina no .env ou nas variáveis do Railway."
            )

        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model_name = settings.GEMINI_MODEL
        self.model = genai.GenerativeModel(self.model_name)
        logger.info("GeminiService inicializado com modelo %s", self.model_name)

    def hello(self) -> str:
        """
        Chamada de teste, retorna uma saudação do Gemini.

        Usado pra validar que a API key funciona e o modelo responde.
        """
        response = self.model.generate_content(
            "Responda em portugues: diga apenas 'Ola do Terra Gentil, conectado ao Gemini'."
        )
        return response.text.strip()
