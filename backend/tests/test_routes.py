"""
Testes das rotas HTTP da API Terra Gentil.

Usa TestClient do FastAPI com mock do GeminiService
pra testar validacoes, status codes e formato de resposta
sem chamar a API do Gemini de verdade.
"""
import json
from unittest.mock import MagicMock, patch

import pytest

from app.schemas.diagnostico import DiagnosticoResponse
from app.services.gemini_service import GeminiInvalidResponseError, GeminiServiceError

from .conftest import mock_gemini_response


class TestHealthCheck:
    """Testes do endpoint GET /health."""

    def test_health_retorna_200(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200

    def test_health_retorna_status_ok(self, client):
        data = client.get("/health").json()
        assert data["status"] == "ok"
        assert "version" in data
        assert "environment" in data


class TestRoot:
    """Testes do endpoint GET /."""

    def test_root_retorna_200(self, client):
        resp = client.get("/")
        assert resp.status_code == 200

    def test_root_retorna_app_name(self, client):
        data = client.get("/").json()
        assert "app" in data
        assert "version" in data
        assert "docs" in data


class TestDiagnosticoValidacoes:
    """Testes de validacao de entrada do POST /v1/diagnostico."""

    def test_sem_arquivo_retorna_422(self, client):
        resp = client.post("/v1/diagnostico")
        assert resp.status_code == 422

    def test_content_type_invalido_retorna_415(self, client):
        resp = client.post(
            "/v1/diagnostico",
            files={"file": ("teste.txt", b"nao sou imagem", "text/plain")},
        )
        assert resp.status_code == 415
        data = resp.json()
        assert data["detail"]["error_code"] == "UNSUPPORTED_MEDIA_TYPE"

    def test_arquivo_vazio_retorna_400(self, client):
        resp = client.post(
            "/v1/diagnostico",
            files={"file": ("vazia.jpg", b"", "image/jpeg")},
        )
        assert resp.status_code == 400
        data = resp.json()
        assert data["detail"]["error_code"] == "EMPTY_FILE"

    def test_arquivo_grande_demais_retorna_413(self, client):
        dados_11mb = b"x" * (11 * 1024 * 1024)
        resp = client.post(
            "/v1/diagnostico",
            files={"file": ("grande.jpg", dados_11mb, "image/jpeg")},
        )
        assert resp.status_code == 413
        data = resp.json()
        assert data["detail"]["error_code"] == "FILE_TOO_LARGE"

    def test_jpeg_aceito(self, client):
        """Content type JPEG nao e rejeitado na validacao."""
        resp = client.post(
            "/v1/diagnostico",
            files={"file": ("foto.jpg", b"\xff\xd8\xff", "image/jpeg")},
        )
        # Nao deve ser 415 (pode ser outro erro pq a imagem nao e valida pro Gemini)
        assert resp.status_code != 415

    def test_png_aceito(self, client):
        resp = client.post(
            "/v1/diagnostico",
            files={"file": ("foto.png", b"\x89PNG", "image/png")},
        )
        assert resp.status_code != 415

    def test_webp_aceito(self, client):
        resp = client.post(
            "/v1/diagnostico",
            files={"file": ("foto.webp", b"RIFF", "image/webp")},
        )
        assert resp.status_code != 415


class TestDiagnosticoComMock:
    """Testes do fluxo completo com GeminiService mockado."""

    @patch("app.routes.diagnostico.GeminiService")
    def test_diagnostico_planta_saudavel(
        self, MockGemini, client, imagem_jpeg_valida, resposta_planta_saudavel
    ):
        mock_service = MagicMock()
        mock_service.diagnosticar.return_value = DiagnosticoResponse(
            **resposta_planta_saudavel
        )
        MockGemini.return_value = mock_service

        resp = client.post(
            "/v1/diagnostico",
            files={"file": ("planta.jpg", imagem_jpeg_valida, "image/jpeg")},
        )

        assert resp.status_code == 200
        data = resp.json()
        assert data["eh_planta"] is True
        assert data["especie_identificada"] == "Dieffenbachia seguine"
        assert data["estado_saude"] == "saudavel"
        assert 0 <= data["confianca"] <= 1

    @patch("app.routes.diagnostico.GeminiService")
    def test_diagnostico_nao_planta(
        self, MockGemini, client, imagem_jpeg_valida, resposta_nao_planta
    ):
        mock_service = MagicMock()
        mock_service.diagnosticar.return_value = DiagnosticoResponse(
            **resposta_nao_planta
        )
        MockGemini.return_value = mock_service

        resp = client.post(
            "/v1/diagnostico",
            files={"file": ("teclado.jpg", imagem_jpeg_valida, "image/jpeg")},
        )

        assert resp.status_code == 200
        data = resp.json()
        assert data["eh_planta"] is False
        assert data["estado_saude"] == "nao_aplicavel"

    @patch("app.routes.diagnostico.GeminiService")
    def test_resposta_contem_21_campos(
        self, MockGemini, client, imagem_jpeg_valida, resposta_planta_saudavel
    ):
        mock_service = MagicMock()
        mock_service.diagnosticar.return_value = DiagnosticoResponse(
            **resposta_planta_saudavel
        )
        MockGemini.return_value = mock_service

        resp = client.post(
            "/v1/diagnostico",
            files={"file": ("planta.jpg", imagem_jpeg_valida, "image/jpeg")},
        )

        data = resp.json()
        campos_esperados = [
            "eh_planta", "especie_identificada", "nome_popular", "confianca",
            "estado_saude", "toxica_para_pets", "toxicidade_detalhes",
            "nivel_luz", "rega_dias", "rega_condicao", "temperatura_ideal",
            "nivel_dificuldade", "luz_porcentagem", "luz_veredito",
            "diagnostico_titulo", "diagnostico_explicacao",
            "problemas_detectados", "plano_tratamento", "plano_timeline",
            "precisa_retorno", "mensagem_retorno",
        ]
        for campo in campos_esperados:
            assert campo in data, f"Campo {campo} ausente na resposta"

    @patch("app.routes.diagnostico.GeminiService")
    def test_gemini_invalid_response_retorna_502(
        self, MockGemini, client, imagem_jpeg_valida
    ):
        mock_service = MagicMock()
        mock_service.diagnosticar.side_effect = GeminiInvalidResponseError(
            "JSON truncado"
        )
        MockGemini.return_value = mock_service

        resp = client.post(
            "/v1/diagnostico",
            files={"file": ("planta.jpg", imagem_jpeg_valida, "image/jpeg")},
        )

        assert resp.status_code == 502
        data = resp.json()
        assert data["detail"]["error_code"] == "GEMINI_INVALID_RESPONSE"

    @patch("app.routes.diagnostico.GeminiService")
    def test_gemini_service_error_retorna_502(
        self, MockGemini, client, imagem_jpeg_valida
    ):
        mock_service = MagicMock()
        mock_service.diagnosticar.side_effect = GeminiServiceError(
            "Falha ao chamar Gemini"
        )
        MockGemini.return_value = mock_service

        resp = client.post(
            "/v1/diagnostico",
            files={"file": ("planta.jpg", imagem_jpeg_valida, "image/jpeg")},
        )

        assert resp.status_code == 502
        data = resp.json()
        assert data["detail"]["error_code"] == "GEMINI_ERROR"

    @patch("app.routes.diagnostico.GeminiService")
    def test_erro_inesperado_retorna_500(
        self, MockGemini, client, imagem_jpeg_valida
    ):
        mock_service = MagicMock()
        mock_service.diagnosticar.side_effect = RuntimeError("algo quebrou")
        MockGemini.return_value = mock_service

        resp = client.post(
            "/v1/diagnostico",
            files={"file": ("planta.jpg", imagem_jpeg_valida, "image/jpeg")},
        )

        assert resp.status_code == 500
        data = resp.json()
        assert data["detail"]["error_code"] == "INTERNAL_ERROR"

    @patch("app.routes.diagnostico.GeminiService")
    def test_png_valido_funciona(
        self, MockGemini, client, imagem_png_valida, resposta_planta_saudavel
    ):
        mock_service = MagicMock()
        mock_service.diagnosticar.return_value = DiagnosticoResponse(
            **resposta_planta_saudavel
        )
        MockGemini.return_value = mock_service

        resp = client.post(
            "/v1/diagnostico",
            files={"file": ("planta.png", imagem_png_valida, "image/png")},
        )

        assert resp.status_code == 200
