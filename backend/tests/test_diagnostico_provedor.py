"""
Testes da escolha de provedor (Claude ou Gemini) e da reserva no Gemini.

Claude e Gemini sempre mockados.
"""
import asyncio
import io
from unittest.mock import MagicMock, patch

import anthropic
import httpx2
import pytest
from PIL import Image

from app.core.config import settings
from app.routes import diagnostico as rota
from app.schemas.diagnostico import DiagnosticoResponse
from app.services.claude_service import ClaudeServiceError
from app.services.gemini_service import GeminiQuotaError, GeminiTimeoutError
from app.services.trava_diaria import TravaDiaria, trava_claude

from .v2_fixtures import cliente_mock, mensagem_sdk, resposta_v2_planta

_REQ = httpx2.Request("POST", "https://api.anthropic.com/v1/messages")


def _png() -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (60, 40), "green").save(buf, "PNG")
    return buf.getvalue()


def _post(client):
    return client.post("/v1/diagnostico", files={"file": ("a.png", _png(), "image/png")})


@pytest.fixture(autouse=True)
def _claude_ligado(monkeypatch):
    monkeypatch.setattr(settings, "ANTHROPIC_API_KEY", "chave-fake-de-teste")
    monkeypatch.setattr(settings, "CLAUDE_ROLLOUT_PERCENT", 100)
    monkeypatch.setattr(settings, "CLAUDE_DAILY_LIMIT", 100)
    trava_claude.zerar()
    yield
    trava_claude.zerar()


@pytest.fixture()
def gemini_ok(resposta_planta_saudavel):
    with patch("app.routes.diagnostico.GeminiService") as svc:
        svc.return_value.diagnosticar.return_value = DiagnosticoResponse(**resposta_planta_saudavel)
        yield svc


def _claude_com(cliente):
    """Faz a rota usar um ClaudeService com o cliente falso."""
    from app.services.claude_service import ClaudeService

    return patch.object(rota, "ClaudeService", lambda: ClaudeService(client=cliente))


class TestEscolhaDeProvedor:
    def test_sem_chave_vai_ao_gemini(self, monkeypatch):
        monkeypatch.setattr(settings, "ANTHROPIC_API_KEY", "")
        assert rota.escolher_provedor() == ("gemini", "sem_chave")
        assert trava_claude.usados_hoje() == 0

    def test_liberacao_zero_vai_ao_gemini(self, monkeypatch):
        monkeypatch.setattr(settings, "CLAUDE_ROLLOUT_PERCENT", 0)
        for _ in range(200):
            assert rota.escolher_provedor() == ("gemini", "fora_da_liberacao")
        assert trava_claude.usados_hoje() == 0

    def test_liberacao_cem_vai_ao_claude(self):
        for _ in range(50):
            assert rota.escolher_provedor() == ("claude", "liberado")
        assert trava_claude.usados_hoje() == 50

    def test_liberacao_parcial_respeita_sorteio(self, monkeypatch):
        monkeypatch.setattr(settings, "CLAUDE_ROLLOUT_PERCENT", 30)
        with patch.object(rota.random, "uniform", return_value=29.9):
            assert rota.escolher_provedor()[0] == "claude"
        with patch.object(rota.random, "uniform", return_value=30.0):
            assert rota.escolher_provedor()[0] == "gemini"

    def test_trava_estourada_vai_ao_gemini(self, monkeypatch):
        monkeypatch.setattr(settings, "CLAUDE_DAILY_LIMIT", 2)
        assert rota.escolher_provedor()[0] == "claude"
        assert rota.escolher_provedor()[0] == "claude"
        assert rota.escolher_provedor() == ("gemini", "trava_diaria")

    def test_trava_zera_na_virada_do_dia(self):
        trava = TravaDiaria()
        with patch("app.services.trava_diaria.hoje_brasilia", return_value="2026-11-17"):
            assert trava.reservar(1) is True
            assert trava.reservar(1) is False
        with patch("app.services.trava_diaria.hoje_brasilia", return_value="2026-11-18"):
            assert trava.reservar(1) is True


class TestRotaComClaude:
    def test_desligado_por_padrao_usa_gemini_sem_tocar_no_claude(self, client, gemini_ok, monkeypatch):
        monkeypatch.setattr(settings, "ANTHROPIC_API_KEY", "")
        with patch.object(rota, "ClaudeService") as claude:
            resp = _post(client)
        assert resp.status_code == 200
        assert "versao_relatorio" not in resp.json()
        claude.assert_not_called()
        gemini_ok.return_value.diagnosticar.assert_called_once()
        assert gemini_ok.return_value.diagnosticar.call_args.kwargs == {}

    def test_claude_ok_devolve_v2_completo(self, client, gemini_ok):
        with _claude_com(cliente_mock()):
            resp = _post(client)
        assert resp.status_code == 200
        data = resp.json()
        esperado = resposta_v2_planta()
        assert data["versao_relatorio"] == "v2"
        for campo in ("foto", "leitura_foto", "identificacao", "acompanhamento", "toxicidade",
                      "curiosidades", "ajuda_profissional", "rega_ml", "vaso_estimado_cm"):
            assert data[campo] == esperado[campo], campo
        assert data["plano_timeline"][0]["tipo"] == "manejo"
        # Campos v1 que o backend deriva, para a tela v1 publicada continuar completa
        assert data["cuidados"] == esperado["cuidados"] | {
            "rega": esperado["rega_condicao"],
            "luz_e_local": data["cuidados"]["luz_e_local"],
        }
        assert data["cuidados"]["luz_e_local"]
        assert data["calendario_cuidados"] == []
        assert data["precisa_retorno"] is True
        assert "7 dias" in data["mensagem_retorno"]
        assert data["toxica_para_pets"] is True
        assert data["toxicidade_detalhes"] == "Partes tóxicas: folhas e caule. Sintomas: salivação."
        assert data["problemas_detectados"][0]["categoria"] == "rega_excesso"
        assert data["plano_timeline"][0]["como_fazer"] == "Espere o solo secar."
        [ebook] = data["ebooks_recomendados"]
        assert ebook["id"] == "TG074" and ebook["titulo"] == "Espada-de-são-jorge"
        assert ebook["pdf"].endswith("/TG074.pdf")
        gemini_ok.return_value.diagnosticar.assert_not_called()


