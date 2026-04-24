"""
Testes do GeminiService.

Testa a logica de validacao de imagem, parsing de JSON e retry
sem chamar a API do Gemini de verdade.
"""
import io
import json
from unittest.mock import MagicMock, patch

import pytest
from PIL import Image

from app.services.gemini_service import (
    GeminiInvalidResponseError,
    GeminiService,
    GeminiServiceError,
)

from .conftest import mock_gemini_response


@pytest.fixture()
def gemini_service():
    """GeminiService com API key fake e model mockado."""
    with patch("app.services.gemini_service.settings") as mock_settings:
        mock_settings.GEMINI_API_KEY = "fake-key-para-teste"
        mock_settings.GEMINI_MODEL = "gemini-2.5-flash"
        with patch("app.services.gemini_service.genai"):
            service = GeminiService()
            yield service


class TestGeminiServiceInit:
    """Testes de inicializacao do GeminiService."""

    def test_sem_api_key_levanta_erro(self):
        with patch("app.services.gemini_service.settings") as mock_settings:
            mock_settings.GEMINI_API_KEY = ""
            with pytest.raises(ValueError, match="GEMINI_API_KEY"):
                GeminiService()


class TestValidacaoImagem:
    """Testes de validacao de imagem antes de enviar ao Gemini."""

    def test_imagem_corrompida_levanta_erro(self, gemini_service):
        with pytest.raises(GeminiServiceError, match="invalida ou corrompida"):
            gemini_service.diagnosticar(b"nao-sou-imagem")

    def test_bytes_vazios_levanta_erro(self, gemini_service):
        with pytest.raises(GeminiServiceError):
            gemini_service.diagnosticar(b"")

    def test_imagem_jpeg_valida_nao_rejeita_na_validacao(
        self, gemini_service, imagem_jpeg_valida, resposta_planta_saudavel
    ):
        gemini_service.model.generate_content.return_value = mock_gemini_response(
            resposta_planta_saudavel
        )
        resultado = gemini_service.diagnosticar(imagem_jpeg_valida)
        assert resultado.eh_planta is True

    def test_imagem_png_valida_nao_rejeita_na_validacao(
        self, gemini_service, imagem_png_valida, resposta_planta_saudavel
    ):
        gemini_service.model.generate_content.return_value = mock_gemini_response(
            resposta_planta_saudavel
        )
        resultado = gemini_service.diagnosticar(imagem_png_valida)
        assert resultado.eh_planta is True


class TestParsingResposta:
    """Testes do parsing e validacao da resposta do Gemini."""

    def test_resposta_valida_retorna_diagnostico(
        self, gemini_service, imagem_jpeg_valida, resposta_planta_saudavel
    ):
        gemini_service.model.generate_content.return_value = mock_gemini_response(
            resposta_planta_saudavel
        )
        resultado = gemini_service.diagnosticar(imagem_jpeg_valida)
        assert resultado.especie_identificada == "Dieffenbachia seguine"
        assert resultado.confianca == 0.92

    def test_resposta_nao_planta(
        self, gemini_service, imagem_jpeg_valida, resposta_nao_planta
    ):
        gemini_service.model.generate_content.return_value = mock_gemini_response(
            resposta_nao_planta
        )
        resultado = gemini_service.diagnosticar(imagem_jpeg_valida)
        assert resultado.eh_planta is False
        assert resultado.nome_popular == "Nao identificada"

    def test_json_invalido_apos_retry_levanta_erro(
        self, gemini_service, imagem_jpeg_valida
    ):
        mock_response = MagicMock()
        mock_response.text = "isto nao e json {"
        gemini_service.model.generate_content.return_value = mock_response

        with pytest.raises(GeminiInvalidResponseError, match="formato esperado"):
            gemini_service.diagnosticar(imagem_jpeg_valida)

        assert gemini_service.model.generate_content.call_count == 2

    def test_schema_invalido_apos_retry_levanta_erro(
        self, gemini_service, imagem_jpeg_valida
    ):
        json_sem_campos = {"eh_planta": True}
        gemini_service.model.generate_content.return_value = mock_gemini_response(
            json_sem_campos
        )

        with pytest.raises(GeminiInvalidResponseError, match="schema"):
            gemini_service.diagnosticar(imagem_jpeg_valida)

        assert gemini_service.model.generate_content.call_count == 2


class TestRetry:
    """Testes do mecanismo de retry."""

    def test_retry_funciona_na_segunda_tentativa(
        self, gemini_service, imagem_jpeg_valida, resposta_planta_saudavel
    ):
        mock_ruim = MagicMock()
        mock_ruim.text = "json truncado {"
        mock_bom = mock_gemini_response(resposta_planta_saudavel)

        gemini_service.model.generate_content.side_effect = [mock_ruim, mock_bom]

        resultado = gemini_service.diagnosticar(imagem_jpeg_valida)
        assert resultado.eh_planta is True
        assert gemini_service.model.generate_content.call_count == 2

    def test_erro_na_chamada_gemini_nao_faz_retry(
        self, gemini_service, imagem_jpeg_valida
    ):
        gemini_service.model.generate_content.side_effect = Exception("timeout")

        with pytest.raises(GeminiServiceError, match="Falha ao chamar Gemini"):
            gemini_service.diagnosticar(imagem_jpeg_valida)

        assert gemini_service.model.generate_content.call_count == 1
