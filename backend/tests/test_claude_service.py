"""
Testes do ClaudeService (diagnostico v2), sempre com cliente falso.
"""
import base64
import io
import json
import logging

import anthropic
import httpx2
import pytest
from PIL import Image

from app.core.config import settings
from app.schemas.diagnostico_v2 import DiagnosticoV2Response
from app.schemas.diagnostico_v2_schema import DIAGNOSTICO_V2_JSON_SCHEMA
from app.services.claude_service import (
    LADO_MAXIMO_PX,
    ClaudeService,
    ClaudeServiceError,
    preparar_imagem,
)

from .v2_fixtures import cliente_mock, mensagem_sdk, resposta_v2_planta

_REQ = httpx2.Request("POST", "https://api.anthropic.com/v1/messages")


def erro_status(classe, status: int):
    return classe("erro", response=httpx2.Response(status, request=_REQ), body=None)


def _imagem(largura: int, altura: int, formato: str = "JPEG", modo: str = "RGB") -> bytes:
    buf = io.BytesIO()
    Image.new(modo, (largura, altura), (0, 128, 0) if modo == "RGB" else (0, 128, 0, 128)).save(
        buf, format=formato
    )
    return buf.getvalue()


@pytest.fixture(autouse=True)
def _chave_fake(monkeypatch):
    monkeypatch.setattr(settings, "ANTHROPIC_API_KEY", "chave-fake-de-teste")
    monkeypatch.setattr(settings, "CLAUDE_EFFORT", "low")


class TestPrepararImagem:
    def test_reduz_lado_maior_para_1568(self):
        jpeg, original, final = preparar_imagem(_imagem(4000, 3000))
        assert original == (4000, 3000)
        assert max(final) == LADO_MAXIMO_PX
        assert final == (1568, 1176)
        img = Image.open(io.BytesIO(jpeg))
        assert img.format == "JPEG"
        assert img.size == final

    def test_retrato_tambem_limita_lado_maior(self):
        _, _, final = preparar_imagem(_imagem(3000, 4000))
        assert final == (1176, 1568)

    def test_imagem_pequena_nao_aumenta(self):
        _, _, final = preparar_imagem(_imagem(800, 600))
        assert final == (800, 600)

    def test_png_com_transparencia_vira_jpeg(self):
        jpeg, _, _ = preparar_imagem(_imagem(200, 100, "PNG", "RGBA"))
        assert Image.open(io.BytesIO(jpeg)).mode == "RGB"

    def test_aplica_orientacao_exif(self):
        img = Image.new("RGB", (400, 200), "green")
        exif = Image.Exif()
        exif[0x0112] = 6  # foto deitada: girar 90 graus
        buf = io.BytesIO()
        img.save(buf, format="JPEG", exif=exif)
        _, _, final = preparar_imagem(buf.getvalue())
        assert final == (200, 400)

    def test_imagem_corrompida(self):
        with pytest.raises(ClaudeServiceError) as exc:
            preparar_imagem(b"nao-sou-imagem")
        assert exc.value.motivo == "imagem_invalida"


class TestRequisicao:
    async def test_monta_cache_schema_effort_e_imagem(self):
        cliente = cliente_mock()
        await ClaudeService(client=cliente).diagnosticar(_imagem(3000, 2000))

        params = cliente.messages.create.await_args.kwargs
        assert params["model"] == settings.CLAUDE_MODEL
        assert params["max_tokens"] == settings.CLAUDE_MAX_TOKENS
        assert "thinking" not in params  # Opus 5.5: so effort controla o raciocinio

        system = params["system"]
        assert len(system) == 2
        assert "cache_control" not in system[0]
        assert system[1]["cache_control"] == {"type": "ephemeral", "ttl": "1h"}
        assert system[0]["text"].startswith("Você é o Doutor Gentileza")
        assert "{CATALOGO_EBOOKS}" not in system[0]["text"] + system[1]["text"]

        # Sem gramatica forcada: o schema vai no prefixo em cache (limite da API, fase 2)
        assert params["output_config"] == {"effort": "low"}
        esperado = json.dumps(DIAGNOSTICO_V2_JSON_SCHEMA, ensure_ascii=False, separators=(",", ":"))
        assert system[0]["text"].endswith(esperado)

        conteudo = params["messages"][0]["content"]
        assert conteudo[0]["type"] == "image"
        assert conteudo[0]["source"]["media_type"] == "image/jpeg"
        enviada = Image.open(io.BytesIO(base64.b64decode(conteudo[0]["source"]["data"])))
        assert max(enviada.size) == LADO_MAXIMO_PX
        assert conteudo[1]["text"].startswith("Data de hoje: ")

    async def test_system_estavel_entre_chamadas(self):
        cliente = cliente_mock()
        service = ClaudeService(client=cliente)
        await service.diagnosticar(_imagem(100, 100))
        await service.diagnosticar(_imagem(200, 150))
        a, b = (c.kwargs for c in cliente.messages.create.await_args_list)
        assert a["system"] == b["system"]
        assert json.dumps(a["output_config"], sort_keys=False) == json.dumps(
            b["output_config"], sort_keys=False
        )

    def test_sem_chave_nao_inicia(self, monkeypatch):
        monkeypatch.setattr(settings, "ANTHROPIC_API_KEY", "")
        with pytest.raises(ClaudeServiceError) as exc:
            ClaudeService(client=cliente_mock())
        assert exc.value.motivo == "sem_chave"