class TestReservaNoGemini:
    @pytest.mark.parametrize(
        "cliente",
        [
            cliente_mock(erro=anthropic.APITimeoutError(request=_REQ)),
            cliente_mock(erro=anthropic.RateLimitError(
                "cota", response=httpx2.Response(429, request=_REQ), body=None)),
            cliente_mock(erro=anthropic.EnforcedSpendLimitReachedError(
                "gasto", response=httpx2.Response(429, request=_REQ), body=None)),
            cliente_mock(erro=anthropic.PaymentRequiredError(
                "credito", response=httpx2.Response(402, request=_REQ), body=None)),
            cliente_mock(erro=anthropic.InternalServerError(
                "500", response=httpx2.Response(500, request=_REQ), body=None)),
            cliente_mock(erro=anthropic.APIConnectionError(request=_REQ)),
            cliente_mock(mensagem_sdk(stop_reason="refusal")),
            cliente_mock(mensagem_sdk(stop_reason="max_tokens")),
            cliente_mock(mensagem_sdk({"versao_relatorio": "v2"})),
            cliente_mock(mensagem_sdk(texto="isso nao e json")),
        ],
        ids=["timeout", "429", "limite_gasto", "credito", "500", "conexao",
             "recusa", "max_tokens", "fora_do_schema", "json_quebrado"],
    )
    def test_falha_do_claude_cai_no_gemini_v1(self, client, gemini_ok, cliente, caplog):
        with _claude_com(cliente):
            resp = _post(client)
        assert resp.status_code == 200
        assert "versao_relatorio" not in resp.json()
        assert resp.json()["especie_identificada"] == "Dieffenbachia seguine"
        chamada = gemini_ok.return_value.diagnosticar.call_args
        assert chamada.kwargs == {"tentativas": 1}
        assert "usando Gemini como reserva" in caplog.text

    def test_demora_alem_do_limite_da_rota_cai_no_gemini(self, client, gemini_ok, monkeypatch):
        monkeypatch.setattr(settings, "CLAUDE_TIMEOUT_S", 0.05)
        monkeypatch.setattr(rota, "CLAUDE_FOLGA_S", 0)

        class Lento:
            async def diagnosticar(self, _):
                await asyncio.sleep(5)

        with patch.object(rota, "ClaudeService", Lento):
            resp = _post(client)
        assert resp.status_code == 200
        assert gemini_ok.return_value.diagnosticar.call_args.kwargs == {"tentativas": 1}

    def test_erro_inesperado_no_claude_cai_no_gemini(self, client, gemini_ok):
        with patch.object(rota, "ClaudeService", side_effect=RuntimeError("bug")):
            resp = _post(client)
        assert resp.status_code == 200

    def test_trava_estourada_nao_chama_claude(self, client, gemini_ok, monkeypatch):
        monkeypatch.setattr(settings, "CLAUDE_DAILY_LIMIT", 0)
        with patch.object(rota, "ClaudeService") as claude:
            resp = _post(client)
        assert resp.status_code == 200
        claude.assert_not_called()
        assert gemini_ok.return_value.diagnosticar.call_args.kwargs == {}

    def test_falha_conta_na_trava(self, client, gemini_ok):
        with _claude_com(cliente_mock(erro=anthropic.APIConnectionError(request=_REQ))):
            _post(client)
        assert trava_claude.usados_hoje() == 1

    def test_os_dois_falham_mantem_codigos_atuais(self, client):
        with _claude_com(cliente_mock(erro=ClaudeServiceError("x"))), \
                patch("app.routes.diagnostico.GeminiService") as svc:
            svc.return_value.diagnosticar.side_effect = GeminiQuotaError("cota")
            resp = _post(client)
        assert resp.status_code == 429
        assert resp.json()["detail"]["error_code"] == "GEMINI_QUOTA"

        with _claude_com(cliente_mock(erro=ClaudeServiceError("x"))), \
                patch("app.routes.diagnostico.GeminiService") as svc:
            svc.return_value.diagnosticar.side_effect = GeminiTimeoutError("lento")
            resp = _post(client)
        assert resp.status_code == 504
        assert resp.json()["detail"]["error_code"] == "GEMINI_TIMEOUT"
