"""
Fixtures compartilhadas para os testes do Terra Gentil.
"""
import io
import json
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app


@pytest.fixture()
def client():
    """Client HTTP de teste do FastAPI."""
    return TestClient(app)


@pytest.fixture()
def imagem_jpeg_valida() -> bytes:
    """Gera bytes de uma imagem JPEG 100x100 valida."""
    img = Image.new("RGB", (100, 100), color=(0, 128, 0))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


@pytest.fixture()
def imagem_png_valida() -> bytes:
    """Gera bytes de uma imagem PNG 100x100 valida."""
    img = Image.new("RGB", (100, 100), color=(34, 139, 34))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


@pytest.fixture()
def resposta_planta_saudavel() -> dict:
    """JSON de exemplo de resposta do Gemini pra planta saudavel."""
    return {
        "eh_planta": True,
        "especie_identificada": "Dieffenbachia seguine",
        "nome_popular": "Comigo-ninguem-pode",
        "confianca": 0.92,
        "estado_saude": "saudavel",
        "toxica_para_pets": True,
        "toxicidade_detalhes": "Contem oxalato de calcio",
        "nivel_luz": "indireta_brilhante",
        "rega_dias": 7,
        "rega_condicao": "quando o solo estiver seco ao toque",
        "temperatura_ideal": "18 a 27 graus",
        "nivel_dificuldade": "facil",
        "luz_porcentagem": 65,
        "luz_veredito": "Sua foto esta bem iluminada",
        "diagnostico_titulo": "Saudavel",
        "diagnostico_explicacao": "Planta com otimo aspecto",
        "problemas_detectados": [],
        "plano_tratamento": "Mantenha os cuidados atuais",
        "plano_timeline": [
            {"etapa": "Esta semana", "acao": "Regue normalmente"},
        ],
        "precisa_retorno": False,
        "mensagem_retorno": "",
    }


@pytest.fixture()
def resposta_nao_planta() -> dict:
    """JSON de exemplo de resposta do Gemini pra imagem sem planta."""
    return {
        "eh_planta": False,
        "especie_identificada": "Nao identificada",
        "nome_popular": "Nao identificada",
        "confianca": 0.0,
        "estado_saude": "nao_aplicavel",
        "toxica_para_pets": False,
        "toxicidade_detalhes": "",
        "nivel_luz": "nao_aplicavel",
        "rega_dias": 0,
        "rega_condicao": "",
        "temperatura_ideal": "",
        "nivel_dificuldade": "nao_aplicavel",
        "luz_porcentagem": 0,
        "luz_veredito": "",
        "diagnostico_titulo": "",
        "diagnostico_explicacao": "",
        "problemas_detectados": [],
        "plano_tratamento": "Nao foi possivel identificar uma planta nesta imagem.",
        "plano_timeline": [],
        "precisa_retorno": False,
        "mensagem_retorno": "",
    }


def mock_gemini_response(json_data: dict) -> MagicMock:
    """Cria um mock de resposta do Gemini com o JSON dado."""
    mock_response = MagicMock()
    mock_response.text = json.dumps(json_data)
    return mock_response