class TestResposta:
    async def test_resposta_valida_vira_v2(self):
        rel = await ClaudeService(client=cliente_mock()).diagnosticar(_imagem(100, 100))
        assert isinstance(rel, DiagnosticoV2Response)
        assert rel.versao_relatorio == "v2"
        assert rel.problemas_detectados[0].evidencia_visual
        assert rel.toxicidade.nivel == "leve"

    async def test_json_com_cercas_ou_texto_em_volta_e_aceito(self):
        texto = "Segue o relatorio:\n```json\n" + json.dumps(resposta_v2_planta()) + "\n```"
        cliente = cliente_mock(mensagem_sdk(texto=texto))
        rel = await ClaudeService(client=cliente).diagnosticar(_imagem(100, 100))
        assert rel.versao_relatorio == "v2"

    async def test_ebooks_ficam_vazios_sem_catalogo(self):
        rel = await ClaudeService(client=cliente_mock()).diagnosticar(_imagem(100, 100))
        assert rel.ebooks_recomendados == []

    async def test_numeros_fora_da_faixa_sao_ajustados(self):
        dados = resposta_v2_planta() | {"confianca": 1.4, "rega_dias": 90, "luz_porcentagem": -5}
        cliente = cliente_mock(mensagem_sdk(dados))
        rel = await ClaudeService(client=cliente).diagnosticar(_imagem(100, 100))
        assert (rel.confianca, rel.rega_dias, rel.luz_porcentagem) == (1.0, 60, 0)

    @pytest.mark.parametrize("stop_reason", ["refusal", "max_tokens"])
    async def test_stop_reason_vira_falha(self, stop_reason):
        cliente = cliente_mock(mensagem_sdk(stop_reason=stop_reason))
        with pytest.raises(ClaudeServiceError) as exc:
            await ClaudeService(client=cliente).diagnosticar(_imagem(100, 100))
        assert exc.value.motivo == ("recusa" if stop_reason == "refusal" else "max_tokens")

    async def test_json_fora_do_schema(self):
        cliente = cliente_mock(mensagem_sdk({"versao_relatorio": "v2", "eh_planta": True}))
        with pytest.raises(ClaudeServiceError) as exc:
            await ClaudeService(client=cliente).diagnosticar(_imagem(100, 100))
        assert exc.value.motivo == "fora_do_schema"

    async def test_json_quebrado(self):
        cliente = cliente_mock(mensagem_sdk(texto='{"versao_relatorio": "v2", '))
        with pytest.raises(ClaudeServiceError) as exc:
            await ClaudeService(client=cliente).diagnosticar(_imagem(100, 100))
        assert exc.value.motivo == "fora_do_schema"

    async def test_usage_vai_para_o_log(self, caplog):
        caplog.set_level(logging.INFO, logger="app.services.claude_service")
        await ClaudeService(client=cliente_mock()).diagnosticar(_imagem(100, 100))
        linha = next(r.getMessage() for r in caplog.records if "Claude uso" in r.getMessage())
        for trecho in ("input=2400", "output=2900", "cache_read=3100", "cache_write=0", "tempo_ms="):
            assert trecho in linha
        assert "chave-fake" not in caplog.text


class TestErrosDaApi:
    @pytest.mark.parametrize(
        "erro, motivo",
        [
            (anthropic.APITimeoutError(request=_REQ), "timeout"),
            (erro_status(anthropic.RateLimitError, 429), "limite_429"),
            (erro_status(anthropic.EnforcedSpendLimitReachedError, 429), "limite_429"),
            (erro_status(anthropic.PaymentRequiredError, 402), "erro_api_402"),
            (erro_status(anthropic.BadRequestError, 400), "erro_api_400"),
            (erro_status(anthropic.OverloadedError, 529), "erro_api_529"),
            (anthropic.APIConnectionError(request=_REQ), "conexao"),
        ],
    )
    async def test_erros_viram_motivo(self, erro, motivo):
        with pytest.raises(ClaudeServiceError) as exc:
            await ClaudeService(client=cliente_mock(erro=erro)).diagnosticar(_imagem(100, 100))
        assert exc.value.motivo == motivo


def test_cliente_padrao_sem_retentativa_e_com_limite(monkeypatch):
    from app.services import claude_service

    monkeypatch.setattr(claude_service, "_cliente", None)
    cliente = claude_service._obter_cliente()
    assert cliente.max_retries == 0
    assert cliente.timeout == settings.CLAUDE_TIMEOUT_S
    monkeypatch.setattr(claude_service, "_cliente", None)
